import { NextRequest, NextResponse } from "next/server";
import { retain, HindsightNotConfiguredError } from "@/lib/hindsight-service";

export const dynamic = "force-dynamic";

/** POST /api/memory/retain — retain a fact for a customer into Hindsight memory.
 *  Body: { customerId, content, context?, type?, metadata?, mentionedAt? } */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { customerId, content, context, type, metadata, mentionedAt } = body as Record<
    string,
    unknown
  >;
  if (!customerId || !content) {
    return NextResponse.json(
      { error: "customerId and content are required" },
      { status: 400 },
    );
  }
  try {
    const result = await retain(customerId as string, content as string, {
      context: context as string | undefined,
      type: type as string | undefined,
      metadata: metadata as Record<string, string> | undefined,
      mentionedAt: mentionedAt
        ? new Date(mentionedAt as string)
        : undefined,
    });
    return NextResponse.json({ result });
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
