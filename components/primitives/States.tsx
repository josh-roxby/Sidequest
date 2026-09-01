"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/** Hairline placeholder at the exact height of the content it stands in for,
 *  so nothing reflows on arrival. Shown only after 200ms — anything faster
 *  reads as a flicker rather than as loading. docs/ux-loops.md §A-1. */
export function Skeleton({ h = 16, className }: { h?: number; className?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      aria-hidden
      className={cn("w-full border border-rule", className)}
      style={{ height: h, opacity: show ? 1 : 0, transition: "opacity var(--dur-state)" }}
    />
  );
}

/** Survey notation rather than app furniture: a hairline square struck
 *  through on the diagonal. */
export function EmptyMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden
      fill="none" stroke="var(--rule)" strokeWidth="1">
      <rect x="0.5" y="0.5" width="39" height="39" />
      <path d="M0 40 L40 0" />
    </svg>
  );
}

export function EmptyState({
  line,
  action,
}: {
  line: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 py-6">
      <EmptyMark />
      <p className="t-body text-stone">{line}</p>
      {action}
    </div>
  );
}

/** Persistent, non-blocking, never repeated. docs/ux-loops.md §A-5. */
export function StatusStrip({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="t-data flex h-6 items-center px-3 text-[10px] uppercase text-stone"
      style={{ background: "var(--surface-2)" }}
    >
      {children}
    </div>
  );
}
