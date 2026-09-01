"use client";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type Placement = "bottom-left" | "bottom-right" | "top-left" | "top-right";

const POS: Record<Placement, string> = {
  "bottom-left": "top-full right-0 mt-2",
  "bottom-right": "top-full left-0 mt-2",
  "top-left": "bottom-full right-0 mb-2",
  "top-right": "bottom-full left-0 mb-2",
};

const ORIGIN: Record<Placement, string> = {
  "bottom-left": "top right",
  "bottom-right": "top left",
  "top-left": "bottom right",
  "top-right": "bottom left",
};

/** Custom, tap-first tooltip.
 *
 *  Never the native `title` attribute: that needs a hover no phone has, and it
 *  renders in OS chrome we cannot style.
 *
 *  Placement is corner-anchored rather than centred, so a tooltip on a control
 *  near a screen edge grows inward instead of off the side. The default,
 *  bottom-left, is right for the header chips: they sit top-right, so the
 *  panel drops down and back into the page.
 *
 *  Always an explanation, never the only route to information. Anything a
 *  person must read to use a control belongs in the control's own label.
 *  docs/design-system.md §I-6. */
export function Tooltip({
  text,
  placement = "bottom-left",
  children,
  className,
}: {
  text: string;
  placement?: Placement;
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
            "pointer-events-none absolute z-[70] w-max max-w-[200px]",
            "border border-ink bg-ink px-2.5 py-2 text-[11px] leading-[1.4] text-surface",
            POS[placement],
          )}
          style={{
            borderRadius: "var(--r-sm)",
            animation: "sq-frame-in var(--dur-state) var(--ease-out)",
            transformOrigin: ORIGIN[placement],
          }}
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}
