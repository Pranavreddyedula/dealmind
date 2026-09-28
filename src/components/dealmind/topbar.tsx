"use client";

import { useEffect, useState } from "react";
import { Menu, Moon, Sun, RefreshCw, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useDealMind } from "./store";
import { api } from "./api";
import type { AgentStatus } from "./types";
import { ModeBadge } from "./ui-helpers";
import { NAV } from "./sidebar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function Topbar() {
  const { view, setSidebarOpen, setView } = useDealMind();
  const { theme, setTheme } = useTheme();
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    api.agentStatus().then(setStatus).catch(() => {});
    const t = setInterval(() => {
      api.agentStatus().then(setStatus).catch(() => {});
    }, 15000);
    return () => clearInterval(t);
  }, []);

  const active = NAV.find((n) => n.id === view);

  async function reseed() {
    setSeeding(true);
    try {
      const r = await api.seed(true);
      toast.success(
        `Seeded ${r.customers} customers · ${r.totalConversations} conversations · ${r.totalMemories} memories`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Seed failed");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border glass flex items-center gap-3 px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex-1 min-w-0">
        <h1 className="text-base md:text-lg font-semibold tracking-tight truncate">
          {active?.label ?? "Dashboard"}
        </h1>
        <p className="text-[11px] text-muted-foreground truncate hidden sm:block">
          {active?.desc}
        </p>
      </div>
      <div className="hidden lg:flex items-center gap-2">
        {status && (
          <div className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1">
            <span className="text-[11px] text-muted-foreground">Memory</span>
            <span className="text-[11px] text-muted-foreground/60">·</span>
            <ModeBadge mode={status.memory.mode} />
          </div>
        )}
        {status && (
          <div className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1">
            <span className="text-[11px] text-muted-foreground">LLM</span>
            <span className="text-[11px] font-medium text-foreground">
              {status.llm.provider}
            </span>
          </div>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={reseed}
        disabled={seeding}
        className="gap-2"
      >
        <RefreshCw className={cn("h-4 w-4", seeding && "animate-spin")} />
        <span className="hidden sm:inline">Re-seed demo</span>
      </Button>
      <Button
        variant="default"
        size="sm"
        onClick={() => setView("meeting-prep")}
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        <span className="hidden sm:inline">Run demo</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Toggle theme"
      >
        {mounted && theme === "dark" ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </Button>
    </header>
  );
}

export function AgentStatusPill() {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  useEffect(() => {
    api.agentStatus().then(setStatus).catch(() => {});
    const t = setInterval(() => {
      api.agentStatus().then(setStatus).catch(() => {});
    }, 15000);
    return () => clearInterval(t);
  }, []);
  if (!status) return null;
  const connected = status.memory.connected;
  return (
    <div className="rounded-lg border border-sidebar-border bg-card/60 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">
          Memory engine
        </span>
        <ModeBadge mode={status.memory.mode} />
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
        {connected
          ? "Persistent customer memory powered by Hindsight. Facts are retained and recalled on demand."
          : status.memory.message}
      </p>
      {connected && status.memory.apiVersion && (
        <p className="mt-1 text-[10px] text-muted-foreground/70">
          Hindsight API v{status.memory.apiVersion}
        </p>
      )}
    </div>
  );
}
