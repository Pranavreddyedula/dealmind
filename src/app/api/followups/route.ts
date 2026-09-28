import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/followups?status=&customerId= — list follow-ups. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const customerId = url.searchParams.get("customerId");
  const followups = await db.followUp.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(customerId ? { customerId } : {}),
    },
    include: { customer: { select: { name: true, company: true } } },
    orderBy: { dueAt: "asc" },
  });
  return NextResponse.json({ followups });
}

/** POST /api/followups — generate + save a personalized follow-up.
 *  Body: { customerId, conversationId?, channel?, tone? } */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { customerId, conversationId, channel, tone } = body as Record<
    string,
    unknown
  >;
  if (!customerId) {
    return NextResponse.json({ error: "customerId required" }, { status: 400 });
  }
  const { generateFollowUp } = await import("@/lib/followup-service");
  const result = await generateFollowUp({
    customerId: customerId as string,
    conversationId: conversationId as string | undefined,
    channel: (channel as string) || "email",
    tone: (tone as string) || "professional",
  });
  const fu = await db.followUp.create({
    data: {
      customerId,
      conversationId: conversationId || null,
      channel: (channel as string) || "email",
      message: result.message,
      status: "pending",
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  return NextResponse.json({ followUp: fu, mode: result.mode, memoriesUsed: result.memoriesUsed }, { status: 201 });
}
