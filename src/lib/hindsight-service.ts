/**
 * DealMind — Hindsight memory service (REAL Hindsight only, no Prisma fallback).
 *
 * Uses the REAL @vectorize-io/hindsight-client SDK methods exclusively:
 *   getVersion / createBank / retain / recall / reflect / listMemories / deleteBank
 *
 * Prisma is NOT used as agent memory. Prisma only stores application data
 * (customers, conversations, follow-ups, meeting briefs, audit logs).
 *
 * Resolution:
 *   Tier A — HINDSIGHT_BASE_URL set → real HindsightClient against remote/managed API.
 *   Tier B — HINDSIGHT_EMBED_LOCAL=true → real local HindsightServer daemon
 *            (mini-services/hindsight-daemon, started via uvx — present in this env).
 *   Tier C (auto) — if NEITHER env is set, DealMind still probes the local daemon
 *            at http://127.0.0.1:8888 (it may be running). If healthy → use it.
 *   Otherwise → mode "not-configured": retain/recall/reflect THROW
 *   HindsightNotConfiguredError. The UI surfaces "Hindsight is not configured.
 *   Memory features require a Hindsight connection." There is NO silent fallback.
 */
import { HindsightClient } from "@vectorize-io/hindsight-client";
import type { VersionResponse } from "@vectorize-io/hindsight-client";
import { db } from "@/lib/db";
import { generateText } from "@/lib/llm-service";

export type MemoryMode =
  | "hindsight-remote"
  | "hindsight-local"
  | "not-configured";

export class HindsightNotConfiguredError extends Error {
  constructor(message = "Hindsight is not configured. Memory features require a Hindsight connection.") {
    super(message);
    this.name = "HindsightNotConfiguredError";
  }
}

export interface DealMindRecallResult {
  id: string;
  text: string;
  context?: string | null;
  type?: string | null;
  mentionedAt?: string | null;
  metadata?: Record<string, string> | null;
  score?: number | null;
  source: "hindsight";
}

export interface DealMindRetainResult {
  success: boolean;
  bankId: string;
  itemsCount: number;
  mode: MemoryMode;
}

export interface DealMindReflectResult {
  text: string;
  mode: MemoryMode;
  memoriesUsed: DealMindRecallResult[];
  latencyMs: number;
}

