import { NextResponse } from "next/server";
import { ensureReady, getReferenceData } from "@/lib/sales";
import { getDatabase } from "@/lib/server/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDatabase();
    await ensureReady(db);
    const reference = await getReferenceData(db);
    return NextResponse.json({
      ...reference,
      source: { name: "프렙 카페 가상 샘플", start: "2025-07-01", end: "2026-09-18" },
    });
  } catch (error) {
    const message = process.env.NODE_ENV === "development" && error instanceof Error ? error.message : "기준 자료를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
