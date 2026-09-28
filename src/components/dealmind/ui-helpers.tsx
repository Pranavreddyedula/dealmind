"use client";

import { cn } from "@/lib/utils";
import type { CustomerStatus } from "./types";

export function statusColor(status: string): string {
  switch (status) {
    case "lead":
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    case "qualified":
      return "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300";
    case "negotiation":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
    case "customer":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
    case "churned":
      return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function StatusBadge({ status }: { status: CustomerStatus | string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
        statusColor(status),
      )}
    >
      {status}
    </span>
  );
}

export function memoryTypeColor(type?: string | null): string {
  if (!type) return "bg-muted text-muted-foreground";
  switch (type) {
    case "objection":
      return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
    case "competitor":
      return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300";
    case "requirement":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
    case "preference":
      return "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300";
    case "fact":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
    case "observation":
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function MemoryTypeBadge({ type }: { type?: string | null }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        memoryTypeColor(type),
      )}
    >
      {type ?? "memory"}
    </span>
  );
}

export function Avatar({
  name,
  hue,
  size = 36,
}: {
  name: string;
  hue: number;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold text-white shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: `linear-gradient(135deg, hsl(${hue} 55% 45%), hsl(${(hue + 30) % 360} 50% 38%))`,
      }}
      title={name}
    >
      {initials || "?"}
    </div>
  );
}

export function modeColor(mode: string): string {
  switch (mode) {
    case "hindsight-remote":
    case "hindsight-local":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
    default:
      return "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
}

export function ModeBadge({ mode }: { mode: string }) {
  const connected =
    mode === "hindsight-remote" || mode === "hindsight-local";
  const label = connected ? "Hindsight" : "Not configured";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
        modeColor(mode),
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          connected
            ? "bg-emerald-500 animate-pulse"
            : "bg-slate-400",
        )}
      />
      {label}
    </span>
  );
}

export function HindsightSourceBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
      Source: Hindsight
    </span>
  );
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return d.toLocaleDateString();
}
