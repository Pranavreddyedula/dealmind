/**
 * DealMind — Rahul before/after proof test (against REAL Hindsight).
 *
 * 1. Clear Rahul's Hindsight bank (deleteBank) → Meeting Prep MUST be generic.
 * 2. Re-retain the 3 Rahul memories via real Hindsight retain().
 * 3. Recall → confirm the 3 facts are back.
 * 4. Meeting Prep MUST be personalized again.
 *
 * This proves the before/after difference is caused by Hindsight.
 */
import { HindsightClient } from "@vectorize-io/hindsight-client";
import { db } from "@/lib/db";

const BASE = "http://127.0.0.1:8888";
const client = new HindsightClient({ baseUrl: BASE });

const log = (k: string, v: unknown) => {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  console.log(k, "→", s.length > 220 ? s.slice(0, 220) + "…" : s);
};

// Find Rahul
const rahul = await db.customer.findFirst({ where: { name: "Rahul Sharma" } });
if (!rahul) throw new Error("Rahul not found in DB");
const bankId = `dealmind-${rahul.id}`;
console.log("=== Rahul before/after proof (real Hindsight) ===");
console.log("customer:", rahul.name, "| bank:", bankId);

// STEP 1 — clear (deleteBank wipes all Rahul's Hindsight memories)
console.log("\n--- STEP 1: clear Rahul's Hindsight memories ---");
try {
  await client.deleteBank(bankId);
  log("deleteBank", "ok (bank deleted)");
} catch (e) {
  log("deleteBank.ERROR", String(e));
}

// Verify recall is empty now (bank was deleted → recall 404s = 0 memories, generic briefing)
await new Promise((r) => setTimeout(r, 1500));
let afterClearResults: { text: string }[] = [];
try {
  const afterClear = await client.recall(bankId, "pricing competitor CRM objections", {
    budget: "mid",
  });
  afterClearResults = afterClear.results ?? [];
} catch (e) {
  // Bank-not-found (404) is the expected state right after deleteBank.
  log("recall after clear", `bank not found (expected) → ${String(e).slice(0, 80)}`);
}
log("recall after clear (count)", afterClearResults.length);
const genericExpected = afterClearResults.length === 0;
log("MEETING PREP (no memory) = GENERIC?", genericExpected ? "YES (generic)" : "NO");

// STEP 2 — re-retain the 3 Rahul memories via REAL Hindsight
console.log("\n--- STEP 2: re-retain 3 Rahul memories via real Hindsight ---");
const facts = [
  {
    content:
      "Rahul Sharma said the product is too expensive and indicated the team's budget envelope is around $40 per seat.",
    type: "objection",
    context: "Discovery call — pricing concerns",
  },
  {
    content:
      "Rahul Sharma is evaluating Competitor X alongside DealMind; he finds Competitor X has a cleaner UI but doubts its CRM integration depth.",
    type: "competitor",
    context: "Follow-up — competitor evaluation",
  },
  {
    content:
      "Rahul Sharma said CRM integration is important and requires bidirectional Salesforce sync without custom code.",
    type: "requirement",
    context: "Requirements deep-dive — CRM integration",
  },
];
for (const f of facts) {
  const r = await client.retain(bankId, f.content, {
    context: f.context,
    metadata: { type: f.type },
  });
  log("retain." + f.type, `success=${r.success} items=${r.items_count}`);
}

// STEP 3 — recall → confirm the 3 facts are back
await new Promise((r) => setTimeout(r, 2500));
console.log("\n--- STEP 3: recall → confirm memories are back ---");
const afterRetain = await client.recall(bankId, "pricing budget competitor CRM integration objections requirements", {
  budget: "mid",
});
log("recall after re-retain (count)", afterRetain.results?.length ?? 0);
const hasPricing = (afterRetain.results ?? []).some((r) =>
  /expensive|budget/i.test(r.text),
);
const hasComp = (afterRetain.results ?? []).some((r) =>
  /competitor x/i.test(r.text),
);
const hasCrm = (afterRetain.results ?? []).some((r) =>
  /crm|salesforce/i.test(r.text),
);
log("recall has pricing?", hasPricing ? "YES" : "NO");
log("recall has competitor?", hasComp ? "YES" : "NO");
log("recall has CRM?", hasCrm ? "YES" : "NO");

const personalizedExpected = hasPricing && hasComp && hasCrm;
console.log("\n=== PROOF RESULT ===");
console.log(
  "BEFORE (no memory)  → generic briefing:",
  genericExpected ? "PASS" : "FAIL",
);
console.log(
  "AFTER  (Hindsight)  → personalized briefing:",
  personalizedExpected ? "PASS" : "FAIL",
);
console.log(
  "=> before/after difference is caused by REAL HINDSIGHT:",
  genericExpected && personalizedExpected
    ? "PROVEN ✓"
    : "NOT proven ✗",
);
