import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const DEFAULTS: Record<string, string> = {
  defaultLlmProvider: "zai",
  memoryBudget: "mid",
  agentPersona:
    "DealMind — concise, high-signal enterprise sales intelligence agent.",
};

/** GET /api/settings — app settings (runtime config snapshot). */
export async function GET() {
  const rows = await db.settings.findMany();
  const values: Record<string, string> = { ...DEFAULTS };
  for (const r of rows) values[r.id] = r.value;
  return NextResponse.json({
    settings: values,
    env: {
      hindsightBaseUrl: process.env.HINDSIGHT_BASE_URL ? "set" : "unset",
      hindsightEmbedLocal: process.env.HINDSIGHT_EMBED_LOCAL === "true",
      groqApiKey: process.env.GROQ_API_KEY ? "set" : "unset",
      openaiApiKey: process.env.OPENAI_API_KEY ? "set" : "unset",
      anthropicApiKey: process.env.ANTHROPIC_API_KEY ? "set" : "unset",
    },
  });
}

/** PATCH /api/settings — upsert settings keys. */
export async function PATCH(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, string>;
  const allowed = new Set(Object.keys(DEFAULTS));
  for (const [k, v] of Object.entries(body)) {
    if (allowed.has(k) && typeof v === "string") {
      await db.settings.upsert({
        where: { id: k },
        create: { id: k, value: v },
        update: { value: v },
      });
    }
  }
  return NextResponse.json({ ok: true });
}
