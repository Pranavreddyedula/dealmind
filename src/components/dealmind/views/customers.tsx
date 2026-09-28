"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Users as UsersIcon,
  Mail,
  Building2,
  Phone,
  MapPin,
  Sparkles,
  Brain,
  MessagesSquare,
  Send,
  X,
} from "lucide-react";
import { api } from "../api";
import type { Customer } from "../types";
import { useDealMind } from "../store";
import { Avatar, StatusBadge, timeAgo } from "../ui-helpers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function CustomersView() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const { selectedCustomerId, setSelectedCustomer, setView } = useDealMind();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    api.customers
      .list()
      .then((r) => setCustomers(r.customers))
      .finally(() => setLoading(false));
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      (c.company ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (c.industry ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  const selected = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, company, industry…"
            className="pl-9"
          />
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New customer
        </Button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center border-dashed">
          <UsersIcon className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No customers match. Try re-seeding the demo.
          </p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card
                className="p-4 hover:border-primary/40 hover:shadow-md transition cursor-pointer group"
                onClick={() => {
                  setSelectedCustomer(c.id);
                  setOpen(true);
                }}
              >
                <div className="flex items-start gap-3">
                  <Avatar name={c.name} hue={c.avatarHue} size={42} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-sm truncate">
                        {c.name}
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="text-[12px] text-muted-foreground truncate">
                      {c.title} · {c.company}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {c.industry} · {c.city}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessagesSquare className="h-3 w-3" />
                      {c._count?.conversations ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Brain className="h-3 w-3" />
                      {c._count?.memories ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Send className="h-3 w-3" />
                      {c._count?.followUps ?? 0}
                    </span>
                  </div>
                  <span className="font-semibold tabular-nums">
                    ${(c.dealValue / 1000).toFixed(0)}k
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto scroll-thin">
          {selected && <CustomerDetail id={selected.id} />}
        </SheetContent>
      </Sheet>

      {showCreate && (
        <CreateCustomerSheet
          onClose={() => setShowCreate(false)}
          onCreated={(c) => {
            setSelectedCustomer(c.id);
            setShowCreate(false);
            load();
            toast.success(`${c.name} added`);
          }}
        />
      )}

      {/* hidden helper to navigate to meeting prep */}
      <button
        className="hidden"
        onClick={() => setView("meeting-prep")}
        aria-hidden
      />
    </div>
  );
}

function CustomerDetail({ id }: { id: string }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.customers.get>> | null>(null);
  useEffect(() => {
    api.customers.get(id).then(setData).catch(() => {});
  }, [id]);
  const { setView } = useDealMind();
  if (!data)
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  const c = data.customer;
  return (
    <div className="px-5 pb-6 pt-2 space-y-5">
      <SheetHeader className="space-y-0">
        <div className="flex items-center gap-3">
          <Avatar name={c.name} hue={c.avatarHue} size={48} />
          <div className="flex-1">
            <SheetTitle className="text-lg">{c.name}</SheetTitle>
            <p className="text-[12px] text-muted-foreground">
              {c.title} · {c.company}
            </p>
          </div>
          <StatusBadge status={c.status} />
        </div>
      </SheetHeader>

      <div className="grid grid-cols-2 gap-2 text-[12px]">
        <Detail icon={Mail} label="Email" value={c.email} />
        <Detail icon={Phone} label="Phone" value={c.phone} />
        <Detail icon={Building2} label="Industry" value={c.industry} />
        <Detail icon={MapPin} label="City" value={c.city} />
      </div>

      {c.notes && (
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-[12px] text-muted-foreground">
          {c.notes}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-center">
        <MiniStat label="Pipeline" value={`$${(c.dealValue / 1000).toFixed(0)}k`} />
        <MiniStat label="Conversations" value={c.conversations.length} />
        <MiniStat label="Memories" value={c.memories.length} />
      </div>

      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Memories
        </h4>
        <div className="space-y-2 max-h-60 overflow-y-auto scroll-thin">
          {c.memories.map((m) => (
            <div
              key={m.id}
              className="rounded-lg border border-border/60 bg-card/40 p-2.5"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-medium uppercase tracking-wide rounded px-1.5 py-0.5 bg-primary/10 text-primary">
                  {m.type ?? "memory"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {timeAgo(m.mentionedAt)}
                </span>
              </div>
              <p className="text-[12px]">{m.content}</p>
            </div>
          ))}
          {c.memories.length === 0 && (
            <p className="text-[12px] text-muted-foreground py-3 text-center">
              No memories retained yet.
            </p>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Recent conversations
        </h4>
        <div className="space-y-2">
          {c.conversations.slice(0, 4).map((cv) => (
            <div
              key={cv.id}
              className="flex items-center justify-between rounded-lg border border-border/60 p-2.5 text-[12px]"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{cv.title}</div>
                <div className="text-[10px] text-muted-foreground">
                  {cv.channel} · {timeAgo(cv.createdAt)}
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {cv._count?.messages ?? 0} msgs
              </span>
            </div>
          ))}
        </div>
      </div>

      <Button
        className="w-full gap-2"
        onClick={() => {
          useDealMind.getState().setSelectedCustomer(c.id);
          setView("meeting-prep");
        }}
      >
        <Sparkles className="h-4 w-4" />
        Prepare for my next meeting
      </Button>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-lg border border-border/60 p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-0.5 text-[12px] truncate">{value || "—"}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border/60 p-2.5">
      <div className="text-[15px] font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}

function CreateCustomerSheet({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (c: Customer) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    title: "",
    phone: "",
    industry: "",
    city: "",
    dealValue: "",
    status: "lead",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const r = await api.customers.create({
        ...form,
        dealValue: form.dealValue ? Number(form.dealValue) : 0,
      });
      onCreated(r.customer);
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
        className="bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-border p-5 max-h-[92vh] overflow-y-auto scroll-thin"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">New customer</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            ["name", "Full name *"],
            ["title", "Job title"],
            ["company", "Company"],
            ["email", "Email"],
            ["phone", "Phone"],
            ["industry", "Industry"],
            ["city", "City"],
            ["dealValue", "Deal value ($)"],
          ].map(([k, l]) => (
            <div key={k}>
              <label className="text-[11px] text-muted-foreground">{l}</label>
              <Input
                value={(form as Record<string, string>)[k]}
                onChange={(e) =>
                  setForm({ ...form, [k]: e.target.value })
                }
                className="mt-0.5"
              />
            </div>
          ))}
          <div>
            <label className="text-[11px] text-muted-foreground">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="mt-0.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {["lead", "qualified", "negotiation", "customer", "churned"].map(
                (s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>
        <div className="mt-5 flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving ? "Saving…" : "Create customer"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
