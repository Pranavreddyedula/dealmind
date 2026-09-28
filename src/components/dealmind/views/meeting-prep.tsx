"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Brain,
  BrainCircuit,
  Loader2,
  ChevronRight,
  Lightbulb,
  XCircle,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { api } from "../api";
import type { Customer, MeetingPrepResult } from "../types";
import { useDealMind } from "../store";
import { Avatar, ModeBadge, MemoryTypeBadge, memoryTypeColor } from "../ui-helpers";
import { Markdown } from "../markdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function MeetingPrepView() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [query, setQuery] = useState<string>(
    "Prepare me for my next meeting with Rahul.",
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MeetingPrepResult | null>(null);
  const { setSelectedCustomer } = useDealMind();

  useEffect(() => {
    api.customers.list().then((r) => {
      setCustomers(r.customers);
      const rahul = r.customers.find((c) => c.name === "Rahul Sharma");
      if (rahul) {
        setCustomerId(rahul.id);
        setQuery("Prepare me for my next meeting with Rahul.");
      } else if (r.customers[0]) {
        setCustomerId(r.customers[0].id);
        setQuery(
          `Prepare me for my next meeting with ${r.customers[0].name.split(" ")[0]}.`,
        );
      }
    });
  }, []);

  const selected = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId],
  );

  async function run() {
    if (!customerId) {
      toast.error("Pick a customer first");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const r = await api.meetingPrep({ customerId, query });
      setResult(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Intro banner */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="relative overflow-hidden p-5 md:p-6 border-primary/25">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-transparent to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-[12px] font-semibold uppercase tracking-wider text-primary">
                See the difference memory makes
              </span>
            </div>
            <h2 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">
              The same request, run twice — once blind, once with Hindsight.
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-3xl">
              DealMind generates <strong>two</strong> meeting briefings for the
              same customer: the left one is produced with{" "}
              <span className="text-foreground font-medium">no memory</span>{" "}
              (what a vanilla CRM + LLM gives you), the right one is grounded in{" "}
              <span className="text-foreground font-medium">
                memories recalled live from Hindsight
              </span>
              . No hardcoding — the right pane cites exactly what was stored.
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Control panel */}
      <Card className="p-4 md:p-5">
        <div className="grid md:grid-cols-[1fr_2fr_auto] gap-3 items-end">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Customer
            </label>
            <Select
              value={customerId}
              onValueChange={(v) => {
                setCustomerId(v);
                const c = customers.find((x) => x.id === v);
                if (c)
                  setQuery(
                    `Prepare me for my next meeting with ${c.name.split(" ")[0]}.`,
                  );
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} · {c.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Request to the agent
            </label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Prepare me for my next meeting with…"
            />
          </div>
          <Button
            size="lg"
            onClick={run}
            disabled={loading || !customerId}
            className="gap-2 h-[42px]"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Generate both
          </Button>
        </div>
        {selected && (
          <div className="mt-3 flex items-center gap-3 text-[12px] text-muted-foreground">
            <Avatar name={selected.name} hue={selected.avatarHue} size={22} />
            <span>
              {selected.name} · {selected.title} @ {selected.company} ·{" "}
              {selected.industry}
            </span>
          </div>
        )}
      </Card>

      {/* Result: side by side */}
      {loading && (
        <div className="grid lg:grid-cols-2 gap-4">
          <BriefingSkeleton tone="without" />
          <BriefingSkeleton tone="with" />
        </div>
      )}

      {!loading && result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
            <span>Memory engine used for the right pane:</span>
            <ModeBadge mode={result.mode} />
            <span className="text-muted-foreground/60">·</span>
            <span>
              <strong className="text-foreground">
                {result.withMemory.memoriesUsed.length}
              </strong>{" "}
              memories recalled
            </span>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <BriefingCard tone="without" result={result} />
            <BriefingCard tone="with" result={result} />
          </div>
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCustomer(customerId);
                useDealMind.getState().setView("memory");
              }}
              className="gap-2"
            >
              Inspect this customer's memory
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {!loading && !result && (
        <Card className="p-8 md:p-12 text-center border-dashed">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-semibold">
            Run the demo to see both briefings side by side.
          </h3>
          <p className="mt-1 text-[13px] text-muted-foreground max-w-md mx-auto">
            We'll generate one generic briefing (no memory) and one grounded in
            this customer's recalled Hindsight memories. The difference is the
            whole point of DealMind.
          </p>
        </Card>
      )}
    </div>
  );
}

function BriefingSkeleton({ tone }: { tone: "without" | "with" }) {
  return (
    <Card
      className={cn(
        "p-5",
        tone === "without"
          ? "border-amber-500/30 bg-amber-500/[0.03]"
          : "border-emerald-500/40 bg-emerald-500/[0.04]",
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </Card>
  );
}

function BriefingCard({
  tone,
  result,
}: {
  tone: "without" | "with";
  result: MeetingPrepResult;
}) {
  const side = tone === "without" ? result.withoutMemory : result.withMemory;
  const isWith = tone === "with";
  return (
    <Card
      className={cn(
        "p-5 relative overflow-hidden",
        isWith
          ? "border-emerald-500/40 bg-emerald-500/[0.04] shadow-lg shadow-emerald-500/5"
          : "border-amber-500/30 bg-amber-500/[0.03]",
      )}
    >
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1",
          isWith
            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
            : "bg-gradient-to-r from-amber-500 to-orange-500",
        )}
      />
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isWith ? (
            <Brain className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <BrainCircuit className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          )}
          <div>
            <div className="text-sm font-semibold">
              {isWith ? "With Hindsight memory" : "Without memory"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {isWith
                ? `Grounded in ${side.memoriesUsed.length} recalled memories`
                : "Profile only — no recollection"}
            </div>
          </div>
        </div>
        {isWith ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            Personalized
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
            <XCircle className="h-3 w-3" />
            Generic
          </span>
        )}
      </div>

      {isWith && side.memoriesUsed.length > 0 && (
        <div className="mb-3 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300 mb-1.5">
            <Lightbulb className="h-3.5 w-3.5" />
            Recalled from Hindsight
            <span className="ml-auto inline-flex items-center rounded bg-emerald-200/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
              Source: Hindsight
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {side.memoriesUsed.map((m) => (
              <span
                key={m.id}
                className={cn(
                  "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium",
                  memoryTypeColor(m.type),
                )}
                title={m.text}
              >
                {m.type ?? "memory"}
              </span>
            ))}
          </div>
          <ul className="mt-2 space-y-1">
            {side.memoriesUsed.slice(0, 4).map((m) => (
              <li
                key={m.id}
                className="text-[11px] text-muted-foreground leading-relaxed"
              >
                <span className="text-foreground/80">•</span> {m.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="max-h-[480px] overflow-y-auto scroll-thin pr-1">
        <Markdown>{side.briefing}</Markdown>
      </div>

      <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>LLM: {side.provider}</span>
        <span>{side.latencyMs}ms</span>
      </div>
    </Card>
  );
}
