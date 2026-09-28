# DealMind — Architecture

This document describes how DealMind is structured, why each piece is where it
is, and exactly how the Hindsight memory integration works.

## 1. High-level

DealMind is a **single Next.js 16 application**. There is no separate backend
process — the backend is **Next.js API routes** (route handlers under
`src/app/api/**`). The frontend is a **single-page app rendered at `/`**
(`src/app/page.tsx` → `<AppShell/>`) that switches "views" client-side.

This is a deliberate, honest adaptation of the original spec (which proposed a
Python FastAPI backend): the Z.ai production runtime is strictly Next.js +
TypeScript, and the real Hindsight SDK ships a TypeScript client, so no Python
is required for the memory layer. The API surface is equivalent (REST routes +
a typed service layer + Prisma).

```
Browser  ──fetch──▶  Next.js API routes  ──▶  hindsight-service  ──▶  Hindsight SDK
                       (src/app/api/**)        (src/lib/)              (@vectorize-io/hindsight-client)
                                │
                                └──▶  llm-service  ──▶  z-ai / Groq / OpenAI / Anthropic
                                └──▶  Prisma  ──▶  SQLite
```

## 2. Data model (Prisma / SQLite)

Defined in `prisma/schema.prisma`:

| Model | Purpose |
| --- | --- |
| `Customer` | Account + profile (name, title, company, industry, status, dealValue, avatarHue). `email` is `@unique` so re-seeding is idempotent. |
| `Conversation` | A recorded call/meeting/email with `sentiment` + `summary`. |
| `Message` | The transcript lines (`customer` / `salesperson` / `agent` / `note`). |
| `Memory` | **The durable echo** of what was retained into Hindsight — also the Tier-C fallback store. Has `bankId`, `content`, `context`, `type` (objection/competitor/requirement/preference/fact/observation), `mentionedAt`, `metadataJson`. |
| `FollowUp` | Generated personalized follow-up drafts (`status`: pending/sent/done/snoozed). |
| `MeetingBrief` | Persisted before/after briefings (`mode`: without-memory / with-memory) — used by the demo + analytics. |
| `AgentLog` | Audit log of every memory op (`retain`/`recall`/`reflect`/`meeting-prep`/`followup`/`qa`), with `mode` + `latencyMs`. |
| `Settings` | Key/value app settings. |

## 3. Memory service — the heart

`src/lib/hindsight-service.ts` is the single integration point with Hindsight.
It exposes `retain`, `recall`, `reflect`, `createBankForCustomer`, `getHindsightStatus`,
`listMemories`, `listMemoryTimeline`, `clearCustomerMemories`.

### 3.1 The real SDK API used (verbatim from the package's generated types)

```ts
import { HindsightClient } from "@vectorize-io/hindsight-client";

const client = new HindsightClient({ baseUrl, apiKey? });
await client.retain(bankId, content, { context, metadata, documentId, timestamp });
const { results } = await client.recall(bankId, query, { budget: "low"|"mid"|"high" });
const { text } = await client.reflect(bankId, query, { budget });
await client.createBank(bankId, { name, background });
const { api_version, features } = await client.getVersion();
```

`RecallResult = { id, text, context?, type?, mentioned_at?, metadata?, scores? }`.
`RetainResponse = { success, bank_id, items_count, async, operation_id? }`.
`ReflectResponse = { text, based_on?, usage?, trace? }`.

These are **not** invented — they come from the package's
`generated/types.gen.ts` (the package was downloaded and inspected during
development to verify the exact shapes).

### 3.2 Three-tier resolution

`resolveClient()` is called on every memory op. It caches the resolved
client for 30s.

1. **Tier A — `HINDSIGHT_BASE_URL` set** → `new HindsightClient({ baseUrl })`
   against a remote/managed Hindsight API. Optional `HINDSIGHT_API_KEY`.
2. **Tier B — `HINDSIGHT_EMBED_LOCAL=true`** → `new HindsightClient({ baseUrl: http://127.0.0.1:8888 })`,
   probed with `getVersion()`. If healthy, the app talks to a local
   `HindsightServer` daemon (from `@vectorize-io/hindsight-all`) started by the
   `mini-services/hindsight-daemon` mini-service. Requires `uv`/`uvx` + an LLM
   provider key (the daemon runs its own LLM for memory consolidation).
3. **Tier C — default** → `client = null`, `mode = "local-fallback"`. Every
   method falls through to a Prisma-backed implementation of the **same**
   interface:
   - `retain` → write a `Memory` row.
   - `recall` → load the customer's `Memory` rows, score by
     `coverage*0.7 + recency*0.15 + typeBoost*0.15`, return top-k.
   - `reflect` → `recall()` then call the LLM with a grounded prompt.
   - Every real-Hindsight retain ALSO writes a `Memory` row, so the timeline
     view renders even when the daemon is offline.

