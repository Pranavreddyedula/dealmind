"use client";

import { Brain, Github, Zap } from "lucide-react";
import { DealMindWordmark } from "./logo";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card/40 glass">
      <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <DealMindWordmark className="text-sm" />
          <span className="text-muted-foreground/60">·</span>
          <span className="flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5 text-primary" />
            Persistent memory via the Hindsight SDK
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-primary" />
            Next.js · TypeScript · Prisma · Hindsight
          </span>
          <span className="text-muted-foreground/60">© {new Date().getFullYear()} DealMind</span>
        </div>
      </div>
    </footer>
  );
}

void Github;
