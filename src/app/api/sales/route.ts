import { NextRequest, NextResponse } from "next/server";
import { ensureReady, getSalesForDate, InputError, isValidIsoDate, koreaToday, saveSale, type SaleInput } from "@/lib/sales";
import { getDatabase } from "@/lib/server/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? "";
  if (!isValidIsoDate(date)) {
    return NextResponse.json({ error: "조회 날짜를 확인해 주세요." }, { status: 400 });
  }
  try {
    const db = await getDatabase();
    await ensureReady(db);
    return NextResponse.json({ date, sales: await getSalesForDate(db, date) });
  } catch (error) {
    const message = process.env.NODE_ENV === "development" && error instanceof Error ? error.message : "판매 기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let input: SaleInput;
  try {
    input = (await request.json()) as SaleInput;
  } catch {
    return NextResponse.json({ error: "입력 내용을 읽지 못했습니다. 다시 확인해 주세요." }, { status: 400 });
  }
  if (!input || typeof input !== "object") {
    return NextResponse.json({ error: "입력 내용을 확인해 주세요." }, { status: 400 });
  }
  try {
    const db = await getDatabase();
    await ensureReady(db);
    const saved = await saveSale(db, input, koreaToday());
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    if (error instanceof InputError) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "저장하지 못했습니다. 입력한 값은 화면에 남아 있으니 다시 시도해 주세요." }, { status: 500 });
  }
}
