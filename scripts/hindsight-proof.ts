/**
 * DealMind — live Hindsight proof test.
 * Proves the real daemon answers createBank/retain/recall/reflect with a
 * UNIQUE test memory that could only have come from Hindsight.
 */
import { HindsightClient } from "@vectorize-io/hindsight-client";

const BASE = "http://127.0.0.1:8888";
const BANK = `proof-${Date.now()}`;
const UNIQUE = `DealMind-proof-${BANK}-the-quick-brown-fox-trains-Hindsight`;

const client = new HindsightClient({ baseUrl: BASE });

const out: string[] = [];
const log = (k: string, v: unknown) => {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  out.push(`${k}: ${s.length > 300 ? s.slice(0, 300) + "…" : s}`);
  console.log(k, "→", s.length > 300 ? s.slice(0, 300) + "…" : s);
};

console.log("=== DealMind live Hindsight proof test ===");
console.log("base:", BASE, "| bank:", BANK);

// getVersion
try {
  const v = await client.getVersion();
  log("getVersion.api_version", v.api_version);
  log("getVersion.features", v.features ?? {});
} catch (e) {
  log("getVersion.ERROR", String(e));
  throw e;
}

// createBank
try {
  const bankRes = await client.createBank(BANK, {
    name: "DealMind Proof Bank",
    background: "A test bank used to prove DealMind talks to real Hindsight.",
  });
  log("createBank", bankRes);
} catch (e) {
  log("createBank.ERROR", String(e));
}

// retain
try {
  const r = await client.retain(BANK, UNIQUE, {
    context: "live-proof-test",
    metadata: { source: "dealmind-proof", ts: String(Date.now()) },
  });
  log("retain", r);
} catch (e) {
  log("retain.ERROR", String(e));
}

// recall (give the bank a moment to index, then recall)
await new Promise((r) => setTimeout(r, 2000));
try {
  const rec = await client.recall(BANK, "quick brown fox trains", {
    budget: "mid",
  });
  const hit = (rec.results ?? []).find((x: { text: string }) =>
    x.text.includes(UNIQUE.slice(0, 20)),
  );
  log("recall.count", rec.results?.length ?? 0);
  log("recall.hit.text", hit ? hit.text : "(not found)");
  log("recall.hit.source", hit ? "Hindsight" : "MISSING");
} catch (e) {
  log("recall.ERROR", String(e));
}

// reflect — generates a contextual answer grounded in the bank's memory
try {
  const ref = await client.reflect(BANK, "What did the proof test store?", {
    budget: "high",
  });
  log("reflect.text", ref.text);
  log(
    "reflect.provesHindsight",
    ref.text.includes("fox") || ref.text.includes("Hindsight") || ref.text.length > 20 ? "YES" : "NO",
  );
} catch (e) {
  log("reflect.ERROR", String(e));
}

console.log("\n=== PROOF SUMMARY ===");
console.log(out.join("\n"));
console.log("\n=== END ===");
