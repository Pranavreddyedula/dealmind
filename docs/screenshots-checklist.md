# DealMind — Screenshots Checklist

Capture each of the below for the submission. All shots should be taken at
**1440×900 desktop** unless noted. Use **dark mode** (default) for premium
feel; capture a **light-mode** variant of the dashboard too.

> Save into `/home/z/my-project/download/`. Filenames in **bold** are the ones
> already captured during self-verification.

## Required screenshots

- [x] **`dashboard.png`** — Dashboard hero + 4 stat cards + memory pulse chart + top deals + latest memories (dark).
- [ ] `dashboard-light.png` — same, light mode (toggle theme top-right).
- [x] **`customers.png`** — Customers grid (Rahul, Priya, Marcus, Sofia) with status badges + counts + deal values.
- [ ] `customer-detail.png` — open Rahul's detail Sheet (click his card) showing profile, memories, conversations, "Prepare for my next meeting" CTA.
- [x] **`conversations.png`** — Conversations list (Rahul's 3 conversations).
- [ ] `conversation-expanded.png` — expand one conversation → transcript bubbles + the "Save a fact to Hindsight memory" box.
- [x] **`meeting-prep-demo.png`** — the BEFORE (Without memory, generic, amber) vs AFTER (With Hindsight memory, emerald, 3 recalled memories chips) briefings side by side. **The money shot.**
- [ ] `meeting-prep-recalled.png` — close-up of the "Recalled from Hindsight" panel showing the 3 memory type chips (requirement / competitor / objection) + their text.
- [x] **`memory-qa.png`** — Memory view → Memory Q&A tab → question "What are Rahul's main objections?" with the grounded answer + 3 recalled memories.
- [ ] `memory-timeline.png` — Memory view → Timeline tab (vertical timeline of all retained memories across customers).
- [ ] `memory-recall.png` — Memory view → Raw recall tab → query "pricing budget competitor" → ranked results with scores.
- [x] **`analytics.png`** — Analytics: pipeline by stage bar chart + customers-by-status donut + memory types + agent ops.
- [ ] `followups.png` — Follow-ups list with generated personalized drafts.
- [ ] `followups-generate.png` — the "Generate follow-up" modal with preview + "N memories used".
- [ ] `settings.png` — Settings: memory engine (Tier A/B/C cards), LLM provider, runtime, security posture, env snapshot.
- [ ] `mobile-dashboard.png` — set viewport to 390×844 (iPhone 14): hamburger topbar, stacked cards, sticky footer.

## How to capture

```bash
# Open in the Preview Panel (right side of the Z.ai workspace).
# Or with agent-browser:
agent-browser set viewport 1440 900
agent-browser open http://localhost:3000/
agent-browser screenshot download/<name>.png

# Mobile:
agent-browser set viewport 390 844
agent-browser open http://localhost:3000/
agent-browser screenshot download/mobile-dashboard.png
```

## Notes for the write-up / video

- The hero shot is **`meeting-prep-demo.png`** — the side-by-side before/after is
  the whole thesis of the product in one frame.
- Always show the **memory mode badge** in the top bar (it reads "Local
  fallback" by default — that's honest and documented; mention in the article
  that flipping one env var switches to real Hindsight).
- For the video, screen-record the Meeting Prep flow: pick Rahul → Generate
  both → scroll to the "Recalled from Hindsight" panel → scroll the WITH MEMORY
  briefing's "What We Already Know" section.
