"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Brain,
  MessagesSquare,
  Send,
  Activity,
  CircleDollarSign,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { api } from "../api";
import type { Analytics as A } from "../types";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const PALETTE = ["hsl(165 60% 45%)", "hsl(200 55% 45%)", "hsl(145 55% 42%)", "hsl(70 60% 48%)", "hsl(25 65% 50%)"];

export function AnalyticsView() {
  const [data, setData] = useState<A | null>(null);
  useEffect(() => {
    api.analytics().then(setData).catch(() => {});
  }, []);
  if (!data)
    return (
      <div className="grid lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    );

  const statusData = data.byStatus.map((s) => ({
    name: s.status,
    value: s._count,
  }));
  const memTypeData = (data.byMode ?? []).map((m) => ({
    name: m.mode ?? "unknown",
    value: m._count,
  }));
  const actionData = data.byAction.map((a) => ({
    name: a.action,
    value: a._count,
  }));
  const pipelineData = data.pipelineByStage.map((p) => ({
    name: p.status,
    value: p._sum.dealValue ?? 0,
    count: p._count,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Stat label="Customers" value={data.counts.customers} icon={Users} hue={160} />
        <Stat label="Conversations" value={data.counts.conversations} icon={MessagesSquare} hue={200} />
        <Stat label="Memories" value={data.counts.memories} icon={Brain} hue={145} />
        <Stat label="Follow-ups" value={data.counts.followups} icon={Send} hue={70} />
        <Stat label="Briefings" value={data.counts.briefs} icon={Activity} hue={340} />
        <Stat label="Agent ops" value={data.counts.logs} icon={BarChart3} hue={30} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard
          title="Pipeline value by stage"
          subtitle={`$${data.totalPipelineValue.toLocaleString()} total`}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={pipelineData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis
                type="number"
                tick={{ fontSize: 10 }}
                stroke="currentColor"
                opacity={0.4}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                width={80}
                opacity={0.5}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, "Pipeline"]}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {pipelineData.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Customers by status"
          subtitle={`${data.byStatus.length} stages`}
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                innerRadius={48}
                paddingAngle={2}
              >
                {statusData.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Memory ops by engine"
          subtitle="retain / recall / reflect — grouped by Hindsight mode"
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={memTypeData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} opacity={0.5} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} opacity={0.4} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="hsl(165 60% 45%)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Agent operations"
          subtitle="retain · recall · reflect · meeting-prep · followup"
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={actionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} opacity={0.4} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                width={100}
                opacity={0.5}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="hsl(200 55% 45%)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  hue,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  hue: number;
}) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        style={{
          background: `hsl(${hue} 55% 50% / 0.12)`,
          color: `hsl(${hue} 60% 42%)`,
        }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-xl font-semibold tabular-nums">{value}</div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
      </div>
    </Card>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-4 md:p-5">
      <div className="mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <CircleDollarSign className="h-4 w-4 text-primary" />
          {title}
        </h3>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
    </Card>
  );
}
