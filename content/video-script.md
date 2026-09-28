# DealMind — 3-Minute Video Script

**Total runtime: ~3:00**
**Format:** single narrator + screen capture / cutaways
**Tone:** confident, technical-but-approachable

---

## 0:00–0:15 — Introduction

**Narration:**
"This is DealMind — an AI sales agent with persistent memory. In the next three minutes I'm going to show you the exact moment memory changes everything: a meeting-prep briefing that, with one switch flipped, goes from generic to genuinely personalized."

**Visual:** Quick montage — DealMind dashboard, a customer record, the "Prepare me for my next meeting" button being clicked. End on a hard cut to the DealMind logo on an emerald/slate background.

---

## 0:15–0:30 — The Problem

**Narration:**
"Sales reps don't lose deals because they lack a CRM. They lose them because, by meeting number four, nobody remembers meeting number one. The price objection, the competitor, the integration requirement — it all blurs into 'Last Contact: 12 days ago.'"

**Visual:** A CRM-style screen with vague "Last Contact" notes scrolling past, dates highlighting, voiceover. Subtle desaturated color grade.

---

## 0:30–0:50 — Agent Without Memory

**Narration:**
"Here's an AI sales agent preparing a rep for a meeting with a customer named Rahul — but with memory turned off. Watch the briefing it produces. 'Rahul is a valued customer, discuss ROI, follow up on next steps.' It could be about anyone. It mentions no price, no competitor, no requirement. It's forgetful by design."

**Visual:** Screen recording of the Meeting Prep page, memory toggle OFF. The generic briefing text fades in line by line. Highlight the absence of any specific fact.

---

## 0:50–1:05 — Conversation 1 (Price)

**Narration:**
"Let's rewind. Three conversations ago, Rahul told the rep the product felt too expensive. That got captured."

**Visual:** Chat-style UI. Message from Rahul: "Honestly, the price feels high for what we'd get right now." Rep note: "Retained." Memory badge: "1 item retained."

---

## 1:05–1:20 — Hindsight Retain

**Narration:**
"Behind the scenes, DealMind called Hindsight's `retain` method on Rahul's memory bank. One line — `client.retain('customer-rahul', conversationText)`. The conversation is now part of Rahul's persistent memory, not a CRM log entry."

**Visual:** Code overlay showing the `retain` call. Animated packet flowing from the conversation card into a "Rahul memory bank" container labeled with the Hindsight logo.

---

## 1:20–1:35 — Conversation 2 (Competitor X)

**Narration:**
"Conversation two. Rahul mentions Competitor X by name — says they're already being evaluated."

**Visual:** Second conversation card. Rahul: "We're also looking at Competitor X — they're cheaper." Rep note: "Retained." Memory badge updates to "2 items retained."

---

## 1:35–1:50 — Conversation 3 (CRM Integration)

**Narration:**
"Conversation three. Rahul says CRM integration isn't optional — it's a deal-breaker. That gets retained too."

**Visual:** Third conversation card. Rahul: "If it doesn't integrate with our CRM cleanly, this is a non-starter for us." Rep note: "Retained." Badge: "3 items retained."

---

## 1:50–2:10 — Hindsight Recall

**Narration:**
"Now DealMind can do something a CRM can't: it can `recall`. We ask, 'what are Rahul's objections and priorities?' and Hindsight returns the ranked memories — the price objection, the competitor mention, the CRM requirement — each with a relevance score and the context it was said in. This is retrieval, not search."

**Visual:** Code overlay: `client.recall('customer-rahul', query, { budget: 'mid' })`. Results list slides in: three rows, each with the actual text from the three conversations and small score bars.

---

## 2:10–2:45 — Personalized Meeting Preparation

**Narration:**
"Now flip the switch. Same prompt — 'prepare me for my next meeting with Rahul' — but with Hindsight memory on. DealMind calls `reflect`. The briefing opens by acknowledging the price objection and reframing value against Competitor X. It commits to walking through CRM integration in the next meeting. Same LLM. Same prompt. The only thing that changed is what the agent could remember. This briefing could only ever be about Rahul."

**Visual:** Split screen. Left: the generic briefing from earlier (greyed, struck through). Right: the personalized briefing fading in line by line. Three facts highlighted as they're referenced — price, Competitor X, CRM integration. Memory toggle now ON, glowing emerald.

---

## 2:45–3:00 — Key Takeaway

**Narration:**
"Memory, not prompting, is what makes an agent feel like it knows your customer. DealMind runs on Next.js with the official Hindsight SDK — real `retain`, real `recall`, real `reflect`. Try it: flip the memory switch, and watch the same prompt produce a categorically different answer."

**Visual:** DealMind logo, emerald on slate. Tagline: "An AI sales agent that never forgets a customer." Subtle URL card. Fade to black.

---

**End — 3:00**
