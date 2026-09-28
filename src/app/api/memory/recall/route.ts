import { NextRequest, NextResponse } from "next/server";
import { recall, HindsightNotConfiguredError } from "@/lib/hindsight-service";

export const dynamic = "force-dynamic";

/** POST /api/memory/recall — recall memories for a customer from Hindsight.
 *  Body: { customerId, query, budget?, limit? } */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { customerId, query, budget, limit } = body as Record<string, unknown>;
  if (!customerId || !query) {
    return NextResponse.json(
      { error: "customerId and query are required" },
      { status: 400 },
    );
  }
  try {
    const { results, mode } = await recall(
      customerId as string,
      query as string,
      {
        budget: (budget as "low" | "mid" | "high") ?? "mid",
        limit: typeof limit === "number" ? limit : undefined,
      },
    );
    return NextResponse.json({ results, mode });
  } catch (e) {
    if (e instanceof HindsightNotConfiguredError) {
      return NextResponse.json(
        { error: e.message, code: "hindsight_not_configured" },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
