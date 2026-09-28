import { NextRequest, NextResponse } from "next/server";
import { listMemoryTimeline, HindsightNotConfiguredError } from "@/lib/hindsight-service";

export const dynamic = "force-dynamic";

/** GET /api/timeline?customerId= — chronological memory feed across customers. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const customerId = url.searchParams.get("customerId") || undefined;
  try {
    const items = await listMemoryTimeline(customerId);
    return NextResponse.json({ items });
  } catch (e) {
    if (e instanceof HindsightNotConfiguredError) {
      return NextResponse.json(
        { items: [], error: e.message, code: "hindsight_not_configured" },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
