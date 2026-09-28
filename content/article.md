<!-- word count: ~1,430 -->

# DealMind: Building an AI Sales Agent That Never Forgets

## The Real Problem: Reps Walk In Cold

The modern sales rep juggles 40, 60, sometimes 100+ accounts. Conversations blur together. A prospect mentioned a budget freeze three weeks ago, and now nobody on the team can recall whether it was Q2 or Q3, whether it was a hard freeze or a soft one, or whether anyone ever circled back. By the time the next meeting rolls around, the rep is effectively walking in cold — armed with whatever the CRM owner bothered to type into a "Last Contact" note and not much else.

CRM notes were never designed to be *memory*. They are a transactional log: contact added, opportunity moved to Stage 2, task completed. They capture what happened, not what it means. When a rep asks "what do I actually know about this account?", the CRM answers with a date stamp, not a synthesis.

This is the gap DealMind closes. DealMind is an AI Sales Intelligence Agent that retains and recalls everything said across every conversation with a customer — and uses that persistent memory to prepare a rep for the next meeting the way a great sales manager would.

## The Solution: A Sales Agent With Persistent Memory

DealMind sits between the rep and the customer. Every conversation — call notes, email threads, chat transcripts — is ingested and *retained* into a per-customer memory bank. When the rep opens a customer record, DealMind *recalls* the specific facts that matter for this meeting, and when the rep asks "prepare me for my next meeting with Rahul," DealMind grounds the briefing in the entire history of that customer and returns a markdown answer that is unmistakably about *that* account.

The verbs matter because they are not synonyms. Retain is the write path. Recall is the retrieval path. The briefing itself is the synthesis path — a markdown answer grounded in the bank's actual memories. A rep who only had recall would still have to read everything. The synthesis does the reading for them.

## What Hindsight Is, and Why It Matters

Hindsight is Vectorize's semantic memory system — a memory layer designed for AI agents that need to remember things across sessions, users, and time. The official TypeScript SDK is published on npm as `@vectorize-io/hindsight-client` and `@vectorize-io/hindsight-all` (currently at version 0.10.1). The client exposes a small, deliberate API surface:

- `createBank(bankId, { name, background })` — create or update a memory bank with a personality.
- `retain(bankId, content, options?)` — write content into the bank. Returns `{ success, bank_id, items_count, async }`.
- `recall(bankId, query, { budget })` — retrieve ranked memories for a query. Each result carries `id`, `text`, `context`, `mentioned_at`, `metadata`, `scores`.
- `reflect(bankId, query, { budget })` — return a markdown answer grounded in the bank's memories plus its identity. Returns `{ text, based_on?, usage? }`.
- `listMemories(bankId, …)` and `deleteBank(bankId)` — enumerate and wipe a bank.
- `getVersion()` — `{ api_version, features }`.

Why this matters for sales: memory, not prompting, is what makes an agent feel like it actually *knows* a customer. A generic LLM asked "prepare me for Rahul" will produce a generic briefing. An LLM grounded in a memory bank that *retained* Rahul's price objection, his mention of a competitor, and his CRM-integration requirement will produce a briefing that is unmistakably about Rahul.

## The Architecture

DealMind is built on the production stack of the Z.ai workspace: **Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, and Prisma 6 on SQLite**. The original spec asked for a Python FastAPI backend, but the workspace runtime is a single full-stack Next.js app — there is no separate Python service to deploy — so the implementation runs entirely on Next.js API routes. This is documented honestly in the README. The Hindsight SDK ships a Node.js/TypeScript client, so no Python is required for memory. Prisma is application storage only — customers, conversations, follow-ups, meeting briefs, and an audit log. It is **not** the memory engine.

The memory engine is the **real local Hindsight daemon**, running as a mini-service on port 8888 via `@vectorize-io/hindsight-all`'s `HindsightServer` (which uses `uv`/`uvx` under the hood to run the `hindsight-embed` Python package). On every memory operation, DealMind instantiates a real `HindsightClient` and calls `retain` / `recall` / `listMemories` / `deleteBank` against that daemon. There is no silent fallback: if the daemon is not reachable, the UI says so plainly — *"Hindsight is not configured. Memory features require a Hindsight connection."*

The daemon needs an LLM of its own for memory consolidation. Rather than require a new external API key, DealMind ships a tiny wire-format proxy (`mini-services/llm-proxy`, port 3030) that receives OpenAI-format calls from the daemon and forwards them to the in-sandbox z-ai endpoint, injecting the `X-Z-AI-From` header z-ai's gateway requires. The whole product — the daemon's consolidation LLM and the briefing-generation LLM — runs on the existing z-ai credentials. No new key.

