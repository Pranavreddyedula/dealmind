import { NextRequest, NextResponse } from "next/server";
import { recall, HindsightNotConfiguredError } from "@/lib/hindsight-service";
import { generateText } from "@/lib/llm-service";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/meeting-prep — the "See the Difference Memory Makes" demo.
 *
 * Generates TWO briefings for the same request:
 *   1. WITHOUT MEMORY  — the LLM sees ONLY the customer's name/title/company.
 *      This is what a forgetful CRM + vanilla LLM would produce: generic.
 *   2. WITH HINDSIGHT MEMORY — recall() pulls the customer's retained memories
 *      (price objection / competitor / CRM requirement for Rahul), then the
 *      LLM writes a personalized briefing that actually cites them.
 *
 * Both briefings are persisted as MeetingBrief rows so the timeline + analytics
 * reflect real usage. The recalled memories are returned for transparency.
 *
 * Body: { customerId, query }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { customerId, query } = body as Record<string, string>;
  if (!customerId || !query) {
    return NextResponse.json(
      { error: "customerId and query are required" },
      { status: 400 },
    );
  }
  const customer = await db.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    return NextResponse.json({ error: "customer not found" }, { status: 404 });
  }

  // ---- WITHOUT MEMORY: profile only, no recollection ----
  const withoutSystem =
    "You are a generic sales assistant with NO memory of past interactions. You only know the customer's name, title, and company. Produce a brief, generic meeting preparation note. Do NOT pretend to remember anything specific — if you don't have a fact, say it's not available.";
  const withoutPrompt = `Customer name: ${customer.name}
Title: ${customer.title ?? "n/a"}
Company: ${customer.company ?? "n/a"}

Request: ${query}

Write a generic meeting prep note. Use markdown headings (## Objectives, ## Talking Points, ## Next Steps). Keep it short and clearly generic.`;
  const without = await generateText(
    [
      { role: "system", content: withoutSystem },
      { role: "user", content: withoutPrompt },
    ],
    { temperature: 0.4, maxTokens: 700 },
  );

  // ---- WITH HINDSIGHT MEMORY: recall real memories, then ground the briefing ----
  let memories: import("@/lib/hindsight-service").DealMindRecallResult[] = [];
  let mode: import("@/lib/hindsight-service").MemoryMode = "not-configured";
  try {
    const recalled = await recall(customerId, query, {
      budget: "mid",
      limit: 12,
    });
    memories = recalled.results;
    mode = recalled.mode;
  } catch (e) {
    if (e instanceof HindsightNotConfiguredError) {
      return NextResponse.json(
        { error: e.message, code: "hindsight_not_configured" },
        { status: 503 },
      );
    }
    throw e;
  }
  const memoryBlock = memories
    .map(
      (r, i) =>
        `(${i + 1}) [${r.type ?? "memory"}${r.mentionedAt ? `, ${new Date(r.mentionedAt).toLocaleDateString()}` : ""}] ${r.text}`,
    )
    .join("\n");
  const withSystem =
    "You are DealMind, an elite enterprise sales intelligence agent with persistent Hindsight memory. Generate a sharp, specific meeting preparation briefing grounded in the provided recalled memories. Cite the memories explicitly where relevant. Use markdown with clear sections. Never invent facts beyond the profile + memories.";
  const withPrompt = `CUSTOMER PROFILE
Name: ${customer.name}
Title: ${customer.title ?? "n/a"}
Company: ${customer.company ?? "n/a"}
Industry: ${customer.industry ?? "n/a"}
Status: ${customer.status}
Deal value: $${customer.dealValue}

PERSISTENT MEMORY (recalled for this meeting)
${memoryBlock || "(no memories recalled yet)"}

REQUEST
${query}

Write a personalized meeting prep briefing in markdown. Use these sections:
## Account Snapshot
## What We Already Know (cite the recalled memories)
## Likely Objections & How to Handle Them
## Recommended Agenda
## Talking Points
## Don't Forget to Ask
## Next Steps
Be specific. Where a memory supports a point, reference it explicitly.`;
  const withMem = await generateText(
    [
      { role: "system", content: withSystem },
      { role: "user", content: withPrompt },
    ],
    { temperature: 0.45, maxTokens: 1400 },
  );

  const briefingWithout = await db.meetingBrief.create({
    data: {
      customerId,
      query,
      mode: "without-memory",
      briefing: without.text,
      memoryUsedJson: JSON.stringify([]),
      latencyMs: without.latencyMs,
    },
  });
  const briefingWith = await db.meetingBrief.create({
    data: {
      customerId,
      query,
      mode: "with-memory",
      briefing: withMem.text,
      memoryUsedJson: JSON.stringify(memories),
      latencyMs: withMem.latencyMs,
    },
  });

  return NextResponse.json({
    customer: { name: customer.name, company: customer.company },
    query,
    mode,
    withoutMemory: {
      id: briefingWithout.id,
      briefing: without.text,
      provider: without.provider,
      latencyMs: without.latencyMs,
      memoriesUsed: [],
    },
    withMemory: {
      id: briefingWith.id,
      briefing: withMem.text,
      provider: withMem.provider,
      latencyMs: withMem.latencyMs,
      memoriesUsed: memories,
    },
  });
}
