import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { listMemories, HindsightNotConfiguredError } from "@/lib/hindsight-service";

export const dynamic = "force-dynamic";

/** GET /api/customers — list all customers with conversation + followup counts
 *  AND a live Hindsight memory count per customer (real Hindsight, not Prisma). */
export async function GET() {
  const rows = await db.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { conversations: true, followUps: true },
      },
    },
  });
  let hindsightConfigured = true;
  const customers = [];
  for (const c of rows) {
    let memoryCount = 0;
    try {
      const mems = await listMemories(c.id);
      memoryCount = mems.length;
    } catch (e) {
      if (e instanceof HindsightNotConfiguredError) {
        hindsightConfigured = false;
      }
      // leave memoryCount = 0
    }
    customers.push({
      ...c,
      _count: { ...c._count, memories: memoryCount },
    });
  }
  return NextResponse.json({ customers, hindsightConfigured });
}

/** POST /api/customers — create a customer. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { name, email, company, title, phone, industry, city, status, dealValue, notes } =
    body as Record<string, unknown>;
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const customer = await db.customer.create({
    data: {
      name,
      email: (email as string) || null,
      company: (company as string) || null,
      title: (title as string) || null,
      phone: (phone as string) || null,
      industry: (industry as string) || null,
      city: (city as string) || null,
      status: (status as string) || "lead",
      dealValue: typeof dealValue === "number" ? dealValue : 0,
      notes: (notes as string) || null,
    },
  });
  return NextResponse.json({ customer }, { status: 201 });
}
