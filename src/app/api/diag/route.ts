import { NextResponse } from "next/server";
import { execSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import os from "node:os";

export const dynamic = "force-dynamic";

/** GET /api/diag — non-secret runtime diagnostics for the PUBLISHED deployment.
 *  Reports what the published container actually has so we can determine why
 *  Hindsight isn't reachable. Prints NO secret values — only set/unset + paths. */
export async function GET() {
  const diag = {
    timestamp: new Date().toISOString(),
    hostname: os.hostname(),
    platform: `${os.type()} ${os.release()} ${os.arch()}`,
    node: process.version,
    cwd: process.cwd(),
    env: {
      NODE_ENV: process.env.NODE_ENV ?? null,
      PORT: process.env.PORT ?? null,
      DATABASE_URL_set: !!process.env.DATABASE_URL,
      HINDSIGHT_BASE_URL: process.env.HINDSIGHT_BASE_URL ?? null,
      HINDSIGHT_EMBED_LOCAL: process.env.HINDSIGHT_EMBED_LOCAL ?? null,
      HINDSIGHT_PORT: process.env.HINDSIGHT_PORT ?? null,
      HINDSIGHT_API_KEY_set: !!process.env.HINDSIGHT_API_KEY,
      GROQ_API_KEY_set: !!process.env.GROQ_API_KEY,
      OPENAI_API_KEY_set: !!process.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY_set: !!process.env.ANTHROPIC_API_KEY,
    },
    binaries: {
      bun: which("bun"),
      node: which("node"),
      uvx: which("uvx"),
      uv: which("uv"),
      caddy: which("caddy"),
      python3: which("python3"),
    },
    files: {
      "/etc/.z-ai-config": exists("/etc/.z-ai-config"),
      "/app/db/custom.db": exists("/app/db/custom.db"),
      "/app/next-service-dist/server.js": exists("/app/next-service-dist/server.js"),
      "/app/mini-services-dist/mini-service-hindsight-daemon.js": exists(
        "/app/mini-services-dist/mini-service-hindsight-daemon.js",
      ),
      "/app/mini-services-dist/mini-service-llm-proxy.js": exists(
        "/app/mini-services-dist/mini-service-llm-proxy.js",
      ),
      "./mini-services-dist": exists("./mini-services-dist"),
      "./mini-services/hindsight-daemon/start.sh": exists(
        "./mini-services/hindsight-daemon/start.sh",
      ),
    },
    network: {
      "127.0.0.1:8888/version": await probe("http://127.0.0.1:8888/version"),
      "127.0.0.1:3030/health": await probe("http://127.0.0.1:3030/health"),
      "127.0.0.1:3000/api/agent/status": await probe(
        "http://127.0.0.1:3000/api/agent/status",
      ),
    },
    memory: {
      total: `${(os.totalmem() / 1024 / 1024).toFixed(0)} MB`,
      free: `${(os.freemem() / 1024 / 1024).toFixed(0)} MB`,
    },
  };
  return NextResponse.json(diag, { status: 200 });
}

function which(bin: string): string | null {
  try {
    const p = execSync(`which ${bin} 2>/dev/null`, { encoding: "utf8" }).trim();
    return p || null;
  } catch {
    return null;
  }
}

function exists(p: string): { exists: boolean; size?: number } {
  try {
    const s = statSync(p);
    return { exists: true, size: s.size };
  } catch {
    return { exists: false };
  }
}

async function probe(url: string): Promise<{ ok: boolean; status?: number; body?: string; error?: string }> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    const body = (await res.text()).slice(0, 120);
    return { ok: res.ok, status: res.status, body };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 120) : String(e) };
  }
}