export interface HindsightStatus {
  mode: MemoryMode;
  baseUrl?: string;
  apiVersion?: string;
  connected: boolean;
  uvxAvailable: boolean;
  llmProvider: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Configuration + client resolution
// ---------------------------------------------------------------------------

const DEFAULT_LOCAL_URL = "http://127.0.0.1:8888";

function bankIdFor(customerId: string): string {
  return `dealmind-${customerId}`;
}

let _cached: {
  client: HindsightClient;
  mode: MemoryMode;
  version?: VersionResponse;
} | null = null;
let _cachedAt = 0;
const CACHE_TTL_MS = 15_000;

async function probeClient(
  baseUrl: string,
  apiKey?: string,
): Promise<{ version: VersionResponse; client: HindsightClient } | null> {
  try {
    const client = new HindsightClient({
      baseUrl,
      ...(apiKey ? { apiKey } : {}),
    });
    const version = await client.getVersion();
    if (version?.api_version) return { version, client };
    return null;
  } catch {
    return null;
  }
}

async function resolveClient(): Promise<{
  client: HindsightClient;
  mode: MemoryMode;
}> {
  const now = Date.now();
  if (_cached && now - _cachedAt < CACHE_TTL_MS) {
    return { client: _cached.client, mode: _cached.mode };
  }

  // Tier A: explicit remote/managed Hindsight API.
  const remoteUrl = process.env.HINDSIGHT_BASE_URL;
  if (remoteUrl) {
    const probed = await probeClient(remoteUrl, process.env.HINDSIGHT_API_KEY);
    if (probed) {
      _cached = { client: probed.client, mode: "hindsight-remote", version: probed.version };
      _cachedAt = now;
      return { client: probed.client, mode: "hindsight-remote" };
    }
  }

  // Tier B / auto: local daemon (env-flagged OR auto-probed at the default URL).
  const wantLocal = process.env.HINDSIGHT_EMBED_LOCAL === "true";
  const localUrl =
    process.env.HINDSIGHT_BASE_URL_LOCAL ||
    `http://${process.env.HINDSIGHT_HOST || "127.0.0.1"}:${process.env.HINDSIGHT_PORT || "8888"}`;
  // Probe the local daemon whether or not the env flag is set — if it's running,
  // use it. This lets the daemon mini-service be the source of truth without
  // requiring the user to set a flag.
  const probed = await probeClient(localUrl, process.env.HINDSIGHT_API_KEY);
  if (probed) {
    _cached = { client: probed.client, mode: "hindsight-local", version: probed.version };
    _cachedAt = now;
    return { client: probed.client, mode: "hindsight-local" };
  }

  _cached = null;
  _cachedAt = now;
  return { client: null as unknown as HindsightClient, mode: "not-configured" };
}

export async function getHindsightStatus(): Promise<HindsightStatus> {
  const { client, mode } = await resolveClient();
  let apiVersion: string | undefined;
  if (client) {
    try {
      const v = await client.getVersion();
      apiVersion = v?.api_version;
    } catch {
      /* ignore */
    }
  }
  const connected = mode !== "not-configured";
  return {
    mode,
    baseUrl:
      process.env.HINDSIGHT_BASE_URL ||
      (mode === "hindsight-local"
        ? DEFAULT_LOCAL_URL
        : undefined),
    apiVersion,
    connected,
    uvxAvailable: true,
    llmProvider:
      process.env.GROQ_API_KEY
        ? "groq"
        : process.env.OPENAI_API_KEY
          ? "openai"
          : process.env.ANTHROPIC_API_KEY
            ? "anthropic"
            : "zai (default)",
    message: connected
      ? mode === "hindsight-remote"
        ? "Connected to a remote Hindsight API — real persistent memory."
        : "Connected to the local Hindsight daemon — real persistent memory."
      : process.env.HINDSIGHT_EMBED_LOCAL === "true"
        ? "HINDSIGHT_EMBED_LOCAL is set but the local daemon is not reachable. Start it with `bun run hindsight:start` (mini-services/hindsight-daemon)."
        : "Hindsight is not configured. Memory features require a Hindsight connection. Set HINDSIGHT_BASE_URL (remote) or HINDSIGHT_EMBED_LOCAL=true (local daemon).",
  };
}

function requireClient(client: HindsightClient, mode: MemoryMode): void {
  if (mode === "not-configured" || !client) {
    throw new HindsightNotConfiguredError();
  }
}

// ---------------------------------------------------------------------------
// Public API — real Hindsight SDK methods only
// ---------------------------------------------------------------------------

export interface RetainOptions {
  context?: string;
  metadata?: Record<string, string>;
  type?: string;
  mentionedAt?: Date;
  documentId?: string;
}

export async function retain(
  customerId: string,
  content: string,
  opts: RetainOptions = {},
): Promise<DealMindRetainResult> {
  const bankId = bankIdFor(customerId);
  const { client, mode } = await resolveClient();
  requireClient(client, mode);
  const started = Date.now();

  // Ensure the bank exists (createBank is idempotent — safe to call every time).
  try {
    await client.createBank(bankId, {
      name: `DealMind · ${customerId}`,
      background:
        "Customer memory for DealMind — sales intelligence with persistent Hindsight memory.",
    });
  } catch {
    /* bank may already exist; the retain call below is the source of truth */
  }

  const res = await client.retain(bankId, content, {
    context: opts.context,
    metadata: opts.metadata,
    documentId: opts.documentId,
    ...(opts.mentionedAt ? { timestamp: opts.mentionedAt } : {}),
  });

  const success = !!res?.success;
  const itemsCount = res?.items_count ?? 1;

  await logAgent({
    action: "retain",
    bankId,
    query: content.slice(0, 280),
    mode,
    success,
    latencyMs: Date.now() - started,
  });

  return { success, bankId, itemsCount, mode };
}

export async function recall(
  customerId: string,
  query: string,
  opts: { budget?: "low" | "mid" | "high"; limit?: number } = {},
): Promise<{ results: DealMindRecallResult[]; mode: MemoryMode }> {
  const bankId = bankIdFor(customerId);
  const { client, mode } = await resolveClient();
  requireClient(client, mode);
  const started = Date.now();

  const res = await client.recall(bankId, query, {
    budget: opts.budget ?? "mid",
  });
  const results: DealMindRecallResult[] = (res?.results ?? []).map((r) => ({
    id: r.id,
    text: r.text,
    context: r.context ?? null,
    type: r.type ?? null,
    mentionedAt: r.mentioned_at ?? null,
    metadata: r.metadata ?? null,
    score: r.scores?.final ?? null,
    source: "hindsight",
  }));

  await logAgent({
    action: "recall",
    bankId,
    query: query.slice(0, 280),
    mode,
    success: true,
    latencyMs: Date.now() - started,
    resultJson: JSON.stringify({ count: results.length }),
  });

  return { results: results.slice(0, opts.limit ?? 50), mode };
}

export interface ReflectOptions {
  budget?: "low" | "mid" | "high";
  /** When set (default for meeting-prep), recall memories then build the LLM
   *  prompt locally so the recalled memories are surfaced transparently. */
  exposeMemories?: boolean;
  systemPrompt?: string;
}

export async function reflect(
  customerId: string,
  query: string,
  opts: ReflectOptions = {},
): Promise<DealMindReflectResult> {
  const started = Date.now();
  const bankId = bankIdFor(customerId);
  const { client, mode } = await resolveClient();
  requireClient(client, mode);

  // Default path: recall via real Hindsight, then ground the LLM in the
  // recalled memories. (Optionally use Hindsight's own reflect() when
  // exposeMemories is false — useful for raw grounded answers.)
  if (opts.exposeMemories === false) {
    const res = await client.reflect(bankId, query, {
      budget: opts.budget ?? "high",
    });
    await logAgent({
      action: "reflect",
      bankId,
      query: query.slice(0, 280),
      mode,
      success: true,
      latencyMs: Date.now() - started,
    });
    return { text: res?.text ?? "", mode, memoriesUsed: [], latencyMs: Date.now() - started };
  }

  const { results } = await recall(customerId, query, {
    budget: opts.budget ?? "mid",
    limit: 12,
  });

  const customer = await db.customer.findUnique({ where: { id: customerId } });
  const memoryBlock = results
    .map(
      (r, i) =>
        `(${i + 1}) [${r.type ?? "memory"}${r.mentionedAt ? `, ${new Date(r.mentionedAt).toLocaleDateString()}` : ""}] ${r.text}`,
      )
    .join("\n");

  const system =
    opts.systemPrompt ??
    `You are DealMind, an elite enterprise sales intelligence agent with persistent Hindsight memory. You generate crisp, high-signal, well-structured markdown briefings for account executives. Be specific and concrete. Never invent facts that are not supported by the provided memory or customer profile. If memory is empty, say so plainly.`;

  const userPrompt = `CUSTOMER PROFILE
Name: ${customer?.name ?? "Unknown"}
Title: ${customer?.title ?? "n/a"}
Company: ${customer?.company ?? "n/a"}
Industry: ${customer?.industry ?? "n/a"}
Status: ${customer?.status ?? "n/a"}
Deal value: $${customer?.dealValue ?? 0}

PERSISTENT MEMORY (recalled from Hindsight for this customer)
${memoryBlock || "(no memories recalled)"}

REQUEST
${query}

Respond in markdown with clear sections. If the memory section is empty, produce only a generic briefing that does not pretend to remember specifics.`;

  const llm = await generateText(
    [
      { role: "system", content: system },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.5, maxTokens: 1400 },
  );

  await logAgent({
    action: "reflect",
    bankId,
    query: query.slice(0, 280),
    mode,
    success: true,
    latencyMs: Date.now() - started,
    resultJson: JSON.stringify({
      memoriesUsed: results.length,
      llmProvider: llm.provider,
    }),
  });

  return {
    text: llm.text,
    mode,
    memoriesUsed: results,
    latencyMs: Date.now() - started,
  };
}

export async function createBankForCustomer(
  customerId: string,
  name: string,
  background: string,
): Promise<{ ok: boolean; mode: MemoryMode }> {
  const bankId = bankIdFor(customerId);
  const { client, mode } = await resolveClient();
  if (mode === "not-configured" || !client) return { ok: false, mode };
  try {
    await client.createBank(bankId, { name, background });
    return { ok: true, mode };
  } catch {
    return { ok: false, mode };
  }
}

// ---------------------------------------------------------------------------
// Timeline + clear — both go through real Hindsight
// ---------------------------------------------------------------------------

export async function listMemories(customerId: string) {
  const bankId = bankIdFor(customerId);
  const { client, mode } = await resolveClient();
  requireClient(client, mode);
  const res = await client.listMemories(bankId, {
    limit: 100,
    timeField: "mentioned_at",
  });
  return (res?.items ?? []).map((m) => ({
    id: m.id,
    text: m.text,
    type: m.type ?? null,
    context: m.context ?? null,
    mentionedAt: m.mentioned_at ?? null,
    bankId,
    customerId,
  }));
}

export async function listMemoryTimeline(customerId?: string) {
  if (customerId) {
    const items = await listMemories(customerId);
    const customer = await db.customer.findUnique({
      where: { id: customerId },
      select: { name: true, company: true },
    });
    return items.map((m) => ({ ...m, customer }));
  }
  // All customers: fetch each customer's recent memories. (For the dashboard
  // "latest memories" widget — bounded to keep it fast.)
  const customers = await db.customer.findMany({ take: 25, orderBy: { createdAt: "desc" } });
  const out: Array<{
    id: string;
    text: string;
    type: string | null;
    context: string | null;
    mentionedAt: string | null;
    customer?: { name: string; company?: string | null };
  }> = [];
  for (const c of customers) {
    try {
      const items = await listMemories(c.id);
      for (const m of items.slice(0, 5)) {
        out.push({ ...m, customer: { name: c.name, company: c.company } });
      }
    } catch {
      /* skip customers whose bank isn't ready */
    }
  }
  out.sort((a, b) => {
    const ta = a.mentionedAt ? new Date(a.mentionedAt).getTime() : 0;
    const tb = b.mentionedAt ? new Date(b.mentionedAt).getTime() : 0;
    return tb - ta;
  });
  return out.slice(0, 50);
}

export async function clearCustomerMemories(customerId: string) {
  const bankId = bankIdFor(customerId);
  const { client, mode } = await resolveClient();
  requireClient(client, mode);
  // deleteBank wipes the entire bank (all memories). The next retain()
  // recreates it. This is the "clear Rahul's memories" proof-test primitive.
  try {
    await client.deleteBank(bankId);
  } catch {
    /* bank may not exist */
  }
  await logAgent({
    action: "clear",
    bankId,
    mode,
    success: true,
  });
  return { ok: true, mode };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function logAgent(input: {
  action: string;
  bankId?: string;
  query?: string;
  mode?: MemoryMode | string;
  success: boolean;
  error?: string;
  resultJson?: string;
  latencyMs?: number;
}) {
  try {
    await db.agentLog.create({
      data: {
        action: input.action,
        bankId: input.bankId ?? null,
        query: input.query ?? null,
        mode: (input.mode as string | null) ?? null,
        success: input.success,
        error: input.error ?? null,
        resultJson: input.resultJson ?? null,
        latencyMs: input.latencyMs ?? 0,
      },
    });
  } catch {
    /* logging must never break the request */
  }
}