The mode is reported to the UI via `/api/agent/status` and shown as a badge in
the top bar + sidebar (`Hindsight · Remote` / `Hindsight · Local daemon` /
`Local fallback`). Nothing is faked — the fallback is a real, honest
implementation that you swap out by flipping one env var.

## 4. LLM service

`src/lib/llm-service.ts` resolves the provider at call time:

```
GROQ_API_KEY → OpenAI-compatible call to api.groq.com
else OPENAI_API_KEY → OpenAI
else ANTHROPIC_API_KEY → Anthropic messages API
else → z-ai-web-dev-sdk (default, works in-sandbox)
```

`generateText(messages, opts)` tries the resolved provider and, on failure,
falls back to `z-ai` so a transient Groq/OpenAI outage never breaks the demo.

## 5. The before/after demo (`/api/meeting-prep`)

The centerpiece. For one request `{ customerId, query }` it returns **two**
briefings:

1. **Without memory** — the LLM receives ONLY the customer's name/title/company.
   System prompt forces a generic briefing ("don't pretend to remember
   anything specific").
2. **With Hindsight memory** — `recall(customerId, query)` pulls the retained
   memories (Rahul's price objection, Competitor X, CRM requirement), then the
   LLM writes a personalized briefing with explicit `## What We Already Know`
   that cites the recalled memories.

Both briefings are persisted as `MeetingBrief` rows (mode =
`without-memory` / `with-memory`) for the timeline + analytics. The recalled
memories are returned so the UI can show "Grounded in N recalled memories"
with their types — full transparency, no hardcoding.

## 6. API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/seed` | POST | (Re)seed the Rahul Sharma + demo dataset |
| `/api/customers` | GET/POST | List / create customers |
| `/api/customers/[id]` | GET/PATCH | Full profile (incl. conversations + memories + followups) / update |
| `/api/conversations` | GET/POST | List / create with messages |
| `/api/conversations/[id]` | GET | Conversation + transcript |
| `/api/memory/retain` | POST | `retain(customerId, content, …)` |
| `/api/memory/recall` | POST | `recall(customerId, query, budget?)` |
| `/api/memory/qa` | POST | Ask a question, answered from recalled memory |
| `/api/timeline` | GET | Memory feed across customers |
| `/api/meeting-prep` | POST | The before/after demo |
| `/api/followups` | GET/POST | List / generate personalized follow-up |
| `/api/followups/[id]` | PATCH | Update status |
| `/api/analytics` | GET | Rollup metrics + memory trend |
| `/api/agent/status` | GET | Live memory mode + LLM provider |
| `/api/settings` | GET/PATCH | App settings + env snapshot |

All routes are `dynamic = "force-dynamic"` (no caching) so the demo always
reflects the latest retained memories.

## 7. Frontend

`src/components/dealmind/`:

- `app-shell.tsx` — the shell: Sidebar + Topbar + active view + Footer.
  `min-h-screen flex flex-col` wrapper + `mt-auto` on the footer → sticky
  footer when content is short, pushed down naturally when long.
- `store.ts` — Zustand store (`view`, `selectedCustomerId`, …).
- `api.ts` — typed fetch wrappers for every route.
- `sidebar.tsx`, `topbar.tsx`, `footer.tsx`, `logo.tsx`, `ui-helpers.tsx`,
  `markdown.tsx`.
- `views/`:
  - `dashboard.tsx` — pipeline + memory pulse (Recharts area chart) + top deals + latest memories.
  - `customers.tsx` — card grid + detail Sheet (profile, memories, conversations) + create modal.
  - `conversations.tsx` — list with expandable transcript + "Save a fact to Hindsight memory" inline retain.
  - `memory.tsx` — tabs: Timeline / Memory Q&A / Raw recall.
  - `meeting-prep.tsx` — **the before/after demo page** ("See the Difference Memory Makes").
  - `followups.tsx` — list + generate-from-memory sheet.
  - `analytics.tsx` — pipeline by stage, customers by status, memory types, agent ops.
  - `settings.tsx` — memory tier status, LLM provider, env snapshot, security posture.

Responsive: sidebar is `hidden md:flex` on desktop, a drawer (`MobileNav`) on
mobile triggered by a hamburger button in the topbar. All touch targets ≥ 44px.

## 8. Why this satisfies "persistent memory retain + recall"

- **Retain**: `POST /api/memory/retain` → `retain()` in `hindsight-service.ts`
  → `client.retain(bankId, content, …)` on the real SDK (or the fallback write).
- **Recall**: `POST /api/memory/recall` → `client.recall(bankId, query, { budget })`
  → returns `RecallResult[]`.
- **Persistence**: memories survive restarts — Tier A/B in the Hindsight daemon's
  store, Tier C in SQLite (`Memory` table). Re-seeding is idempotent.
- **No hardcoding**: the meeting-prep "With memory" pane calls `recall()` live;
  if you clear Rahul's memories and re-run, the personalized pane reverts to
  generic. Try it: clear memories → run demo → generic; re-seed → run demo → personalized again.
