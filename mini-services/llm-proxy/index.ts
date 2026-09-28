/**
 * DealMind — OpenAI → z-ai wire-format proxy (mini-service).
 *
 * The local Hindsight daemon needs an LLM provider. We route it through the
 * z-ai endpoint (https://internal-api.z.ai/v1) so the WHOLE product runs on
 * the in-sandbox z-ai credentials — no new external API key required.
 *
 * z-ai's endpoint is OpenAI-shaped but requires custom headers
 * (X-Token / X-Chat-Id / X-User-Id) that the Hindsight openai-provider won't
 * send. This proxy receives a vanilla OpenAI-format request from the daemon,
 * injects the z-ai headers, forwards to z-ai, and streams the OpenAI-format
 * response back. It is a pure wire-format adapter — no model logic, no faking.
 *
 * Reads credentials from /etc/.z-ai-config (the same place z-ai-web-dev-sdk
 * looks). Port 3030 (fixed, per mini-service rules).
 */
import { readFileSync } from "node:fs";

const PORT = 3030;

type ZaiConfig = {
  baseUrl: string;
  apiKey?: string;
  token?: string;
  chatId?: string;
  userId?: string;
};

function loadZaiConfig(): ZaiConfig {
  const candidates = [
    "/etc/.z-ai-config",
    process.env.HOME + "/.z-ai-config",
    "./.z-ai-config",
  ];
  for (const p of candidates) {
    try {
      const raw = readFileSync(p, "utf8");
      const cfg = JSON.parse(raw);
      if (cfg.baseUrl && (cfg.token || cfg.apiKey)) return cfg;
    } catch {
      /* try next */
    }
  }
  throw new Error(
    "z-ai config not found. Expected /etc/.z-ai-config with baseUrl + token.",
  );
}

const ZAI = loadZaiConfig();
console.log(`[llm-proxy] z-ai baseUrl: ${ZAI.baseUrl}`);

function buildHeaders() {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    // z-ai's gateway requires this SDK-identification header (the z-ai-web-dev-sdk
    // sends it on every call). Without it the endpoint returns 403.
    "X-Z-AI-From": "Z",
  };
  if (ZAI.apiKey) h["Authorization"] = `Bearer ${ZAI.apiKey}`;
  if (ZAI.chatId) h["X-Chat-Id"] = ZAI.chatId;
  if (ZAI.userId) h["X-User-Id"] = ZAI.userId;
  if (ZAI.token) h["X-Token"] = ZAI.token;
  return h;
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    // Health
    if (url.pathname === "/health" || req.method === "GET") {
      return new Response(JSON.stringify({ ok: true, service: "dealmind-llm-proxy" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // OpenAI: POST /v1/chat/completions
    if (req.method === "POST" && url.pathname.endsWith("/chat/completions")) {
      try {
        const body = await req.text();
        // Rewrite the model to a z-ai model if the caller sent a generic one.
        let payload: Record<string, unknown> = {};
        try {
          payload = JSON.parse(body);
        } catch {
          payload = {};
        }
        const model = process.env.ZAI_MODEL || "glm-4.6";
        if (!payload.model || String(payload.model).startsWith("gpt")) {
          payload.model = model;
        }
        // z-ai SDK disables "thinking" by default; ensure it's set so simple
        // chat works without the reasoning channel.
        if (!("thinking" in payload)) {
          payload.thinking = { type: "disabled" };
        }

        const upstream = await fetch(`${ZAI.baseUrl}/chat/completions`, {
          method: "POST",
          headers: buildHeaders(),
          body: JSON.stringify(payload),
        });

        const text = await upstream.text();
        return new Response(text, {
          status: upstream.status,
          headers: { "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(
          JSON.stringify({ error: "proxy-failure", message: String(e) }),
          { status: 502, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    // Fallback for any other OpenAI-ish endpoint (e.g. /v1/models)
    return new Response(JSON.stringify({ error: "not-implemented", path: url.pathname }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  },
});

console.log(`[llm-proxy] listening on http://127.0.0.1:${PORT} (OpenAI → z-ai)`);
