import { NextRequest, NextResponse } from "next/server";
import { calculateUnitCost, ensureReady, isValidIsoDate, koreaToday } from "@/lib/sales";
import { getDatabase } from "@/lib/server/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? "";
  const menuId = request.nextUrl.searchParams.get("menuId") ?? "";
  const channel = request.nextUrl.searchParams.get("channel") ?? "";
  if (!isValidIsoDate(date) || !menuId || !channel || date > koreaToday()) {
    return NextResponse.json({ error: "날짜·메뉴·판매 채널을 확인해 주세요." }, { status: 400 });
  }
  try {
    const db = await getDatabase();
    await ensureReady(db);
    const menu = await db.query<{ price: string }>("SELECT price::text AS price FROM menus WHERE menu_id = $1", [menuId]);
    if (!menu.rows.length) return NextResponse.json({ error: "선택한 메뉴를 찾을 수 없습니다." }, { status: 400 });
    const costs = await calculateUnitCost(db, menuId, date, channel);
    return NextResponse.json({ basePrice: menu.rows[0].price, ...costs });
  } catch (error) {
    const message = process.env.NODE_ENV === "development" && error instanceof Error ? error.message : "원가 미리보기를 불러오지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
