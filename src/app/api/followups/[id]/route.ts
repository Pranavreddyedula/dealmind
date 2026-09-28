import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** PATCH /api/followups/[id] — update status. Body: { status } */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { status } = body as Record<string, unknown>;
  if (!status) {
    return NextResponse.json({ error: "status required" }, { status: 400 });
  }
  const fu = await db.followUp.update({ where: { id }, data: { status } });
  return NextResponse.json({ followUp: fu });
}
