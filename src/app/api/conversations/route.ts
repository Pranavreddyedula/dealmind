import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/conversations?customerId= — list conversations. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const customerId = url.searchParams.get("customerId");
  const conversations = await db.conversation.findMany({
    where: customerId ? { customerId } : undefined,
    include: {
      customer: { select: { name: true, company: true, avatarHue: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ conversations });
}

/** POST /api/conversations — create a conversation with messages.
 *  Retaining a memory is intentionally a separate call to /api/memory/retain
 *  so the memory route's mode + audit are recorded there. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { customerId, title, channel, sentiment, summary, messages } = body as Record<
    string,
    unknown
  >;
  if (!customerId || typeof customerId !== "string") {
    return NextResponse.json({ error: "customerId required" }, { status: 400 });
  }
  const conv = await db.conversation.create({
    data: {
      customerId,
      title: (title as string) || "Untitled conversation",
      channel: (channel as string) || "meeting",
      sentiment: (sentiment as string) || null,
      summary: (summary as string) || null,
    },
  });
  for (const m of (messages as { role: string; content: string }[]) ?? []) {
    await db.message.create({
      data: { conversationId: conv.id, role: m.role, content: m.content },
    });
  }
  return NextResponse.json({ conversation: conv }, { status: 201 });
}
