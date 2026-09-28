import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getHindsightStatus } from "@/lib/hindsight-service";

export const dynamic = "force-dynamic";

/** GET /api/analytics — rollup metrics for the dashboard + analytics view.
 *  Memory counts come from the AgentLog audit of real Hindsight retain calls
 *  (Prisma is application storage only — NOT the memory engine). */
export async function GET() {
  const [
    customers,
    conversations,
    retainCount,
    followups,
    briefs,
    logs,
  ] = await Promise.all([
    db.customer.count(),
    db.conversation.count(),
    db.agentLog.count({ where: { action: "retain", success: true } }),
    db.followUp.count(),
    db.meetingBrief.count(),
    db.agentLog.count(),
  ]);

  const byStatus = await db.customer.groupBy({
    by: ["status"],
    _count: true,
  });
  // Memory TYPES live in Hindsight (not Prisma). We surface the retain audit
  // grouped by Hindsight mode so the chart still tells a true story.
  const byAction = await db.agentLog.groupBy({
    by: ["action"],
    _count: true,
  });
  const byMode = await db.agentLog.groupBy({
    by: ["mode"],
    _count: true,
  });

  const pipelineByStage = await db.customer.groupBy({
    by: ["status"],
    _sum: { dealValue: true },
    _count: true,
  });

  const followupsByStatus = await db.followUp.groupBy({
    by: ["status"],
    _count: true,
  });

  // Hindsight retain calls per day (audit) for the trend chart.
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const recentRetains = await db.agentLog.findMany({
    where: { action: "retain", success: true, createdAt: { gte: since } },
    select: { createdAt: true },
  });
  const byDay: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    byDay[d.toISOString().slice(0, 10)] = 0;
  }
  for (const m of recentRetains) {
    const key = m.createdAt.toISOString().slice(0, 10);
    if (key in byDay) byDay[key]++;
  }

  const totalPipelineValue = pipelineByStage.reduce(
    (a, b) => a + (b._sum.dealValue ?? 0),
    0,
  );

  const hindsight = await getHindsightStatus();

  return NextResponse.json({
    counts: {
      customers,
      conversations,
      memories: retainCount,
      followups,
      briefs,
      logs,
    },
    byStatus,
    byMode,
    byAction,
    followupsByStatus,
    pipelineByStage,
    totalPipelineValue,
    memoryTrend: Object.entries(byDay).map(([date, count]) => ({ date, count })),
    hindsight: {
      mode: hindsight.mode,
      connected: hindsight.connected,
      apiVersion: hindsight.apiVersion,
    },
  });
}
