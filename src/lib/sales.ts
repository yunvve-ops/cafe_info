import Decimal from "decimal.js";
import { randomUUID } from "node:crypto";
import type { PGlite } from "@electric-sql/pglite";

export type Seed = {
  materials: Array<Record<string, unknown>>;
  menus: Array<Record<string, unknown>>;
  recipes: Array<Record<string, unknown>>;
  price_history: Array<Record<string, unknown>>;
  sales: Array<Record<string, unknown>>;
};

export type SaleInput = {
  date: string;
  menuId: string;
  channel: string;
  quantity: string | number;
  unitPrice: string | number;
  discountAmount: string | number;
  paymentFee: string | number;
};

const seedReadiness = new WeakMap<PGlite, Promise<void>>();

export class InputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputError";
  }
}

export function koreaToday(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function decimalInput(value: unknown, label: string): Decimal {
  if (value === null || value === undefined || String(value).trim() === "") {
    throw new InputError(`${label}을(를) 입력해 주세요.`);
  }
  let valueAsDecimal: Decimal;
  try {
    valueAsDecimal = new Decimal(String(value));
  } catch {
    throw new InputError(`${label}은(는) 숫자로 입력해 주세요.`);
  }
  if (!valueAsDecimal.isFinite() || valueAsDecimal.isNegative()) {
    throw new InputError(`${label}은(는) 0 이상이어야 합니다.`);
  }
  return valueAsDecimal;
}

export function calculateSalesAmounts(input: Pick<SaleInput, "quantity" | "unitPrice" | "discountAmount">) {
  const quantity = decimalInput(input.quantity, "수량");
  if (!quantity.isInteger() || quantity.isZero()) {
    throw new InputError("수량은 1 이상의 정수로 입력해 주세요.");
  }
  const unitPrice = decimalInput(input.unitPrice, "실제 판매 단가");
  const discountAmount = decimalInput(input.discountAmount, "할인액");
  const grossSales = quantity.mul(unitPrice);
  if (discountAmount.gt(grossSales)) {
    throw new InputError("할인액은 수량과 단가를 곱한 금액을 넘을 수 없습니다.");
  }
  return {
    quantity,
    unitPrice,
    discountAmount,
    grossSales,
    netSales: grossSales.minus(discountAmount),
  };
}

export async function createSchema(db: PGlite) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS seed_state (
      source_key text PRIMARY KEY,
      loaded_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS menus (
      menu_id text PRIMARY KEY,
      name text NOT NULL,
      price numeric NOT NULL,
      category text,
      recipe_version text
    );
    CREATE TABLE IF NOT EXISTS materials (
      material_id text PRIMARY KEY,
      name text NOT NULL,
      unit text NOT NULL,
      pack_quantity numeric,
      base_pack_price numeric,
      lead_days numeric,
      safety_days numeric,
      supplier_id text
    );
    CREATE TABLE IF NOT EXISTS recipes (
      recipe_version text NOT NULL,
      menu_id text NOT NULL REFERENCES menus(menu_id),
      material_id text NOT NULL REFERENCES materials(material_id),
      quantity numeric NOT NULL,
      unit text NOT NULL,
      applicable_channel text,
      PRIMARY KEY (recipe_version, menu_id, material_id)
    );
    CREATE TABLE IF NOT EXISTS price_history (
      material_id text NOT NULL REFERENCES materials(material_id),
      effective_date date NOT NULL,
      pack_price numeric NOT NULL,
      pack_quantity numeric NOT NULL,
      PRIMARY KEY (material_id, effective_date)
    );
    CREATE TABLE IF NOT EXISTS sales (
      sale_id text PRIMARY KEY,
      sale_date date NOT NULL,
      menu_id text NOT NULL REFERENCES menus(menu_id),
      channel text NOT NULL,
      quantity numeric NOT NULL CHECK (quantity > 0),
      unit_price numeric NOT NULL CHECK (unit_price >= 0),
      discount_amount numeric NOT NULL CHECK (discount_amount >= 0),
      net_sales numeric NOT NULL CHECK (net_sales >= 0),
      payment_fee numeric NOT NULL CHECK (payment_fee >= 0),
      recipe_version text,
      unit_food_cost_snapshot numeric,
      unit_packaging_cost_snapshot numeric,
      UNIQUE (sale_date, menu_id, channel)
    );
    CREATE INDEX IF NOT EXISTS sales_date_idx ON sales(sale_date);
    CREATE INDEX IF NOT EXISTS recipes_menu_idx ON recipes(menu_id, recipe_version);
  `);
}

type TableSeed = { table: string; columns: string[]; records: Array<Record<string, unknown>> };

async function insertSeedRows(db: PGlite, table: TableSeed) {
  const chunkSize = 200;
  for (let offset = 0; offset < table.records.length; offset += chunkSize) {
    const rows = table.records.slice(offset, offset + chunkSize);
    const params: Array<string | number | null> = [];
    const valueSql = rows.map((row, rowIndex) => {
      const marks = table.columns.map((column, columnIndex) => {
        const value = row[column];
        params.push(value === null || value === undefined ? null : String(value));
        return `$${rowIndex * table.columns.length + columnIndex + 1}`;
      });
      return `(${marks.join(",")})`;
    });
    await db.query(
      `INSERT INTO ${table.table} (${table.columns.join(",")}) VALUES ${valueSql.join(",")}`,
      params,
    );
  }
}

export async function initializeDatabase(db: PGlite, seed: Seed) {
  await createSchema(db);
  const seeded = await db.query<{ source_key: string }>(
    "SELECT source_key FROM seed_state WHERE source_key = $1",
    ["cafe-sample-workbook-v1"],
  );
  if (seeded.rows.length > 0) return { seeded: false };

  await db.exec("BEGIN");
  try {
    const tables: TableSeed[] = [
      { table: "materials", columns: ["material_id", "name", "unit", "pack_quantity", "base_pack_price", "lead_days", "safety_days", "supplier_id"], records: seed.materials },
      { table: "menus", columns: ["menu_id", "name", "price", "category", "recipe_version"], records: seed.menus },
      { table: "recipes", columns: ["recipe_version", "menu_id", "material_id", "quantity", "unit", "applicable_channel"], records: seed.recipes },
      { table: "price_history", columns: ["material_id", "effective_date", "pack_price", "pack_quantity"], records: seed.price_history },
      { table: "sales", columns: ["sale_id", "sale_date", "menu_id", "channel", "quantity", "unit_price", "discount_amount", "net_sales", "payment_fee", "recipe_version", "unit_food_cost_snapshot", "unit_packaging_cost_snapshot"], records: seed.sales.map((row) => ({ ...row, sale_date: row.date })) },
    ];
    for (const table of tables) await insertSeedRows(db, table);
    await db.query("INSERT INTO seed_state (source_key) VALUES ($1)", ["cafe-sample-workbook-v1"]);
    await db.exec("COMMIT");
    return { seeded: true };
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

export async function readSeedFile(): Promise<Seed> {
  const { readFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  return JSON.parse(await readFile(join(process.cwd(), "data", "seed.json"), "utf8")) as Seed;
}

export async function ensureReady(db: PGlite) {
  let pending = seedReadiness.get(db);
  if (!pending) {
    pending = readSeedFile().then((seed) => initializeDatabase(db, seed)).then(() => undefined);
    seedReadiness.set(db, pending);
  }
  try {
    await pending;
  } catch (error) {
    seedReadiness.delete(db);
    throw error;
  }
}

export async function getReferenceData(db: PGlite) {
  const [menus, materials, channels, recipes] = await Promise.all([
    db.query("SELECT menu_id AS id, name, price::text AS price, category FROM menus ORDER BY menu_id"),
    db.query("SELECT material_id AS id, name, unit, pack_quantity::text AS pack_quantity FROM materials ORDER BY material_id"),
    db.query("SELECT DISTINCT channel FROM sales ORDER BY channel"),
    db.query("SELECT count(*)::text AS count FROM recipes"),
  ]);
  return {
    menus: menus.rows,
    materials: materials.rows,
    channels: channels.rows.map((row) => (row as { channel: string }).channel),
    recipeCount: Number((recipes.rows[0] as { count: string }).count),
  };
}

export async function calculateUnitCost(db: PGlite, menuId: string, date: string, channel: string) {
  const menuResult = await db.query<{ recipe_version: string | null }>(
    "SELECT recipe_version FROM menus WHERE menu_id = $1",
    [menuId],
  );
  if (menuResult.rows.length === 0 || !menuResult.rows[0].recipe_version) {
    return { foodCost: null, packagingCost: null, missingMaterials: ["레시피"] };
  }
  const recipeResult = await db.query<{
    material_id: string;
    name: string;
    recipe_unit: string;
    material_unit: string;
    quantity: string;
    applicable_channel: string | null;
    pack_price: string | null;
    pack_quantity: string | null;
  }>(
    `SELECT r.material_id, m.name, r.unit AS recipe_unit, m.unit AS material_unit, r.quantity::text AS quantity,
            r.applicable_channel, p.pack_price::text AS pack_price,
            p.pack_quantity::text AS pack_quantity
       FROM recipes r
       JOIN materials m ON m.material_id = r.material_id
       LEFT JOIN LATERAL (
         SELECT pack_price, pack_quantity FROM price_history
          WHERE material_id = r.material_id AND effective_date <= $1
          ORDER BY effective_date DESC LIMIT 1
       ) p ON true
      WHERE r.menu_id = $2 AND r.recipe_version = $3
        AND (r.applicable_channel IS NULL OR r.applicable_channel = '' OR r.applicable_channel = $4)
      ORDER BY r.material_id`,
    [date, menuId, menuResult.rows[0].recipe_version, channel],
  );
  if (recipeResult.rows.length === 0) {
    return { foodCost: null, packagingCost: null, missingMaterials: ["레시피"] };
  }

  let foodCost = new Decimal(0);
  let packagingCost = new Decimal(0);
  let foodComplete = true;
  let packagingComplete = true;
  const missingMaterials: string[] = [];
  for (const row of recipeResult.rows) {
    const isPackaging = row.applicable_channel === "포장";
    if (row.recipe_unit !== row.material_unit || !row.pack_price || !row.pack_quantity || new Decimal(row.pack_quantity).isZero()) {
      (isPackaging ? (packagingComplete = false) : (foodComplete = false));
      missingMaterials.push(row.name);
      continue;
    }
    const lineCost = new Decimal(row.pack_price).div(row.pack_quantity).mul(row.quantity);
    if (isPackaging) packagingCost = packagingCost.plus(lineCost);
    else foodCost = foodCost.plus(lineCost);
  }
  return {
    foodCost: foodComplete ? foodCost : null,
    packagingCost: packagingComplete ? packagingCost : null,
    missingMaterials,
  };
}

export async function saveSale(db: PGlite, input: SaleInput, today = koreaToday()) {
  if (!input || typeof input !== "object" || !isValidIsoDate(input.date)) {
    throw new InputError("판매일을 확인해 주세요.");
  }
  if (input.date > today) throw new InputError("미래 날짜의 판매는 등록할 수 없습니다.");
  if (typeof input.menuId !== "string" || !input.menuId.trim()) throw new InputError("메뉴를 선택해 주세요.");
  if (typeof input.channel !== "string" || !input.channel.trim()) throw new InputError("판매 채널을 선택해 주세요.");

  const amounts = calculateSalesAmounts(input);
  const paymentFee = decimalInput(input.paymentFee, "결제 수수료");
  const menuResult = await db.query<{ price: string; recipe_version: string | null }>(
    "SELECT price::text AS price, recipe_version FROM menus WHERE menu_id = $1",
    [input.menuId],
  );
  if (menuResult.rows.length === 0) throw new InputError("선택한 메뉴를 찾을 수 없습니다.");
  const channelResult = await db.query<{ channel: string }>("SELECT DISTINCT channel FROM sales WHERE channel = $1", [input.channel]);
  if (channelResult.rows.length === 0) throw new InputError("선택한 판매 채널을 찾을 수 없습니다.");

  const cost = await calculateUnitCost(db, input.menuId, input.date, input.channel);
  const foodSnapshot = cost.foodCost?.toString() ?? null;
  const packagingSnapshot = cost.packagingCost?.toString() ?? null;
  const saleId = randomUUID();

  await db.exec("BEGIN");
  try {
    await db.query(
      `INSERT INTO sales (
         sale_id, sale_date, menu_id, channel, quantity, unit_price,
         discount_amount, net_sales, payment_fee, recipe_version,
         unit_food_cost_snapshot, unit_packaging_cost_snapshot
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (sale_date, menu_id, channel) DO UPDATE SET
         quantity = sales.quantity + EXCLUDED.quantity,
         unit_price = (sales.unit_price * sales.quantity + EXCLUDED.unit_price * EXCLUDED.quantity) / (sales.quantity + EXCLUDED.quantity),
         discount_amount = sales.discount_amount + EXCLUDED.discount_amount,
         net_sales = sales.net_sales + EXCLUDED.net_sales,
         payment_fee = sales.payment_fee + EXCLUDED.payment_fee,
         recipe_version = EXCLUDED.recipe_version,
         unit_food_cost_snapshot = CASE
           WHEN sales.unit_food_cost_snapshot IS NULL OR EXCLUDED.unit_food_cost_snapshot IS NULL THEN NULL
           ELSE (sales.unit_food_cost_snapshot * sales.quantity + EXCLUDED.unit_food_cost_snapshot * EXCLUDED.quantity) / (sales.quantity + EXCLUDED.quantity) END,
         unit_packaging_cost_snapshot = CASE
           WHEN sales.unit_packaging_cost_snapshot IS NULL OR EXCLUDED.unit_packaging_cost_snapshot IS NULL THEN NULL
           ELSE (sales.unit_packaging_cost_snapshot * sales.quantity + EXCLUDED.unit_packaging_cost_snapshot * EXCLUDED.quantity) / (sales.quantity + EXCLUDED.quantity) END`,
      [
        saleId, input.date, input.menuId, input.channel, amounts.quantity.toString(),
        amounts.unitPrice.toString(), amounts.discountAmount.toString(), amounts.netSales.toString(),
        paymentFee.toString(), menuResult.rows[0].recipe_version, foodSnapshot, packagingSnapshot,
      ],
    );
    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }

  return {
    saleId,
    quantity: amounts.quantity.toString(),
    grossSales: amounts.grossSales.toString(),
    netSales: amounts.netSales.toString(),
    paymentFee: paymentFee.toString(),
    unitFoodCost: foodSnapshot,
    unitPackagingCost: packagingSnapshot,
    missingMaterials: cost.missingMaterials,
  };
}

export async function getSalesForDate(db: PGlite, date: string) {
  const result = await db.query(
    `SELECT s.sale_id, s.sale_date::text AS date, s.menu_id, m.name AS menu_name,
            s.channel, s.quantity::text AS quantity, s.unit_price::text AS unit_price,
            s.discount_amount::text AS discount_amount, s.net_sales::text AS net_sales,
            s.payment_fee::text AS payment_fee,
            s.unit_food_cost_snapshot::text AS unit_food_cost,
            s.unit_packaging_cost_snapshot::text AS unit_packaging_cost
       FROM sales s JOIN menus m ON m.menu_id = s.menu_id
      WHERE s.sale_date = $1 ORDER BY s.menu_id, s.channel`,
    [date],
  );
  return result.rows;
}
