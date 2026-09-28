import { NextRequest, NextResponse } from "next/server";
import { recall, HindsightNotConfiguredError } from "@/lib/hindsight-service";
import { generateText } from "@/lib/llm-service";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** POST /api/memory/qa — ask a question about a customer, answered from
 *  Hindsight memory. Surfaces the memories used so the UI is transparent.
 *  Body: { customerId, question, budget? } */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { customerId, question, budget } = body as Record<string, unknown>;
  if (!customerId || !question) {
    return NextResponse.json(
      { error: "customerId and question are required" },
      { status: 400 },
    );
  }
  try {
    const { results, mode } = await recall(
      customerId as string,
      question as string,
      {
        budget: (budget as "low" | "mid" | "high") ?? "mid",
        limit: 10,
      },
    );
    const customer = await db.customer.findUnique({
      where: { id: customerId as string },
    });
    const memoryBlock = results
      .map(
        (r, i) =>
          `(${i + 1}) [${r.type ?? "memory"}${r.mentionedAt ? `, ${new Date(r.mentionedAt).toLocaleDateString()}` : ""}] ${r.text}`,
      )
      .join("\n");
    const llm = await generateText(
      [
        {
          role: "system",
          content:
            "You are DealMind. Answer the user's question about the customer using ONLY the provided persistent memory and customer profile. If the memory does not contain the answer, say you don't have that memory yet. Be concise (2-4 sentences).",
        },
        {
          role: "user",
          content: `CUSTOMER: ${customer?.name ?? "?"} (${customer?.title ?? "n/a"}, ${customer?.company ?? "n/a"})\nMEMORY:\n${memoryBlock || "(no memories)"}\n\nQUESTION: ${question}`,
        },
      ],
      { temperature: 0.3, maxTokens: 400 },
    );
    return NextResponse.json({
      answer: llm.text,
      memories: results,
      mode,
      provider: llm.provider,
    });
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

