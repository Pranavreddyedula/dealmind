import { NextRequest, NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";

export const dynamic = "force-dynamic";

/** POST /api/seed?clear=1 — (re)seed the DealMind demo dataset. */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const clear = url.searchParams.get("clear") === "1";
  try {
    const result = await seedDatabase({ clear });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
