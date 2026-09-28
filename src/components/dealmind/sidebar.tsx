"use client";

import {
  LayoutDashboard,
  Users,
  MessagesSquare,
  Brain,
  Sparkles,
  Send,
  BarChart3,
  Settings,
  Database,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDealMind, type ViewId } from "./store";
import { DealMindLogo, DealMindWordmark } from "./logo";
import { Button } from "@/components/ui/button";
import { AgentStatusPill } from "./topbar";

interface NavItem {
  id: ViewId;
  label: string;
  icon: typeof LayoutDashboard;
  desc: string;
  badge?: string;
}

const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, desc: "Pipeline + memory pulse" },
  { id: "customers", label: "Customers", icon: Users, desc: "Accounts & profiles" },
  { id: "conversations", label: "Conversations", icon: MessagesSquare, desc: "Record & retain" },
  { id: "memory", label: "Memory", icon: Brain, desc: "Center · timeline · Q&A" },
  {
    id: "meeting-prep",
    label: "Meeting Prep",
    icon: Sparkles,
    desc: "Before vs after memory",
    badge: "DEMO",
  },
  { id: "followups", label: "Follow-ups", icon: Send, desc: "Personalized drafts" },
  { id: "analytics", label: "Analytics", icon: BarChart3, desc: "Pipeline + memory trends" },
  { id: "settings", label: "Settings", icon: Settings, desc: "LLM + Hindsight config" },
];

export function Sidebar() {
  const { view, setView } = useDealMind();
  return (
    <aside className="hidden md:flex h-full w-[260px] flex-col border-r border-sidebar-border bg-sidebar/80 glass">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border">
        <DealMindLogo size={34} />
        <div className="flex flex-col leading-tight">
          <DealMindWordmark className="text-[17px]" />
          <span className="text-[10px] text-muted-foreground -mt-0.5">
            AI Sales Intelligence
          </span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto scroll-thin px-3 py-4 space-y-1">
        <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>
        {NAV.map((item) => {
          const active = view === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={cn(
                "group w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              <span className="flex-1 text-left font-medium">{item.label}</span>
              {item.badge && (
                <span className="rounded bg-primary/15 text-primary px-1.5 py-0.5 text-[9px] font-bold tracking-wide">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="px-3 pb-4 space-y-3">
        <AgentStatusPill />
        <div className="rounded-lg border border-sidebar-border bg-card/60 p-3">
          <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
            <Database className="h-3.5 w-3.5" />
            Persistent memory
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Every customer fact is retained via the Hindsight SDK and recalled
            on demand — no note left behind.
          </p>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const { view, setView, sidebarOpen, setSidebarOpen } = useDealMind();
  if (!sidebarOpen) return null;
  return (
    <div
      className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onClick={() => setSidebarOpen(false)}
    >
      <aside
        className="absolute left-0 top-0 h-full w-[260px] bg-sidebar border-r border-sidebar-border flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border">
          <DealMindLogo size={30} />
          <DealMindWordmark className="text-base" />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const active = view === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px]",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span className="flex-1 text-left font-medium">{item.label}</span>
                {item.badge && (
                  <span className="rounded bg-primary/15 text-primary px-1.5 py-0.5 text-[9px] font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-3">
          <AgentStatusPill />
        </div>
      </aside>
    </div>
  );
}

export { NAV };
// unused-import guard
void Zap;
