"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Plus,
  Mail,
  Phone,
  Video,
  MessagesSquare,
  Loader2,
  CheckCircle2,
  Clock,
  Brain,
  X,
} from "lucide-react";
import { api } from "../api";
import type { Customer, FollowUp } from "../types";
import { useDealMind } from "../store";
import { Avatar, timeAgo } from "../ui-helpers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CHANNEL_ICON: Record<string, typeof Mail> = {
  email: Mail,
  call: Phone,
  meeting: Video,
  linkedin: MessagesSquare,
};

export function FollowupsView() {
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [showGen, setShowGen] = useState(false);

  useEffect(() => {
    load();
    api.customers.list().then((r) => setCustomers(r.customers));
  }, [filter]);

  function load() {
    setLoading(true);
    api.followups
      .list(filter === "all" ? {} : { status: filter })
      .then((r) => setFollowups(r.followups))
      .finally(() => setLoading(false));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Follow-ups</h3>
          <p className="text-[11px] text-muted-foreground">
            Personalized drafts generated from each customer's Hindsight memory.
          </p>
        </div>
        <Button onClick={() => setShowGen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Generate follow-up
        </Button>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          {["all", "pending", "sent", "done", "snoozed"].map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : followups.length === 0 ? (
        <Card className="p-10 text-center border-dashed">
          <Send className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No follow-ups here. Generate one — it will be grounded in the
            customer's memory.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {followups.map((f, i) => (
            <FollowupRow key={f.id} fu={f} onUpdate={load} index={i} />
          ))}
        </div>
      )}

      {showGen && (
        <GenerateSheet
          customers={customers}
          onClose={() => setShowGen(false)}
          onCreated={() => {
            setShowGen(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function FollowupRow({
  fu,
  onUpdate,
  index,
}: {
  fu: FollowUp;
  onUpdate: () => void;
  index: number;
}) {
  const [updating, setUpdating] = useState(false);
  const Icon = CHANNEL_ICON[fu.channel] ?? Mail;
  const hue = fu.customer ? hashHue(fu.customer.name) : 200;

  async function mark(status: string) {
    setUpdating(true);
    try {
      await api.followups.update(fu.id, status);
      toast.success(`Marked ${status}`);
      onUpdate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card className="p-4">
        <div className="flex items-start gap-3">
          {fu.customer && (
            <Avatar name={fu.customer.name} hue={hue} size={38} />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium truncate">
                {fu.customer?.name}
                <span className="text-muted-foreground font-normal">
                  {" "}
                  · {fu.customer?.company}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                {fu.channel}
                {fu.dueAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(fu.dueAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <p className="mt-1.5 text-[13px] text-foreground/90 whitespace-pre-wrap">
              {fu.message}
            </p>
            <div className="mt-3 flex items-center gap-2">
              {fu.status === "sent" || fu.status === "done" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[11px] font-medium">
                  <CheckCircle2 className="h-3 w-3" />
                  {fu.status}
                </span>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => mark("sent")}
                    disabled={updating}
                    className="h-7 gap-1.5"
                  >
                    <Mail className="h-3 w-3" /> Mark sent
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => mark("done")}
                    disabled={updating}
                    className="h-7 gap-1.5"
                  >
                    <CheckCircle2 className="h-3 w-3" /> Done
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(fu.message)}
                    className="h-7"
                  >
                    Copy
                  </Button>
                </>
              )}
              <span className="ml-auto text-[10px] text-muted-foreground">
                {timeAgo(fu.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function GenerateSheet({
  customers,
  onClose,
  onCreated,
}: {
  customers: Customer[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [customerId, setCustomerId] = useState(
    customers.find((c) => c.name === "Rahul Sharma")?.id ??
      customers[0]?.id ??
      "",
  );
  const [channel, setChannel] = useState("email");
  const [tone, setTone] = useState("professional");
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<{
    message: string;
    mode: string;
    memoriesUsed: { id: string; text: string; type?: string | null }[];
  } | null>(null);

  async function generate() {
    if (!customerId) return;
    setGenerating(true);
    setPreview(null);
    try {
      const r = await api.followups.create({ customerId, channel, tone });
      setPreview({
        message: r.followUp.message,
        mode: r.mode,
        memoriesUsed: r.memoriesUsed,
      });
      toast.success("Follow-up generated");
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-border p-5 max-h-[92vh] overflow-y-auto scroll-thin"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Generate follow-up</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-3">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted-foreground">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="mt-0.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {["email", "call", "linkedin", "meeting"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="mt-0.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {["professional", "warm", "concise", "formal"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button
            onClick={generate}
            disabled={generating}
            className="w-full gap-2"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
            Generate from memory
          </Button>

          {preview && (
            <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/[0.04] p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                Draft · mode: {preview.mode} · {preview.memoriesUsed.length}{" "}
                memories used
              </div>
              <p className="text-[13px] whitespace-pre-wrap">
                {preview.message}
              </p>
              {preview.memoriesUsed.length > 0 && (
                <div className="mt-2 text-[11px] text-muted-foreground">
                  Grounded in:
                  <ul className="mt-1 space-y-0.5">
                    {preview.memoriesUsed.slice(0, 3).map((m) => (
                      <li key={m.id} className="flex gap-1">
                        <span>•</span>
                        <span className="line-clamp-1">{m.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}