## The Before/After: Rahul Sharma

The headline demo is a single customer, Rahul Sharma, across three conversations:

1. Rahul says the product is too expensive.
2. Rahul mentions Competitor X.
3. Rahul says CRM integration is important.

Each conversation is *retained* into Rahul's memory bank. Then the rep asks: "Prepare me for my next meeting with Rahul."

**Without memory**, the briefing is generic. It says Rahul is a valued customer, recommends talking about ROI, suggests following up on next steps. It is indistinguishable from a briefing for any other customer. It does not recall the price objection, the competitor, or the CRM requirement.

**With Hindsight memory**, the briefing is unmistakably about Rahul. It opens by acknowledging the price objection and reframing value. It names Competitor X and positions a differentiator. It commits to walking through CRM integration in the next meeting. The same prompt, the same LLM — the only difference is what the agent can remember.

This is not a static demo. Clearing Rahul's bank with `deleteBank` and re-running the meeting-prep produces a generic briefing again; re-retaining the three facts produces the personalized one. The before/after difference is *caused* by Hindsight, and you can prove it on demand.

## Actual Implementation

Retaining a conversation is a single call against the real daemon:

```ts
import { HindsightClient } from "@vectorize-io/hindsight-client";
const client = new HindsightClient({ baseUrl: "http://127.0.0.1:8888" });
await client.createBank(`dealmind-${rahulId}`, {
  name: "DealMind · Rahul", background: "Customer memory for DealMind.",
});
await client.retain(`dealmind-${rahulId}`, conversationText, {
  context: "Discovery call — pricing", metadata: { type: "objection" },
});
```

Recall is similarly direct — pass a query and a budget:

```ts
const { results } = await client.recall(
  `dealmind-${rahulId}`,
  "what are Rahul's objections and priorities?",
  { budget: "mid" },
);
// results: [{ id, text, context?, mentioned_at?, metadata?, scores? }]
```

The before/after fork in the meeting-prep API route is the heart of the demo. The "with memory" branch calls `recall` on the real daemon, then grounds the briefing LLM in whatever came back:

```ts
// WITHOUT memory: the LLM sees only the customer's name/title/company.
const without = await llm.generateText([systemNoMemory, profileOnly]);

// WITH Hindsight: recall real memories, then ground the briefing in them.
const { results } = await client.recall(bankId, query, { budget: "mid" });
const block = results.map((r, i) => `(${i+1}) [${r.type}] ${r.text}`).join("\n");
const with_ = await llm.generateText([systemGrounded, `${profile}\nMEMORY:\n${block}`]);
```

That is the entire mechanism. Memory makes the difference.

One honest caveat on `reflect()`: Hindsight's own `reflect` endpoint uses an agentic tool-calling loop that requires a model emitting OpenAI-format `tool_calls`. The z-ai model the proxy serves does not, so `client.reflect()` is not used. DealMind's meeting-prep calls `client.recall()` (real Hindsight, proven) and then synthesizes the briefing with the z-ai LLM directly — the same write/retrieve/synthesize shape, just with the synthesis step in the app rather than the daemon.

## Lessons Learned

First, the API surface of Hindsight is small on purpose. `retain`, `recall`, `reflect` map cleanly onto write, retrieve, and synthesize — and that mapping is exactly the shape a sales agent needs. There was never a reason to invent a fourth verb.

Second, the daemon's LLM does not have to be the same provider as the app's LLM, and routing it through a small adapter proxy lets the whole stack run on credentials you already have. The proxy is forty lines of code and changes no semantics.

Third, per-customer memory banks are the right granularity. A bank-per-customer gives recall a tight, scoped corpus, which keeps briefings specific and scores meaningful. A single global bank would dilute both.

## Limitations

DealMind does not yet auto-ingest call transcripts from Zoom or Gong — conversations are entered or pasted in. The local daemon's first run downloads roughly 6 GB of ML dependencies (torch, triton, CUDA bindings, an embedding model) and needs around 8 GB of free disk and at least 4 GB of RAM; lighter deployments should point `HINDSIGHT_BASE_URL` at a managed Hindsight API instead of running the daemon locally. The `reflect` endpoint specifically needs a tool-calling LLM; DealMind routes around it. Finally, there is no PII redaction pipeline yet — a production deploy should redact before `retain`.

The point, though, stands: a sales agent that remembers is a categorically different product from one that does not. DealMind shows exactly where the line is.
