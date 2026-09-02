"use client";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

interface FrameProps {
  open: boolean;
  onDismiss: () => void;
  label: string;
  title: string;
  /** "square" for everything. "tall" only for reading surfaces: the tale
   *  reader and the quest preview. There is no third size and no full sheet.
   *  docs/design-system.md §B-1. */
  ratio?: "square" | "tall";
  action?: React.ReactNode;
  /** Rendered in the header, flexed to the right of the title. */
  headerRight?: React.ReactNode;
  /** Rendered in the footer to the left of the dismiss control, where a frame
   *  has a strip of space that would otherwise sit empty. */
  footerLeft?: React.ReactNode;
  /** Bodies scroll by default. Pass false when the content sizes itself to the
   *  frame instead, as the nav drawer does. */
  scroll?: boolean;
  children: React.ReactNode;
}

/** Replaces every sheet, drawer, dialog and modal.
 *
 *  A square inset 8px from the left, right and bottom, scaling up from the
 *  thumb corner rather than sliding from the bottom edge. That origin is the
 *  single decision that most separates this from a drawer, and it ties every
 *  frame visually to the block it was opened from. */
export function Frame({
  open, onDismiss, label, title, ratio = "square", action, footerLeft, headerRight,
  scroll = true, children,
}: FrameProps) {
  const ref = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const pressedScrim = useRef(false);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onDismiss(); return; }
      if (e.key !== "Tab" || !ref.current) return;
      const f = ref.current.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])',
      );
      if (f.length === 0) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener("keydown", onKey);
    ref.current?.querySelector<HTMLElement>("button,a[href],input")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      restoreTo.current?.focus();
    };
  }, [open, onDismiss]);

  if (!open) return null;

  return (
    <>
      {/* Dismiss on a full press-release cycle that BEGAN on the scrim, not on
          click. A frame opened from a pointerup — which is how the nav button
          works, because it has to distinguish tap from hold — is still inside
          that gesture when it mounts. The browser then dispatches the trailing
          click, the freshly mounted scrim is what sits under the finger, and
          an onClick handler would swallow it and close the frame in the same
          frame it opened. Requiring the pointerdown to land on the scrim first
          makes that impossible: the opening gesture's pointerdown happened on
          the trigger, before this element existed. */}
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onPointerDown={() => { pressedScrim.current = true; }}
        onPointerUp={() => {
          if (!pressedScrim.current) return;
          pressedScrim.current = false;
          onDismiss();
        }}
        onPointerCancel={() => { pressedScrim.current = false; }}
        className="gesture fixed inset-0 z-50 cursor-default"
        style={{ background: "rgba(22,24,26,0.32)", transition: "opacity var(--dur-frame)",
                 overscrollBehavior: "none" }}
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed z-[60] flex flex-col overflow-hidden border border-ink bg-surface"
        style={{
          left: "var(--gutter)",
          right: "var(--gutter)",
          bottom: "calc(var(--gutter) + env(safe-area-inset-bottom))",
          aspectRatio: ratio === "tall" ? "1 / 1.28" : "1 / 1",
          maxHeight: "calc(var(--app-h) - var(--s-12))",
          borderRadius: "var(--r-md)",
          transformOrigin: "bottom right",
          animation: "sq-frame-in var(--dur-frame) var(--ease-out)",
        }}
      >
        <header className="flex items-start justify-between gap-3 border-b border-rule px-4 pb-2.5 pt-3.5">
          <div className="min-w-0">
            <p className="t-label text-stone">{label}</p>
            <h2 className="t-h2 mt-1 text-ink">{title}</h2>
          </div>
          {headerRight}
        </header>

        {/* overscroll-contain, not just overflow. Reaching the end of this
            list would otherwise chain the scroll outward to the document; on a
            phone that shifts the visual viewport, which resizes the map canvas
            underneath and reads as the whole screen sliding around behind the
            drawer. touch-action keeps the vertical drag in here rather than
            letting the canvas's own pointer handlers see it. */}
        <div
          className={cn(
            "min-h-0 flex-1 overscroll-contain px-4 py-3.5",
            scroll ? "overflow-y-auto" : "overflow-hidden",
          )}
          style={{ touchAction: scroll ? "pan-y" : "none" }}
        >
          {children}
        </div>

        {/* The dismiss is flush to the frame's bottom-right corner. Because
            the frame is inset 8px, it lands at exactly right:8 bottom:8 —
            the square the thumb block's bottom-right tile just vacated. The
            thumb never moves. docs/design-system.md §B-4. */}
        <footer
          className="flex items-stretch border-t border-rule"
          style={{ height: "var(--tile)" }}
        >
          <div className="flex min-w-0 flex-1 items-center px-2">{footerLeft ?? action}</div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close"
            className="shrink-0 rounded-[--r-sm] border-0 bg-ink text-[18px] leading-none text-surface active:scale-[0.97]"
            style={{ width: "var(--tile)", transitionDuration: "var(--dur-tap)" }}
          >
            ×
          </button>
        </footer>
      </div>
    </>
  );
}
