"use client";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/** Custom, tap-first tooltip.
 *
 *  Never the native `title` attribute: that needs a hover, which no phone has,
 *  and it renders in the OS chrome where we cannot style it. This toggles on
 *  tap, closes on the next tap anywhere, and closes on Escape.
 *
 *  It is an explanation, never the only place information lives. Anything that
 *  a person must read to use a control belongs in the control's own label.
 *  docs/design-system.md §I-6. */
export function Tooltip({
  text,
  side = "top",
  children,
  className,
}: {
  text: string;
  side?: "top" | "bottom";
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (e.type === "pointerdown" && ref.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <span ref={ref} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
        className="inline-flex"
      >
        {children}
      </button>
      {open ? (
        <span
          id={id}
          role="tooltip"
          className={cn(
            "pointer-events-none absolute left-1/2 z-[70] w-max max-w-[180px] -translate-x-1/2",
            "border border-ink bg-ink px-2.5 py-1.5 text-[11px] leading-[1.35] text-surface",
            side === "top" ? "bottom-full mb-2" : "top-full mt-2",
          )}
          style={{
            borderRadius: "var(--r-sm)",
            animation: "sq-frame-in var(--dur-state) var(--ease-out)",
            transformOrigin: side === "top" ? "bottom center" : "top center",
          }}
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}
