"use client";

import { useEffect, useState } from "react";
import {
  Brain,
  Cpu,
  Server,
  KeyRound,
  ShieldCheck,
  ExternalLink,
  Info,
} from "lucide-react";
import { api } from "../api";
import type { AgentStatus } from "../types";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ModeBadge } from "../ui-helpers";
import { cn } from "@/lib/utils";

export function SettingsView() {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [env, setEnv] = useState<Record<string, string | boolean>>({});
  useEffect(() => {
    api.agentStatus().then(setStatus).catch(() => {});
    api.settings
      .get()
      .then((r) => {
        setSettings(r.settings);
        setEnv(r.env);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4 max-w-3xl">
      <Card className="p-4 md:p-5">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Memory engine (Hindsight)</h3>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">
          DealMind talks to the real{" "}
          <code className="text-[11px]">@vectorize-io/hindsight-client</code>{" "}
          SDK. Configure one of the tiers below to switch from the local
          fallback to real Hindsight.
        </p>
        {!status ? (
          <Skeleton className="h-20" />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-muted-foreground">Active mode</span>
              <ModeBadge mode={status.memory.mode} />
              {status.memory.apiVersion && (
                <span className="text-[11px] text-muted-foreground">
                  · API v{status.memory.apiVersion}
                </span>
              )}
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-[12px] text-muted-foreground">
              {status.memory.message}
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              <Tier
                title="Tier A · Remote"
                active={status.memory.mode === "hindsight-remote"}
                desc="Set HINDSIGHT_BASE_URL (and optional HINDSIGHT_API_KEY) in .env to use a managed/remote Hindsight API."
                envLine="HINDSIGHT_BASE_URL=https://…"
              />
              <Tier
                title="Tier B · Local daemon"
                active={status.memory.mode === "hindsight-local"}
                desc="Set HINDSIGHT_EMBED_LOCAL=true + HINDSIGHT_API_LLM_PROVIDER/KEY/MODEL. Requires uvx (present here)."
                envLine="HINDSIGHT_EMBED_LOCAL=true"
              />
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.06] p-3 text-[12px] text-muted-foreground">
              <strong className="text-amber-700 dark:text-amber-300">
                Tier C (current)
              </strong>{" "}
              — local Prisma-backed memory store implementing the same{" "}
              <code>retain / recall / reflect</code> interface. Flip one env var
              to enable real Hindsight with zero code changes.
            </div>
          </div>
        )}
      </Card>

      <Card className="p-4 md:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">LLM provider (sales agent)</h3>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">
          Resolution order:{" "}
          <code className="text-[11px]">GROQ_API_KEY</code> →{" "}
          <code className="text-[11px]">OPENAI_API_KEY</code> →{" "}
          <code className="text-[11px]">ANTHROPIC_API_KEY</code> →{" "}
          <code className="text-[11px]">z-ai-web-dev-sdk</code> (default).
        </p>
        <div className="grid sm:grid-cols-2 gap-2">
          <EnvRow label="GROQ_API_KEY" set={env.groqApiKey === "set"} />
          <EnvRow label="OPENAI_API_KEY" set={env.openaiApiKey === "set"} />
          <EnvRow label="ANTHROPIC_API_KEY" set={env.anthropicApiKey === "set"} />
          <EnvRow label="HINDSIGHT_BASE_URL" set={env.hindsightBaseUrl === "set"} />
          <EnvRow
            label="HINDSIGHT_EMBED_LOCAL"
            set={env.hindsightEmbedLocal === true}
          />
        </div>
        {status && (
          <div className="mt-3 text-[12px] text-muted-foreground">
            Active provider:{" "}
            <span className="font-medium text-foreground">
              {status.llm.provider}
            </span>
          </div>
        )}
      </Card>

      <Card className="p-4 md:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Server className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Runtime</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-2 text-[12px]">
          <Row label="Framework" value="Next.js 16 · App Router" />
          <Row label="Language" value="TypeScript 5" />
          <Row label="Styling" value="Tailwind CSS 4 · shadcn/ui" />
          <Row label="Database" value="Prisma 6 · SQLite" />
          <Row label="Memory SDK" value="@vectorize-io/hindsight-client 0.10.1" />
          <Row label="LLM SDK" value="z-ai-web-dev-sdk (default)" />
        </div>
      </Card>

      <Card className="p-4 md:p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Security posture</h3>
        </div>
        <ul className="space-y-1.5 text-[12px] text-muted-foreground">
          <li className="flex items-start gap-2">
            <KeyRound className="h-3.5 w-3.5 mt-0.5 text-emerald-500" />
            All API keys live in environment variables — never in code.
          </li>
          <li className="flex items-start gap-2">
            <KeyRound className="h-3.5 w-3.5 mt-0.5 text-emerald-500" />
            <span>
              <code>.env.example</code> documents every variable; secrets are
              git-ignored.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <KeyRound className="h-3.5 w-3.5 mt-0.5 text-emerald-500" />
            The Hindsight client never receives your LLM provider keys — only
            the Hindsight daemon (Tier B) does, in its own process env.
          </li>
        </ul>
      </Card>

      <Card className="p-4 md:p-5">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Reference links</h3>
        </div>
        <div className="flex flex-col gap-1.5 text-[12px]">
          <a
            className="inline-flex items-center gap-1.5 text-primary hover:underline"
            href="https://www.npmjs.com/package/@vectorize-io/hindsight-client"
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="h-3 w-3" />
            @vectorize-io/hindsight-client
          </a>
          <a
            className="inline-flex items-center gap-1.5 text-primary hover:underline"
            href="https://www.npmjs.com/package/@vectorize-io/hindsight-all"
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="h-3 w-3" />
            @vectorize-io/hindsight-all (local daemon)
          </a>
          <a
            className="inline-flex items-center gap-1.5 text-primary hover:underline"
            href="https://github.com/vectorize-io/hindsight"
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="h-3 w-3" />
            github.com/vectorize-io/hindsight
          </a>
        </div>
      </Card>
    </div>
  );
}

function Tier({
  title,
  active,
  desc,
  envLine,
}: {
  title: string;
  active: boolean;
  desc: string;
  envLine: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        active
          ? "border-emerald-500/40 bg-emerald-500/[0.06]"
          : "border-border bg-card/40",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold">{title}</span>
        {active && (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
            active
          </span>
        )}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
        {desc}
      </p>
      <code className="mt-1.5 block text-[10px] text-foreground/70">{envLine}</code>
    </div>
  );
}

function EnvRow({ label, set }: { label: string; set: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
      <code className="text-[11px]">{label}</code>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-medium",
          set
            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            : "bg-muted text-muted-foreground",
        )}
      >
        {set ? "set" : "unset"}
      </span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-[11px]">{value}</span>
    </div>
  );
}
