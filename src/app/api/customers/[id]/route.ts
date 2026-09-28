import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { listMemories, HindsightNotConfiguredError } from "@/lib/hindsight-service";

export const dynamic = "force-dynamic";

/** GET /api/customers/[id] — full profile incl. conversations, followups,
 *  meeting briefs, AND memories fetched live from real Hindsight. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      conversations: {
        include: { _count: { select: { messages: true } } },
        orderBy: { createdAt: "desc" },
      },
      followUps: { orderBy: { createdAt: "desc" } },
      meetingBriefs: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
  if (!customer) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  // Memories come from REAL Hindsight (never Prisma).
  let memories: { id: string; text: string; type: string | null; context: string | null; mentionedAt: string | null }[] = [];
  let hindsightConfigured = true;
  try {
    memories = await listMemories(id);
  } catch (e) {
    if (e instanceof HindsightNotConfiguredError) {
      hindsightConfigured = false;
    }
    // other errors: leave memories empty
  }
  return NextResponse.json({ customer: { ...customer, memories }, hindsightConfigured });
}

/** PATCH /api/customers/[id] — update profile fields. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const allowed = [
    "name",
    "email",
    "company",
    "title",
    "phone",
    "industry",
    "city",
    "status",
    "dealValue",
    "notes",
  ];
  const data: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) data[k] = body[k];
  }
  const customer = await db.customer.update({ where: { id }, data });
  return NextResponse.json({ customer });
}
