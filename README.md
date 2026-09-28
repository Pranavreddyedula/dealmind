# DealMind

> **An AI sales intelligence agent with persistent Hindsight memory — so every meeting starts prepared.**

DealMind retains and recalls everything said across every conversation with a customer, using the real [Hindsight](https://github.com/vectorize-io/hindsight) memory system, and grounds every meeting briefing, follow-up, and Q&A in those retained memories. A vanilla CRM + LLM gives you a generic briefing; DealMind gives you one that is unmistakably about *that* customer.

---

## The problem

Modern sales reps juggle 40, 60, sometimes 100+ accounts. Conversations blur together. A prospect mentioned a budget freeze three weeks ago — and now nobody can recall whether it was Q2 or Q3, whether it was a hard freeze or a soft one, or whether anyone ever circled back. By the time the next meeting rolls around, the rep is effectively walking in cold, armed with whatever the CRM owner bothered to type into a "Last Contact" note.

CRM notes were never designed to be *memory*. They are a transactional log — they capture what happened, not what it means. When a rep asks "what do I actually know about this account?", the CRM answers with a date stamp, not a synthesis.

## The solution

DealMind sits between the rep and the customer. Every conversation — call notes, email threads, chat transcripts — is ingested and **retained** into a per-customer Hindsight memory bank. When the rep opens a customer record, DealMind **recalls** the specific facts that matter for this meeting. When the rep asks *"prepare me for my next meeting with Rahul,"* DealMind generates a markdown briefing **grounded in the recalled memories** — naming the customer's stated objections, the competitors they mentioned, and the requirements they care about.

The three verbs are not synonyms:

- **Retain** — the write path. A fact is stored into the customer's Hindsight bank.
- **Recall** — the retrieval path. Ranked memories relevant to a query are returned.
- **Reflect** — the synthesis path. A markdown answer grounded in the bank's memories.

DealMind uses `retain` + `recall` on the real Hindsight SDK, then synthesizes the briefing with a configurable LLM (z-ai by default; Groq / OpenAI / Anthropic via env). See the [Retain / Recall / Reflect](#retain--recall--reflect) section.

## Key features

- **Persistent Hindsight memory** — every customer fact is retained via the real `@vectorize-io/hindsight-client` SDK into a managed Hindsight bank; recalled on demand. No Prisma-as-memory, no mocks, no hardcoded facts.
- **Before vs. After memory demo** — the "See the Difference Memory Makes" page runs the same meeting-prep request twice: once with no memory (generic), once grounded in recalled Hindsight memories (personalized). Proven end-to-end.
- **Customer management** — profiles, conversation transcripts, memory timelines, follow-ups.
- **Conversations** — record conversations + retain key facts into Hindsight inline.
- **Memory center** — timeline view, customer memory Q&A, raw recall with ranking scores.
- **Meeting prep** — personalized briefings citing the actual recalled memories (objections, competitors, requirements).
- **Personalized follow-ups** — generated from each customer's recalled memory.
- **Analytics** — pipeline by stage, customers by status, memory ops by Hindsight mode, 14-day memory pulse.
- **Premium enterprise UI** — 8-section sidebar (Dashboard, Customers, Conversations, Memory, Meeting Prep, Follow-ups, Analytics, Settings), dark/light themes, responsive, emerald/teal palette, framer-motion transitions.

## Hindsight integration

DealMind uses the **real, current Hindsight SDK** — never invented endpoints. The package is [`@vectorize-io/hindsight-client`](https://www.npmjs.com/package/@vectorize-io/hindsight-client) (v0.10.1, published by Vectorize). The exact methods + response shapes were verified against the package's generated TypeScript types.

```ts
import { HindsightClient } from "@vectorize-io/hindsight-client";

const client = new HindsightClient({
  baseUrl: process.env.HINDSIGHT_BASE_URL!,            // https://api.hindsight.vectorize.io
  apiKey: process.env.HINDSIGHT_API_KEY!,              // your Hindsight Cloud key
});

// create / write / read / list / wipe — all real Hindsight
await client.createBank(`dealmind-${customerId}`, { name, background });
await client.retain(bankId, content, { context, metadata, timestamp });
const { results } = await client.recall(bankId, query, { budget: "mid" });
const memoryUnits = await client.listMemories(bankId, { limit, timeField });
await client.deleteBank(bankId);                        // the "clear Rahul's memories" proof primitive
const { api_version } = await client.getVersion();
```

### Two deployment modes for Hindsight

DealMind supports both — auto-resolved at call time in `src/lib/hindsight-service.ts`:

1. **Managed Hindsight Cloud (default, production)** — `HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io` + `HINDSIGHT_API_KEY=…`. No daemon to run, reachable from anywhere (workspace + published container), survives sandbox reprovisions. **This is what the published deployment uses.**
2. **Local embedded daemon (optional, dev)** — `HINDSIGHT_EMBED_LOCAL=true` + `uvx` on PATH + an LLM provider key. `mini-services/hindsight-daemon` embeds a local Hindsight via `@vectorize-io/hindsight-all`'s `HindsightServer`. Heavy (~6 GB ML deps) — use only when you can't reach the Cloud API.

> **No silent fallback.** If Hindsight is not reachable, the UI shows *"Hindsight is not configured. Memory features require a Hindsight connection."* and memory API routes return `503 hindsight_not_configured`. Prisma is application storage only (customers, conversations, follow-ups, meeting briefs, audit log) — never the memory engine.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Next.js 16 (App Router) · TypeScript · Tailwind 4 · shadcn/ui │
│  src/app/page.tsx → <AppShell/> (single premium SPA on /)    │
│    Sidebar · Topbar · 8 views · Footer                       │
└──────────────────────────┬───────────────────────────────────┘
                           │ fetch (relative URLs)
┌──────────────────────────▼───────────────────────────────────┐
│  Next.js API routes (src/app/api/**) — 17 routes             │
│   /api/customers  /api/conversations  /api/memory/{retain,   │
│     recall, qa}  /api/meeting-prep  /api/followups  /api/    │
│     analytics  /api/agent/status  /api/settings  /api/seed   │
│     /api/timeline  /api/diag  /api/customers/[id]  ...       │
└──────────────────────────┬───────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        ▼                                       ▼
┌──────────────────────┐            ┌────────────────────────┐
│ Hindsight memory      │            │ LLM agent             │
│ src/lib/              │            │ src/lib/llm-service.ts │
│  hindsight-service.ts │            │  z-ai (default) |     │
│  retain / recall /    │            │  Groq | OpenAI |      │
│  reflect / createBank │            │  Anthropic (env-driven)│
│  listMemories /       │            └────────────────────────┘
│  deleteBank           │
└──────────┬───────────┘
           │ HindsightClient → https://api.hindsight.vectorize.io
           ▼
┌──────────────────────┐
│ Vectorize Hindsight    │  (managed Cloud API — api_version 0.10.1)
│ Cloud API              │  retain / recall / reflect / listMemories / createBank / getVersion / deleteBank
└──────────────────────┘

┌──────────────────────┐
│ Prisma 6 · SQLite     │  (app data ONLY: customers, conversations,
│ prisma/schema.prisma  │   messages, follow-ups, meeting briefs, AgentLog audit)
└──────────────────────┘
```

### Data model (Prisma / SQLite — application storage only)

| Model | Purpose |
| --- | --- |
| `Customer` | Account + profile (name, title, company, industry, status, dealValue). `email` is `@unique`. |
| `Conversation` | A recorded call/meeting/email with `sentiment` + `summary`. |
| `Message` | The transcript lines (`customer` / `salesperson` / `agent` / `note`). |
| `FollowUp` | Generated personalized follow-up drafts (`status`: pending/sent/done/snoozed). |
| `MeetingBrief` | Persisted before/after briefings (`mode`: without-memory / with-memory). |
| `AgentLog` | Audit log of every Hindsight op (`retain`/`recall`/`reflect`/`meeting-prep`/`followup`/`qa`), with `mode` + `latencyMs`. |
| `Settings` | Key/value app settings. |

> Memory is **not** stored in Prisma. All `retain`/`recall`/`listMemories` go through the real Hindsight SDK. The `Memory` table is a legacy echo + audit artifact — the source of truth for recall is always Hindsight.

## Retain / Recall / Reflect

These are the three memory operations DealMind performs against the real Hindsight Cloud API.

### `retain(customerId, content, { context, type, metadata, mentionedAt })`
**Write path.** Stores a fact into the customer's Hindsight bank (`dealmind-<customerId>`). The bank is created on first retain via `createBank`. Used by:
- The seed script (`src/lib/seed.ts`) — retains Rahul's 3 conversations.
- The Conversations view ("Save a fact to Hindsight memory" box) — inline retain.

### `recall(customerId, query, { budget })`
**Retrieval path.** Returns ranked memories relevant to the query, each with `id`, `text`, `context`, `type`, `mentionedAt`, `metadata`, `scores`, `source: "hindsight"`. Used by:
- The Memory view → "Raw recall" tab.
- The Memory view → "Memory Q&A" tab (recall → ground the LLM answer).
- The Meeting Prep route (recall → ground the briefing LLM).

### `reflect(customerId, query, { exposeMemories })`
**Synthesis path.** By default (`exposeMemories: true`, used by meeting-prep + Q&A): `recall()` runs first, then the LLM generates a markdown answer grounded in the recalled memories — so the recalled memories are surfaced transparently. When `exposeMemories: false`, DealMind can call Hindsight's own `client.reflect()` (grounded in the bank's identity + memories server-side).

## Before vs. After memory demo

The headline demo lives in the **Meeting Prep** view ("See the Difference Memory Makes"). For one request — *"Prepare me for my next meeting with Rahul."* — DealMind generates **two** briefings:

| Without memory | With Hindsight memory |
| --- | --- |
| The LLM sees ONLY the customer's name/title/company | `recall()` pulls the customer's retained Hindsight memories, then the LLM grounds the briefing in them |
| Generic ("understand Rahul's priorities", "industry trends") | Personalized — cites the price objection, Competitor X, the CRM/Salesforce requirement |
| Right card: amber, "Generic" | Right card: emerald, "Personalized", "Source: Hindsight" |

### The Rahul Sharma demo

1. **Conversation 1** — Rahul says the product is **too expensive**. → retained.
2. **Conversation 2** — Rahul mentions **Competitor X**. → retained.
3. **Conversation 3** — Rahul says **CRM integration is important**. → retained.

Then in Meeting Prep → "Generate both":
- **WITHOUT MEMORY**: generic briefing (no recollection of price, competitor, or CRM requirement).
- **WITH HINDSIGHT MEMORY**: personalized briefing citing the price objection, Competitor X, and the bidirectional Salesforce-sync requirement, with objection-handling talk tracks.

### Proof the demo is not hardcoded

`scripts/rahul-proof.ts` runs the proof: `deleteBank()` clears Rahul's bank → recall returns 0 → Meeting Prep is generic → re-`retain()` the 3 facts via real Hindsight → recall returns 8+ results → Meeting Prep is personalized again. The before/after difference is **caused by Hindsight**, provable on demand.

## Setup instructions

### Prerequisites

- **Node.js ≥ 20** + **Bun** (the runtime)
- **A Hindsight Cloud API key** — sign up (free) at <https://ui.hindsight.vectorize.io/signup> and create a key

### Install + configure

```bash
# 1. Clone
git clone <your-fork-url> dealmind
cd dealmind

# 2. Install dependencies
bun install

# 3. Configure environment
cp .env.example .env
# Edit .env and set HINDSIGHT_API_KEY to your real key from ui.hindsight.vectorize.io/signup

# 4. Push the Prisma schema to SQLite
bun run db:push

# 5. Start the dev server
bun run dev
```

The app is at <http://localhost:3000>. On first load it auto-seeds the Rahul Sharma demo dataset (4 customers, 7 conversations, 7 retained memories).

## Environment variables

All variables live in `.env` (git-ignored). See [`.env.example`](./.env.example) for the full list.

| Variable | Required? | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | SQLite file path for Prisma (app data) |
| `HINDSIGHT_BASE_URL` | yes | `https://api.hindsight.vectorize.io` (managed Hindsight Cloud) |
| `HINDSIGHT_API_KEY` | yes | Your Hindsight Cloud key (from ui.hindsight.vectorize.io/signup) |
| `GROQ_API_KEY` | optional | Use Groq as the sales-agent LLM (preferred per spec) |
| `OPENAI_API_KEY` | optional | Use OpenAI as the sales-agent LLM |
| `ANTHROPIC_API_KEY` | optional | Use Anthropic as the sales-agent LLM |
| `HINDSIGHT_EMBED_LOCAL` | optional (dev) | `true` to use the local daemon instead of the Cloud API |

**With no LLM key set**, the app defaults to the in-sandbox `z-ai-web-dev-sdk`. **The only key you must provide is `HINDSIGHT_API_KEY`** — without it, retain/recall return `401 Authentication failed`.

## Local development instructions

```bash
bun run dev          # start the dev server on port 3000 (Turbopack)
bun run lint         # ESLint
bun run build        # production build (next build --webpack → .next/standalone)
bun run db:push      # push schema to SQLite (after schema changes)
bun run db:generate  # regenerate the Prisma client
```

### Optional: local Hindsight daemon (instead of Cloud API)

Only if you can't reach the Cloud API. Requires `uvx` on PATH + ~8 GB free disk + an LLM provider key.

```bash
bash mini-services/llm-proxy/start.sh        # OpenAI→z-ai wire-format adapter (port 3030)
bash mini-services/hindsight-daemon/start.sh # local Hindsight daemon (port 8888)
# then set HINDSIGHT_EMBED_LOCAL=true in .env (comment out HINDSIGHT_BASE_URL)
```

## Demo instructions

1. Open <http://localhost:3000> — auto-seeds on first load (or click "Re-seed demo" in the top bar).
2. Go to **Meeting Prep** (the "DEMO" nav item). Rahul Sharma is auto-selected; the query is pre-filled.
3. Click **Generate both**.
4. **Left card (Without memory)** = generic. **Right card (With Hindsight memory)** = personalized, citing the 3 retained memories (price objection, Competitor X, CRM requirement) with "Source: Hindsight" labels.
5. Open **Memory → Raw recall** → query `pricing budget competitor` → see the same memories ranked.
6. Open **Memory → Memory Q&A** → ask *"What are Rahul's main objections?"* → answer grounded in real Hindsight recall.

### Prove it's not hardcoded

```bash
bun run scripts/rahul-proof.ts   # clear Rahul's bank → generic → re-retain → personalized
```

## Deployment notes

DealMind is a Next.js 16 standalone build deployed behind a Caddy gateway. The production start flow (`/.zscripts/start.sh`):

1. `build.sh` runs `bun install` → `next build --webpack` → packages `.next/standalone` + `mini-services-dist` + `db` + `.env` + `Caddyfile` + `start.sh` into a tarball.
2. `start.sh` starts the Next.js standalone server (port 3000), runs mini-services (if any), then runs Caddy as the main process.
3. Caddy reverse-proxies the public URL → `localhost:3000`.

### Why the managed Hindsight Cloud API is the right production choice

The published container is a clean production image — it does **not** contain `uvx`, `/etc/.z-ai-config`, or the 6 GB of ML dependencies the local Hindsight daemon needs. The managed Cloud API (`https://api.hindsight.vectorize.io`) is reachable from any container over HTTPS, so the published DealMind app connects to it directly with `HINDSIGHT_BASE_URL` + `HINDSIGHT_API_KEY` from the packaged `.env`. No daemon to run, no disk/RAM limits, survives sandbox reprovisions.

### Build reliability

The sandbox's overlay filesystem is disk-tight. `/.zscripts/build.sh` includes a **pre-build disk-cleanup step** (frees `.next` + `/tmp` + bun cache before `next build`) to prevent "No space left on device" deploy failures. The build also uses `next build --webpack` (lower memory than Turbopack).

## Repository structure

```
.
├── prisma/schema.prisma              # Customer, Conversation, Message, FollowUp, MeetingBrief, AgentLog, Settings
├── src/
│   ├── app/
│   │   ├── page.tsx                  # <AppShell/> — the only user route (/)
│   │   ├── layout.tsx                # ThemeProvider, fonts, Toaster
│   │   ├── globals.css               # emerald/teal palette, premium scrollbars
│   │   └── api/                      # 17 route handlers (the backend)
│   ├── lib/
│   │   ├── db.ts                     # Prisma client
│   │   ├── hindsight-service.ts      # ← real Hindsight SDK (retain/recall/reflect/createBank/listMemories/deleteBank)
│   │   ├── llm-service.ts            # configurable LLM (z-ai/Groq/OpenAI/Anthropic)
│   │   ├── followup-service.ts       # personalized follow-up generation
│   │   └── seed.ts                   # Rahul Sharma + demo dataset
│   └── components/
│       ├── ui/                       # shadcn/ui (New York style)
│       └── dealmind/                 # AppShell, Sidebar, Topbar, Footer, 8 views
├── mini-services/                   # optional local daemon + llm-proxy (dev only)
│   ├── hindsight-daemon/
│   └── llm-proxy/
├── scripts/                          # hindsight-proof.ts, rahul-proof.ts (verification)
├── content/                          # article, LinkedIn, video script, titles, thumbnail, checklist
├── docs/                             # architecture.md, screenshots-checklist.md
├── .env.example                      # variable names only (no secrets)
├── .gitignore                        # excludes .env, db, node_modules, .next, logs, secrets
├── package.json
├── next.config.ts                    # output: "standalone", build: --webpack
├── Caddyfile                         # gateway config (reverse_proxy localhost:3000)
└── README.md
```

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | **Next.js 16** (App Router, Turbopack dev / webpack build) |
| Language | **TypeScript 5** |
| Styling | **Tailwind CSS 4** + **shadcn/ui** (New York) |
| Database | **Prisma 6** ORM + **SQLite** (app data only) |
| Memory | **`@vectorize-io/hindsight-client` 0.10.1** → managed Hindsight Cloud API |
| LLM | **`z-ai-web-dev-sdk`** (default) — configurable to **Groq / OpenAI / Anthropic** via env |
| Charts | Recharts |
| Motion | Framer Motion |
| State | Zustand (client) + typed fetch wrappers |

## Security

- All API keys live in environment variables — never in code.
- `.env` is git-ignored; `.env.example` documents every variable with no secrets.
- The Hindsight client receives only `HINDSIGHT_API_KEY` — your LLM provider keys are never sent to Hindsight.
- No secrets are logged.

## License

MIT — DealMind. Real Hindsight SDK © Vectorize.
