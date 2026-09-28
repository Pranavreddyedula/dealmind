"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

/** Compact, premium-styled markdown renderer for agent briefings. */
export function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        "prose-headings:font-semibold prose-headings:tracking-tight",
        "prose-h2:mt-4 prose-h2:mb-1.5 prose-h2:text-[15px]",
        "prose-h3:mt-3 prose-h3:mb-1 prose-h3:text-[13px]",
        "prose-p:my-1.5 prose-p:leading-relaxed",
        "prose-li:my-0.5 prose-ul:my-1.5 prose-ol:my-1.5",
        "prose-strong:text-foreground",
        "prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-[12px] prose-code:before:content-[''] prose-code:after:content-['']",
        "prose-code:bg-muted prose-pre:bg-muted/60",
        className,
      )}
    >
      <ReactMarkdown
        components={{
          h2: ({ node, ...props }) => (
            <h2 className="flex items-center gap-2 text-foreground" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a
              className="text-primary underline underline-offset-2 hover:opacity-80"
              target="_blank"
              rel="noreferrer"
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-5 space-y-0.5 marker:text-primary" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-5 space-y-0.5 marker:text-primary" {...props} />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
