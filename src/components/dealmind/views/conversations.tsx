"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessagesSquare,
  Plus,
  Brain,
  Save,
  ChevronDown,
  ChevronRight,
  Trash2,
  X,
  User,
  Phone,
  Video,
  Mail,
} from "lucide-react";
import { api } from "../api";
import type { Conversation, Customer } from "../types";
import { useDealMind } from "../store";
import { Avatar, StatusBadge, timeAgo } from "../ui-helpers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CHANNEL_ICON: Record<string, typeof Phone> = {
  call: Phone,
  meeting: Video,
  email: Mail,
  chat: MessagesSquare,
};

export function ConversationsView() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const { selectedCustomerId, setSelectedCustomer } = useDealMind();

  useEffect(() => {
    load();
    api.customers.list().then((r) => {
      setCustomers(r.customers);
      if (!selectedCustomerId) {
        const rahul = r.customers.find((c) => c.name === "Rahul Sharma");
        setSelectedCustomer(rahul ? rahul.id : r.customers[0]?.id ?? null);
      }
    });
  }, [selectedCustomerId]);

  function load() {
    setLoading(true);
    api.conversations
      .list(selectedCustomerId || undefined)
      .then((r) => setConversations(r.conversations))
      .finally(() => setLoading(false));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">
            {conversations.length} conversation
            {conversations.length === 1 ? "" : "s"}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Record what was said, then retain the key facts into Hindsight
            memory.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New conversation
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <Card className="p-10 text-center border-dashed">
          <MessagesSquare className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No conversations yet. Record the first one — it will be stored and
            ready to retain.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <ConversationRow
              key={c.id}
              conv={c}
              expanded={expanded === c.id}
              onToggle={() =>
                setExpanded(expanded === c.id ? null : c.id)
              }
              onRetained={load}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <CreateConversationSheet
            customers={customers}
            defaultCustomerId={selectedCustomerId}
            onClose={() => setShowCreate(false)}
            onCreated={() => {
              setShowCreate(false);
              load();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ConversationRow({
  conv,
  expanded,
  onToggle,
  onRetained,
}: {
  conv: Conversation;
  expanded: boolean;
  onToggle: () => void;
  onRetained: () => void;
}) {
  const [full, setFull] = useState<Awaited<ReturnType<typeof api.conversations.get>> | null>(null);
  const [retaining, setRetaining] = useState(false);
  const [fact, setFact] = useState("");
  const hue = conv.customer?.avatarHue ?? 200;

  useEffect(() => {
    if (expanded && !full) {
      api.conversations.get(conv.id).then(setFull).catch(() => {});
    }
  }, [expanded, conv.id, full]);

  const Icon = CHANNEL_ICON[conv.channel] ?? MessagesSquare;

  async function retainFact() {
    if (!fact.trim()) {
      toast.error("Write the fact to retain");
      return;
    }
    setRetaining(true);
    try {
      const r = await api.memory.retain({
        customerId: conv.customerId,
        content: fact,
        context: conv.title,
        type: "fact",
      });
      toast.success("Retained via real Hindsight");
      setFact("");
      onRetained();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setRetaining(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/40 transition"
      >
        <Avatar
          name={conv.customer?.name ?? "?"}
          hue={hue}
          size={36}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{conv.title}</span>
            {conv.sentiment && (
              <StatusBadge status={conv.sentiment} />
            )}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            {conv.customer?.name} · {conv.channel} · {timeAgo(conv.createdAt)}
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground">
          {conv._count?.messages ?? 0} msgs
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border/60 px-3 py-3 space-y-3">
          {conv.summary && (
            <p className="text-[12px] text-muted-foreground italic">
              {conv.summary}
            </p>
          )}
          {!full ? (
            <Skeleton className="h-24" />
          ) : (
            <div className="space-y-2">
              {full.conversation.messages.map((m) => {
                const isCustomer = m.role === "customer";
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex gap-2.5",
                      isCustomer ? "flex-row" : "flex-row-reverse",
                    )}
                  >
                    <Avatar
                      name={isCustomer ? conv.customer?.name ?? "C" : "AE"}
                      hue={isCustomer ? hue : 160}
                      size={28}
                    />
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-3 py-2 text-[12px]",
                        isCustomer
                          ? "bg-muted/60"
                          : "bg-primary/10 text-foreground",
                      )}
                    >
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                        {m.role}
                      </div>
                      {m.content}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary mb-2">
              <Brain className="h-3.5 w-3.5" />
              Save a fact to Hindsight memory
            </div>
            <div className="flex gap-2">
              <Input
                value={fact}
                onChange={(e) => setFact(e.target.value)}
                placeholder="e.g. Rahul said CRM integration is a hard requirement."
                className="text-[13px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") retainFact();
                }}
              />
              <Button onClick={retainFact} disabled={retaining} className="gap-2">
                {retaining ? (
                  <Brain className="h-4 w-4 animate-pulse" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Retain
              </Button>
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              This calls <code className="text-[10px]">client.retain(bankId, content)</code>{" "}
              on the real Hindsight SDK.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

function CreateConversationSheet({
  customers,
  defaultCustomerId,
  onClose,
  onCreated,
}: {
  customers: Customer[];
  defaultCustomerId: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [customerId, setCustomerId] = useState(
    defaultCustomerId ?? customers[0]?.id ?? "",
  );
  const [title, setTitle] = useState("");
  const [channel, setChannel] = useState("meeting");
  const [sentiment, setSentiment] = useState("neutral");
  const [messages, setMessages] = useState<
    { role: string; content: string }[]
  >([{ role: "salesperson", content: "" }, { role: "customer", content: "" }]);
  const [retainLine, setRetainLine] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!customerId) return toast.error("Pick a customer");
    if (!title.trim()) return toast.error("Add a title");
    setSaving(true);
    try {
      const conv = await api.conversations.create({
        customerId,
        title,
        channel,
        sentiment,
        messages: messages.filter((m) => m.content.trim()),
      });
      if (retainLine.trim()) {
        await api.memory.retain({
          customerId,
          content: retainLine,
          context: title,
          type: "fact",
        });
      }
      toast.success("Conversation recorded");
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="bg-card w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl border border-border p-5 max-h-[92vh] overflow-y-auto scroll-thin"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Record a conversation</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted-foreground">Customer</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="mt-0.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.company}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Discovery call — pricing"
                className="mt-0.5"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="mt-0.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {["meeting", "call", "email", "chat"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Sentiment</label>
              <select
                value={sentiment}
                onChange={(e) => setSentiment(e.target.value)}
                className="mt-0.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {["positive", "neutral", "negative", "mixed"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground">Messages</label>
            <div className="mt-0.5 space-y-2">
              {messages.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <select
                    value={m.role}
                    onChange={(e) => {
                      const next = [...messages];
                      next[i].role = e.target.value;
                      setMessages(next);
                    }}
                    className="h-9 w-28 rounded-md border border-input bg-background px-2 text-[12px]"
                  >
                    {["salesperson", "customer", "agent", "note"].map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={m.content}
                    onChange={(e) => {
                      const next = [...messages];
                      next[i].content = e.target.value;
                      setMessages(next);
                    }}
                    placeholder="What they said…"
                    className="flex-1 text-[13px]"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setMessages(messages.filter((_, idx) => idx !== i))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 gap-1"
              onClick={() =>
                setMessages([
                  ...messages,
                  { role: "customer", content: "" },
                ])
              }
            >
              <Plus className="h-3.5 w-3.5" /> Add line
            </Button>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-3">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-primary flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5" /> Retain a fact from this conversation
            </label>
            <Input
              value={retainLine}
              onChange={(e) => setRetainLine(e.target.value)}
              placeholder="e.g. Rahul said the product is too expensive at current per-seat pricing."
              className="mt-1.5 text-[13px]"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Stored into Hindsight so the next meeting prep can recall it.
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving ? "Saving…" : "Record + retain"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

void User;
