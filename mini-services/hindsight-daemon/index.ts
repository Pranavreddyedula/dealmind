/**
 * DealMind — REAL local Hindsight daemon (mini-service).
 *
 * Uses @vectorize-io/hindsight-all's HindsightServer to embed a real local
 * Hindsight daemon (the official Node lifecycle wrapper around the
 * hindsight-embed Python package, run via uvx — present in this environment).
 *
 * The daemon needs an LLM provider for memory consolidation + reflect. We
 * route it through the DealMind llm-proxy (port 3030) → z-ai endpoint, so the
 * WHOLE product runs on the in-sandbox z-ai credentials (no new external key).
 *
 * Once running, the main Next.js app talks to this daemon at
 * http://127.0.0.1:8888 using @vectorize-io/hindsight-client — real
 * createBank / retain / recall / reflect / getVersion.
 *
 * Port 8888 (fixed, per HindsightServer default + matches the app's
 * HINDSIGHT_EMBED_LOCAL probe URL).
 */
import { HindsightServer, consoleLogger } from "@vectorize-io/hindsight-all";

const PROXY_BASE = process.env.LLM_PROXY_BASE_URL || "http://127.0.0.1:3030/v1";
const ZAI_MODEL = process.env.ZAI_MODEL || "glm-4.6";

const server = new HindsightServer({
  profile: "dealmind",
  port: 8888,
  host: "127.0.0.1",
  env: {
    // Route the daemon's LLM through the llm-proxy → z-ai.
    HINDSIGHT_API_LLM_PROVIDER: "openai",
    HINDSIGHT_API_LLM_API_KEY: "dealmind-proxy", // ignored by the proxy
    HINDSIGHT_API_LLM_MODEL: ZAI_MODEL,
    HINDSIGHT_API_LLM_BASE_URL: PROXY_BASE,
    // Embeddings: local (Hindsight ships a local embedding model).
    // No external embedding key needed.
  },
  logger: consoleLogger,
});

console.log("[hindsight-daemon] starting HindsightServer on port 8888…");
console.log(
  `[hindsight-daemon] LLM routed via proxy ${PROXY_BASE} → z-ai (${ZAI_MODEL})`,
);

try {
  await server.start();
  console.log(
    `[hindsight-daemon] ✓ ready at ${server.getBaseUrl()} (profile "${server.getProfile()}")`,
  );
} catch (e) {
  console.error("[hindsight-daemon] failed to start:", e);
  process.exit(1);
}

// Keep the process alive + surface health.
setInterval(() => {
  server
    .checkHealth()
    .then((ok) => {
      if (!ok) console.warn("[hindsight-daemon] health check returned false");
    })
    .catch(() => {});
}, 30000);

process.on("SIGTERM", async () => {
  console.log("[hindsight-daemon] SIGTERM, stopping…");
  await server.stop();
  process.exit(0);
});
process.on("SIGINT", async () => {
  console.log("[hindsight-daemon] SIGINT, stopping…");
  await server.stop();
  process.exit(0);
});
