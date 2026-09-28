/**
 * DealMind — LLM service for the sales agent.
 *
 * Provider resolution (first match wins):
 *   1. GROQ_API_KEY  -> Groq (OpenAI-compatible) — preferred per project spec
 *   2. OPENAI_API_KEY -> OpenAI (OpenAI-compatible)
 *   3. ANTHROPIC_API_KEY -> Anthropic (messages API)
 *   4. default       -> z-ai-web-dev-sdk (works in-sandbox with /etc/.z-ai-config)
 *
 * All keys come from environment variables — never hardcoded.
 */
import ZAI from "z-ai-web-dev-sdk";

export type LlmProvider = "groq" | "openai" | "anthropic" | "zai";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmCallOptions {
  temperature?: number;
  maxTokens?: number;
  /** override the resolved provider for this single call */
  forceProvider?: LlmProvider;
}

export interface LlmResult {
  text: string;
  provider: LlmProvider;
  model: string;
  latencyMs: number;
}

function resolveProvider(force?: LlmProvider): LlmProvider {
  if (force) return force;
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "zai";
}

export function getConfiguredProvider(): LlmProvider {
  return resolveProvider();
}

export function getProviderModel(provider: LlmProvider): string {
  switch (provider) {
    case "groq":
      return process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    case "openai":
      return process.env.OPENAI_MODEL || "gpt-4o-mini";
    case "anthropic":
      return process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
    case "zai":
      return process.env.ZAI_MODEL || "glm-4.6";
  }
}

async function callOpenAICompatible(
  provider: "groq" | "openai",
  messages: ChatMessage[],
  opts: LlmCallOptions,
): Promise<string> {
  const apiKey =
    provider === "groq" ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY;
  const baseUrl =
    provider === "groq"
      ? process.env.GROQ_BASE_URL || "https://api.groq.com/openai"
      : process.env.OPENAI_BASE_URL || "https://api.openai.com";
  const model = getProviderModel(provider);
  const url = `${baseUrl}/v1/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: messages as unknown as Record<string, unknown>[],
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 1200,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${provider} API error ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(
  messages: ChatMessage[],
  opts: LlmCallOptions,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY!;
  const model = getProviderModel("anthropic");
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const userAssistant = messages.filter((m) => m.role !== "system");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system,
      max_tokens: opts.maxTokens ?? 1200,
      temperature: opts.temperature ?? 0.4,
      messages: userAssistant as unknown as Record<string, unknown>[],
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`anthropic API error ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = (await res.json()) as { content?: { text?: string }[] };
  return data.content?.[0]?.text ?? "";
}

async function callZai(
  messages: ChatMessage[],
  opts: LlmCallOptions,
): Promise<string> {
  const zai = await ZAI.create();
  const completion = await zai.chat.completions.create({
    messages: messages as unknown as Record<string, unknown>[],
    thinking: { type: "disabled" },
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens ?? 1200,
  } as Record<string, unknown>);
  return (completion as { choices?: { message?: { content?: string } }[] })
    .choices?.[0]?.message?.content ?? "";
}

export async function generateText(
  messages: ChatMessage[],
  opts: LlmCallOptions = {},
): Promise<LlmResult> {
  const provider = resolveProvider(opts.forceProvider);
  const model = getProviderModel(provider);
  const started = Date.now();
  let text = "";
  let lastErr: unknown;
  // Try the resolved provider; if it fails and it wasn't zai, fall back to zai
  // so the app keeps working (the demo must never hard-crash on LLM outage).
  const attempts: LlmProvider[] = [provider];
  if (provider !== "zai") attempts.push("zai");
  for (const p of attempts) {
    try {
      if (p === "groq" || p === "openai") {
        text = await callOpenAICompatible(p, messages, opts);
      } else if (p === "anthropic") {
        text = await callAnthropic(messages, opts);
      } else {
        text = await callZai(messages, opts);
      }
      if (text) {
        return { text, provider: p, model, latencyMs: Date.now() - started };
      }
      lastErr = new Error(`${p} returned empty content`);
    } catch (e) {
      lastErr = e;
      // try next provider
    }
  }
  throw new Error(
    `All LLM providers failed. Last error: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`,
  );
}
