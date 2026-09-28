"use client";

import { useEffect, useState } from "react";
import {
  Users,
  MessagesSquare,
  Brain,
  Send,
  TrendingUp,
  Sparkles,
  ArrowRight,
  CircleDollarSign,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "../api";
import type { Analytics, Customer } from "../types";
import { useDealMind } from "../store";
import {
  Avatar,
  ModeBadge,
  StatusBadge,
  memoryTypeColor,
  timeAgo,
} from "../ui-helpers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  icon: Icon,
  hue,
  sub,
}: {
  label: string;
  value: string | number;
  icon: typeof Users;
  hue: number;
  sub?: string;
}) {
  return (
    <Card className="relative overflow-hidden p-4 md:p-5">
      <div
        className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-15"
        style={{ background: `hsl(${hue} 60% 50%)` }}
      />
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-muted-foreground">
          {label}
        </span>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{
            background: `hsl(${hue} 55% 50% / 0.12)`,
            color: `hsl(${hue} 60% 42%)`,
          }}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight">
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>
      )}
    </Card>
  );
}

export function DashboardView() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { setView, setSelectedCustomer } = useDealMind();

  useEffect(() => {
    Promise.all([api.analytics(), api.customers.list()])
      .then(([a, c]) => {
        setAnalytics(a);
        setCustomers(c.customers);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const recentMemories = customers
    .flatMap((c) => [])
    .slice(0, 5);
  const topPipeline = [...customers]
    .sort((a, b) => b.dealValue - a.dealValue)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="relative overflow-hidden p-5 md:p-6 border-primary/20">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-[12px] font-semibold uppercase tracking-wider text-primary">
                  The headline demo
                </span>
              </div>
              <h2 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">
                See the difference memory makes.
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">
                Watch DealMind prepare for a meeting with{" "}
                <span className="font-medium text-foreground">Rahul Sharma</span>{" "}
                — once without memory, once with Hindsight recall. The agent
                actually remembers the price objection, Competitor X, and the
                CRM-integration requirement.
              </p>
            </div>
            <Button
              size="lg"
              className="gap-2 self-start md:self-center"
              onClick={() => setView("meeting-prep")}
            >
              <Sparkles className="h-4 w-4" />
              Run before / after demo
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Customers"
          value={analytics?.counts.customers ?? 0}
          icon={Users}
          hue={160}
          sub="in pipeline"
        />
        <StatCard
          label="Conversations"
          value={analytics?.counts.conversations ?? 0}
          icon={MessagesSquare}
          hue={200}
          sub="recorded + retained"
        />
        <StatCard
          label="Memories"
          value={analytics?.counts.memories ?? 0}
          icon={Brain}
          hue={145}
          sub="persisted via Hindsight"
        />
        <StatCard
          label="Pipeline value"
          value={`$${(analytics?.totalPipelineValue ?? 0).toLocaleString()}`}
          icon={CircleDollarSign}
          hue={70}
          sub="open + won"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Memory trend */}
        <Card className="lg:col-span-2 p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Memory pulse — last 14 days
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Facts retained into Hindsight memory per day
              </p>
            </div>
            {analytics?.hindsight && (
              <ModeBadge mode={analytics.hindsight.mode} />
            )}
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.memoryTrend ?? []}>
                <defs>
                  <linearGradient id="mem-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(165 60% 45%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(165 60% 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(d) => d.slice(5)}
                  stroke="currentColor"
                  opacity={0.4}
                />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} opacity={0.4} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ fontSize: 11 }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(165 60% 42%)"
                  strokeWidth={2}
                  fill="url(#mem-grad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top pipeline */}
        <Card className="p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Top open deals
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("customers")}
              className="text-[11px] h-7"
            >
              View all
            </Button>
          </div>
          <div className="space-y-2 max-h-[220px] overflow-y-auto scroll-thin pr-1">
            {topPipeline.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCustomer(c.id);
                  setView("customers");
                }}
                className="w-full flex items-center gap-3 rounded-lg p-2 hover:bg-muted/60 transition text-left"
              >
                <Avatar name={c.name} hue={c.avatarHue} size={34} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {c.company}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums">
                    ${(c.dealValue / 1000).toFixed(0)}k
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              </button>
            ))}
            {topPipeline.length === 0 && (
              <p className="text-[12px] text-muted-foreground py-6 text-center">
                No customers yet — re-seed the demo.
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent memory across all customers */}
      <Card className="p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Latest memories retained
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView("memory")}
            className="text-[11px] h-7"
          >
            Memory center
          </Button>
        </div>
        <RecentMemories />
      </Card>
    </div>
  );
}

function RecentMemories() {
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof api.memory.timeline>>["items"]
  >([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.memory
      .timeline()
      .then((r) => setItems(r.items))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <Skeleton className="h-40 rounded-lg" />;
  if (items.length === 0)
    return (
      <p className="text-[12px] text-muted-foreground py-6 text-center">
        No memories retained yet.
      </p>
    );
  return (
    <div className="space-y-2 max-h-72 overflow-y-auto scroll-thin pr-1">
      {items.slice(0, 8).map((m) => (
        <div
          key={m.id}
          className="flex items-start gap-3 rounded-lg border border-border/60 bg-card/40 p-3"
        >
          {m.customer && (
            <Avatar
              name={m.customer.name}
              hue={hashHue(m.customer.name)}
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
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground line-clamp-2">
              {m.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}
