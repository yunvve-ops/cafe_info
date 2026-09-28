import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import Decimal from "decimal.js";
import {
  calculateSalesAmounts,
  calculateUnitCost,
  initializeDatabase,
  InputError,
  saveSale,
  getSalesForDate,
  isValidIsoDate,
  type Seed,
} from "../src/lib/sales";

async function check(name: string, run: () => void | Promise<void>) {
  await run();
  console.log(`PASS ${name}`);
}

async function main() {
const seed = JSON.parse(await readFile(path.join(process.cwd(), "data", "seed.json"), "utf8")) as Seed;

await check("sales total uses quantity × actual price − discount, preserving exact amount", () => {
  const amounts = calculateSalesAmounts({ quantity: 2, unitPrice: 4000, discountAmount: 500 });
  assert.equal(amounts.grossSales.toString(), "8000");
  assert.equal(amounts.netSales.toString(), "7500");
});

await check("invalid quantities, excessive discounts, and future sales are rejected", async () => {
  assert.throws(() => calculateSalesAmounts({ quantity: 0, unitPrice: 4000, discountAmount: 0 }), InputError);
  assert.throws(() => calculateSalesAmounts({ quantity: -1, unitPrice: 4000, discountAmount: 0 }), InputError);
  assert.throws(() => calculateSalesAmounts({ quantity: 1.5, unitPrice: 4000, discountAmount: 0 }), InputError);
  assert.throws(() => calculateSalesAmounts({ quantity: 1, unitPrice: 4000, discountAmount: 4001 }), InputError);
  assert.throws(() => calculateSalesAmounts({ quantity: 1, unitPrice: -1, discountAmount: 0 }), InputError);
  assert.throws(() => calculateSalesAmounts({ quantity: 1, unitPrice: 4000, discountAmount: -1 }), InputError);
  assert.equal(isValidIsoDate("2026-02-31"), false);
  assert.equal(isValidIsoDate("2026-09-28"), true);
  const db = new PGlite();
  try {
    await initializeDatabase(db, seed);
    const valid = { date: "2026-09-28", menuId: "M01", channel: "매장", quantity: 1, unitPrice: 4000, discountAmount: 0, paymentFee: 0 };
    const invalidInputs = [
      { ...valid, date: "2026-09-29" },
      { ...valid, date: "2026-02-31" },
      { ...valid, menuId: "NO-SUCH-MENU" },
      { ...valid, channel: "배달" },
      { ...valid, paymentFee: -1 },
      { ...valid, unitPrice: "" },
    ];
    for (const input of invalidInputs) await assert.rejects(saveSale(db, input, "2026-09-28"), InputError);
    assert.equal((await getSalesForDate(db, "2026-09-28")).length, 0);
  } finally {
    await db.close();
  }
});

await check("historical recipe and channel price calculation matches sample", async () => {
  const db = new PGlite();
  try {
    await initializeDatabase(db, seed);
    const dineIn = await calculateUnitCost(db, "M01", "2025-07-01", "매장");
    const takeout = await calculateUnitCost(db, "M01", "2025-07-01", "포장");
    assert.equal(dineIn.foodCost?.toString(), "460");
    assert.equal(dineIn.packagingCost?.toString(), "0");
    assert.equal(takeout.foodCost?.toString(), "460");
    assert.equal(takeout.packagingCost?.toString(), "160");
  } finally {
    await db.close();
  }
});

await check("sample data seeds once and repeated same-day entry adds to its aggregate", async () => {
  const db = new PGlite();
  try {
    assert.deepEqual(await initializeDatabase(db, seed), { seeded: true });
    assert.deepEqual(await initializeDatabase(db, seed), { seeded: false });
    const counts = await db.query<{ menus: string; materials: string; recipes: string; sales: string }>(
      `SELECT (SELECT count(*) FROM menus)::text AS menus,
              (SELECT count(*) FROM materials)::text AS materials,
              (SELECT count(*) FROM recipes)::text AS recipes,
              (SELECT count(*) FROM sales)::text AS sales`,
    );
    assert.deepEqual(counts.rows[0], { menus: "8", materials: "11", recipes: "22", sales: "6112" });

    const input = { date: "2026-09-28", menuId: "M01", channel: "매장", quantity: 2, unitPrice: 4000, discountAmount: 0, paymentFee: 0 };
    assert.equal((await saveSale(db, input, "2026-09-28")).netSales, "8000");
    assert.equal((await saveSale(db, { ...input, quantity: 3 }, "2026-09-28")).netSales, "12000");
    const rows = await getSalesForDate(db, "2026-09-28") as Array<Record<string, unknown>>;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].quantity, "5");
    assert.equal(rows[0].net_sales, "20000");
    assert.ok(new Decimal(String(rows[0].unit_food_cost)).equals("496.8"));
    assert.ok(new Decimal(String(rows[0].unit_packaging_cost)).isZero());
  } finally {
    await db.close();
  }
});
}

main().catch((error) => {
  console.error("FAIL", error);
  process.exitCode = 1;
});
