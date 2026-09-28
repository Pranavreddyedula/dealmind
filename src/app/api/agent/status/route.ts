import { NextResponse } from "next/server";
import { getHindsightStatus } from "@/lib/hindsight-service";
import { getConfiguredProvider } from "@/lib/llm-service";

export const dynamic = "force-dynamic";

/** GET /api/agent/status — reports the live memory mode + LLM provider. */
export async function GET() {
  const status = await getHindsightStatus();
  return NextResponse.json({
    memory: status,
    llm: { provider: getConfiguredProvider() },
  });
}
