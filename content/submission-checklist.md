# DealMind — Final Submission Checklist

Everything required for the DealMind submission, grouped by area. Tick each box only when genuinely complete.

## Repository Structure

- [ ] `README.md` exists at repo root and explains DealMind, the real local Hindsight daemon setup (no Prisma fallback), the Next.js adaptation (in lieu of Python FastAPI), and how to run the demo
- [ ] `.env.example` exists and lists every required env var with a one-line comment each
- [ ] `src/` directory contains the full Next.js app (app router, API routes, lib, components)
- [ ] `prisma/` directory contains `schema.prisma` and a migration/seed script for the Rahul Sharma demo data
- [ ] `content/` directory exists with all six deliverables (article, LinkedIn, video script, titles, thumbnail prompt, this checklist)
- [ ] `docs/` directory exists with architecture notes and the Hindsight integration diagram
- [ ] `tests/` directory exists with at least one runtime build/script test passing

## Hindsight Integration (Real SDK)

- [ ] `@vectorize-io/hindsight-client` and `@vectorize-io/hindsight-all` are installed (version 0.10.1)
- [ ] Memory service wraps a real `HindsightClient({ baseUrl, apiKey? })`
- [ ] `retain(bankId, content, options?)` is wired to the conversation-ingestion API route
- [ ] `recall(bankId, query, { budget })` is wired to the customer-detail / memory-bank view
- [ ] `listMemories(bankId, { limit, timeField })` powers the Memory timeline view
- [ ] `deleteBank(bankId)` powers the "clear Rahul's memories" proof test
- [ ] `createBank(bankId, { name, background })` is called on first retain to give each bank a personality
- [ ] `getVersion()` is surfaced on the Settings page + the sidebar AgentStatusPill (shows `api_version`)
- [ ] Real local Hindsight daemon runs via `@vectorize-io/hindsight-all` `HindsightServer` (mini-services/hindsight-daemon, port 8888, `uvx hindsight-embed`)
- [ ] `mini-services/llm-proxy` (port 3030) routes the daemon's LLM to z-ai — no new external API key required
- [ ] Prisma is application storage ONLY (customers, conversations, follow-ups, briefs, AgentLog audit) — never used as agent memory
- [ ] NO silent fallback: if the daemon is unreachable, the UI shows "Hindsight is not configured. Memory features require a Hindsight connection."
- [ ] Optional remote path (`HINDSIGHT_BASE_URL`) is supported and documented

## Rahul Sharma Demo

- [ ] Customer record for Rahul Sharma is seeded
- [ ] Conversation 1 (Rahul says the product is too expensive) is seeded and retained
- [ ] Conversation 2 (Rahul mentions Competitor X) is seeded and retained
- [ ] Conversation 3 (Rahul says CRM integration is important) is seeded and retained
- [ ] "Prepare me for my next meeting with Rahul" works in the Meeting Prep page
- [ ] WITHOUT MEMORY path produces a generic, forgetful briefing (no price, no competitor, no CRM)
- [ ] WITH HINDSIGHT MEMORY path produces a personalized briefing recalling price objection + Competitor X + CRM integration
- [ ] The before/after can be toggled by the reviewer on a single page ("See the Difference Memory Makes")

## Premium UI

- [ ] Sidebar / main navigation exposes all 8 sections: Dashboard, Customers, Conversations, Memory, Meeting Prep, Follow-ups, Analytics, Settings
- [ ] Dedicated "See the Difference Memory Makes" page exists and hosts the before/after demo
- [ ] shadcn/ui components used throughout (Card, Button, Tabs, Dialog, Badge, etc.)
- [ ] Tailwind 4 theme uses emerald/teal + slate palette (no pure blue/indigo primary)
- [ ] Empty states, loading skeletons, and toast notifications are implemented
- [ ] Dark mode supported via `next-themes`

## Content Deliverables

- [ ] `content/article.md` — 1,300–1,500 words, H1 + H2 sections, 2–3 real code snippets, no banned words
- [ ] `content/linkedin-post.md` — under 800 characters, plain text, char count comment on last line
- [ ] `content/video-script.md` — ~3:00 runtime, beats sum to 3:00, mentions Rahul's price/competitor/CRM facts
- [ ] `content/video-titles.md` — 10 titles, mix of curiosity / benefit / technical angles
- [ ] `content/thumbnail-prompt.md` — 16:9 prompt, split-screen concept, emerald/slate palette, rationale included
- [ ] `content/submission-checklist.md` — this file

## Video

- [ ] 3-minute demo video recorded (matches `content/video-script.md`)
- [ ] Thumbnail generated from `content/thumbnail-prompt.md`
- [ ] Title chosen from `content/video-titles.md`
- [ ] Video description links to the live demo URL and the repo
- [ ] Video uploaded and set to public (or unlisted with link in submission)

## Deployment Readiness

- [ ] App builds cleanly with `next build` (no type errors, no lint failures)
- [ ] Prisma client generated and SQLite DB seeded
- [ ] Live demo URL is reachable and the Rahul flow works end-to-end
- [ ] `bun install` or `npm install` from a clean clone produces a working app
- [ ] No secrets committed (`.env` is gitignored; only `.env.example` is committed)
- [ ] Production env vars documented in README under a "Deployment" section

## Environment Variables Documented

- [ ] `DATABASE_URL` — SQLite file path for Prisma (app data only)
- [ ] `HINDSIGHT_BASE_URL` — optional remote/managed Hindsight endpoint (alternative to the local daemon)
- [ ] `HINDSIGHT_API_KEY` — optional auth for the remote Hindsight endpoint
- [ ] `HINDSIGHT_EMBED_LOCAL` — set to `true` to require the local daemon (auto-probed at `http://127.0.0.1:8888` regardless)
- [ ] No new external API key required — the local daemon's LLM is routed to z-ai via `mini-services/llm-proxy` (reuses `/etc/.z-ai-config`)
- [ ] `GROQ_API_KEY` / `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` — optional, to use a different provider for the sales-agent LLM (defaults to z-ai)
- [ ] Every env var above appears in `.env.example` with a one-line description
