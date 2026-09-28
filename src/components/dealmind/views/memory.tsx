"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Send,
  Search,
  Clock,
  MessageCircleQuestion,
  Sparkles,
  Loader2,
} from "lucide-react";
import { api } from "../api";
import type { Customer, MemoryItem, RecallResultItem, MemoryMode } from "../types";
import { useDealMind } from "../store";
import { Avatar, ModeBadge, memoryTypeColor, timeAgo } from "../ui-helpers";
import { Markdown } from "../markdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function MemoryView() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tab, setTab] = useState("timeline");
  const { selectedCustomerId, setSelectedCustomer } = useDealMind();

  useEffect(() => {
    api.customers.list().then((r) => {
      setCustomers(r.customers);
      if (!selectedCustomerId) {
        const rahul = r.customers.find((c) => c.name === "Rahul Sharma");
        setSelectedCustomer(rahul ? rahul.id : r.customers[0]?.id ?? null);
      }
    });
  }, [selectedCustomerId]);

  return (
    <div className="space-y-4">
      <Card className="p-4 md:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              Memory center
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Browse the persistent memory timeline or ask the agent a question
              grounded in a customer's retained facts.
            </p>
          </div>
          {customers.length > 0 && (
            <Select
              value={selectedCustomerId ?? ""}
              onValueChange={(v) => setSelectedCustomer(v)}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="All customers" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="timeline" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Timeline
          </TabsTrigger>
          <TabsTrigger value="qa" className="gap-1.5">
            <MessageCircleQuestion className="h-3.5 w-3.5" /> Memory Q&A
          </TabsTrigger>
          <TabsTrigger value="recall" className="gap-1.5">
            <Search className="h-3.5 w-3.5" /> Raw recall
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <TimelineTab customerId={selectedCustomerId ?? undefined} />
        </TabsContent>
        <TabsContent value="qa">
          <QATab customerId={selectedCustomerId ?? ""} />
        </TabsContent>
        <TabsContent value="recall">
          <RecallTab customerId={selectedCustomerId ?? ""} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TimelineTab({ customerId }: { customerId?: string }) {
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    api.memory
      .timeline(customerId)
      .then((r) => setItems(r.items))
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading)
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  if (items.length === 0)
    return (
      <Card className="p-10 text-center border-dashed">
        <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          No memories retained yet.
        </p>
      </Card>
    );

  return (
    <div className="relative pl-4">
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
      <div className="space-y-3">
        {items.map((m, i) => {
          const hue = m.customer ? hashHue(m.customer.name) : 200;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className="relative"
            >
              <div className="absolute -left-[13px] top-3 h-3 w-3 rounded-full border-2 border-background bg-primary" />
              <Card className="p-3 hover:shadow-sm transition">
                <div className="flex items-start gap-3">
                  {m.customer && (
                    <Avatar
                      name={m.customer.name}
                      hue={hue}
                      size={30}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide",
                          memoryTypeColor(m.type),
                        )}
                      >
                        {m.type ?? "memory"}
                      </span>
                      {m.customer && (
                        <span className="text-[12px] font-medium">
                          {m.customer.name}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {timeAgo(m.mentionedAt)}
                      </span>
                      {m.context && (
                        <span className="text-[10px] text-muted-foreground/70">
                          · {m.context}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[12px] text-foreground/90">
                      {m.content}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function QATab({ customerId }: { customerId: string }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [memories, setMemories] = useState<RecallResultItem[]>([]);
  const [mode, setMode] = useState<MemoryMode | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const examples = [
    "What are Rahul's main objections?",
    "Which competitor is he evaluating?",
    "What integration does he require?",
    "Summarize what we know about this account.",
  ];

  async function ask(q?: string) {
    const query = (q ?? question).trim();
    if (!query) return;
    if (!customerId) {
      toast.error("Pick a customer");
      return;
    }
    setLoading(true);
    setAnswer(null);
    try {
      const r = await api.memory.qa({ customerId, question: query });
      setAnswer(r.answer);
      setMemories(r.memories);
      setMode(r.mode);
      setProvider(r.provider);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-4 md:p-5 space-y-4">
      <div>
        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          Ask about this customer's memory
        </label>
        <div className="mt-1.5 flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") ask();
            }}
            placeholder="e.g. What are Rahul's main objections?"
          />
          <Button onClick={() => ask()} disabled={loading} className="gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Ask
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {examples.map((e) => (
            <button
              key={e}
              onClick={() => {
                setQuestion(e);
                ask(e);
              }}
              className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted/60 hover:text-foreground transition"
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-20" />
        </div>
      )}

      {!loading && answer && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Agent answer</span>
            {mode && <ModeBadge mode={mode} />}
            {provider && <span>· LLM: {provider}</span>}
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-3">
            <Markdown>{answer}</Markdown>
          </div>
          {memories.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                Grounded in {memories.length} recalled memories
              </div>
              <div className="space-y-1.5">
                {memories.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-start gap-2 rounded-md border border-border/60 bg-card/40 p-2"
                  >
                    <span
                      className={cn(
                        "mt-0.5 inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide shrink-0",
                        memoryTypeColor(m.type),
                      )}
                    >
                      {m.type ?? "memory"}
                    </span>
                    <span className="text-[12px]">{m.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {!loading && !answer && (
        <div className="text-center py-6 text-[12px] text-muted-foreground">
          Ask a question — the agent will recall relevant memories from
          Hindsight and answer grounded in them.
        </div>
      )}
    </Card>
  );
}

function RecallTab({ customerId }: { customerId: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RecallResultItem[]>([]);
  const [mode, setMode] = useState<MemoryMode | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function run(q?: string) {
    const queryStr = (q ?? query).trim();
    if (!queryStr) return;
    if (!customerId) {
      toast.error("Pick a customer");
      return;
    }
    setLoading(true);
    setResults([]);
    setSearched(true);
    try {
      const r = await api.memory.recall({
        customerId,
        query: queryStr,
        budget: "mid",
      });
      setResults(r.results);
      setMode(r.mode);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const examples = [
    "pricing budget competitor",
    "integration requirements",
    "objections concerns",
  ];

  return (
    <Card className="p-4 md:p-5 space-y-3">
      <div>
        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          Recall query (semantic + keyword)
        </label>
        <div className="mt-1.5 flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run();
            }}
            placeholder="e.g. pricing budget competitor"
          />
          <Button onClick={() => run()} disabled={loading} className="gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Recall
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {examples.map((e) => (
            <button
              key={e}
              onClick={() => {
                setQuery(e);
                run(e);
              }}
              className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted/60 hover:text-foreground transition"
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {mode && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>Recalled via</span>
          <ModeBadge mode={mode} />
          <span>· {results.length} results</span>
        </div>
      )}

      {searched && results.length === 0 && !loading && (
        <p className="text-center text-[12px] text-muted-foreground py-4">
          No memories matched this query.
        </p>
      )}

      <div className="space-y-1.5">
        {results.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-start gap-2 rounded-md border border-border/60 bg-card/40 p-2.5"
          >
            <span className="mt-0.5 text-[10px] font-bold text-muted-foreground w-5 shrink-0">
              #{i + 1}
            </span>
            <span
              className={cn(
                "mt-0.5 inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide shrink-0",
                memoryTypeColor(r.type),
              )}
            >
              {r.type ?? "memory"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[12px]">{r.text}</p>
              <div className="mt-0.5 text-[10px] text-muted-foreground">
                {r.context} · {r.mentionedAt ? timeAgo(r.mentionedAt) : ""}
                {r.score != null && ` · score ${r.score.toFixed(2)}`}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}
