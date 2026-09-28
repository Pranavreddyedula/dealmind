"use client";

import { cn } from "@/lib/utils";

/** DealMind logo mark — a brain/memory node glyph in emerald. */
export function DealMindLogo({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dm-grad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="oklch(0.7 0.14 165)" />
          <stop offset="100%" stopColor="oklch(0.55 0.13 200)" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#dm-grad)" />
      <path
        d="M14 30c0-6 4-10 10-10s10 4 10 10"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="24" cy="20" r="3.4" fill="white" />
      <circle cx="14" cy="30" r="2.6" fill="white" />
      <circle cx="34" cy="30" r="2.6" fill="white" />
      <path
        d="M24 23.4v6.6M14 30h20"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

export function DealMindWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-semibold tracking-tight", className)}>
      Deal<span className="text-primary">Mind</span>
    </span>
  );
}
