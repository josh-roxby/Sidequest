"use client";
import { useEffect, useRef, useState } from "react";
import { Mark, type MarkName } from "@/components/primitives/Marks";
import { Data, Label } from "@/components/primitives/Text";
import { cn } from "@/lib/cn";

type PanelId = "tiles" | "badges" | "points" | "layers";

const BUTTONS: { id: PanelId; mark: MarkName; label: string }[] = [
  { id: "tiles", mark: "grid", label: "Tiles" },
  { id: "badges", mark: "badge", label: "Badges" },
  { id: "points", mark: "quest", label: "Points" },
  { id: "layers", mark: "layers", label: "Layers" },
];

export interface MapDockProps {
  /** Tiles revealed and total, for whatever the camera currently holds. The
   *  numbers move as you pan, which is the point: it reads as a survey of the
   *  ground in front of you rather than a lifetime total. */
  tilesInView: { revealed: number; total: number };
  region: string;
  points: { id: string; name: string; category: string; unlocked: boolean }[];
  badges: { label: string; progress: number; target: number }[];
  layers: Record<string, boolean>;
  onLayer: (key: string, on: boolean) => void;
  onPoint: (id: string) => void;
}

/** The map's own controls, bottom left, clear of the nav button.
 *
 *  Square buttons with panels above them rather than a bar of icons that
 *  navigate away: every one of these answers a question about the ground you
 *  are looking at, so the answer belongs over the map, not on another screen.
 *  Only one panel is open at a time. */
export function MapDock({
  tilesInView, region, points, badges, layers, onLayer, onPoint,
}: MapDockProps) {
  const [open, setOpen] = useState<PanelId | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent) { if (e.key === "Escape") setOpen(null); return; }
      if (!ref.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="absolute z-30"
      style={{
        left: "var(--gutter)",
        bottom: "calc(var(--gutter) + env(safe-area-inset-bottom))",
        right: "calc(var(--gutter) + var(--tile) + var(--s-2))",
      }}
    >
      {open ? (
        <div
          role="dialog"
          aria-label={BUTTONS.find((b) => b.id === open)?.label}
          className="mb-2 max-h-[46dvh] overflow-y-auto border border-ink bg-surface p-3"
          style={{
            borderRadius: "var(--r-md)",
            transformOrigin: "bottom left",
            animation: "sq-frame-in var(--dur-frame) var(--ease-out)",
          }}
        >
          {open === "tiles" ? (
            <>
              <Label>{region} in view</Label>
              <div className="mt-2 flex items-baseline gap-2">
                <Data size="lg" className="text-ink">{tilesInView.revealed.toLocaleString()}</Data>
                <Data className="text-stone">/ {tilesInView.total.toLocaleString()}</Data>
              </div>
              <div className="mt-2 h-1 w-full bg-surface-2">
                <div className="h-full bg-field"
                  style={{ width: `${(tilesInView.revealed / Math.max(1, tilesInView.total)) * 100}%` }} />
              </div>
              <p className="t-small mt-2 text-stone">
                A tile clears when you walk through it. Zoomed out, a big tile only
                clears once most of the ground inside it has.
              </p>
            </>
          ) : null}

          {open === "badges" ? (
            <>
              <Label>Close by</Label>
              <div className="mt-2 flex flex-col gap-2.5">
                {badges.map((b) => (
                  <div key={b.label}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="t-small font-semibold text-ink">{b.label}</span>
                      <Data className="text-stone">{b.progress} / {b.target}</Data>
                    </div>
                    <div className="mt-1 h-1 w-full bg-surface-2">
                      <div className="h-full bg-field"
                        style={{ width: `${(b.progress / b.target) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {open === "points" ? (
            <>
              <Label>{points.length} in view</Label>
              <div className="mt-2 flex flex-col gap-px bg-rule">
                {points.map((p) => (
                  <button key={p.id} type="button"
                    onClick={() => { setOpen(null); onPoint(p.id); }}
                    className="flex items-center justify-between gap-3 bg-surface px-2.5 py-2 text-left active:bg-field-soft">
                    <span className="min-w-0">
                      <span className="t-small block truncate font-semibold text-ink">{p.name}</span>
                      <Data className="text-[10px] uppercase text-mute">{p.category}</Data>
                    </span>
                    <Data className={cn("text-[10px] uppercase", p.unlocked ? "text-field" : "text-mute")}>
                      {p.unlocked ? "Found" : "Locked"}
                    </Data>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {open === "layers" ? (
            <>
              <Label>Show on the map</Label>
              <div className="mt-2 flex flex-col">
                {Object.entries(layers).map(([k, on]) => (
                  <button key={k} type="button" onClick={() => onLayer(k, !on)}
                    className="flex items-center justify-between gap-3 border-b border-rule py-2.5 text-left last:border-b-0">
                    <span className="t-small capitalize text-ink">{k}</span>
                    <span className={cn("relative h-6 w-10 border", on ? "border-field bg-field" : "border-rule bg-surface-2")}
                      style={{ borderRadius: "var(--r-full)" }}>
                      <span className="absolute top-[3px] block h-3.5 w-3.5 bg-surface"
                        style={{ borderRadius: "var(--r-full)", left: on ? 22 : 3,
                                 transition: "left var(--dur-state) var(--ease)" }} />
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="flex gap-1.5">
        {BUTTONS.map((b) => {
          const on = open === b.id;
          return (
            <button
              key={b.id}
              type="button"
              aria-label={b.label}
              aria-expanded={on}
              onClick={() => setOpen(on ? null : b.id)}
              className={cn(
                "flex h-11 w-11 items-center justify-center border active:scale-[0.97]",
                on ? "border-field bg-field text-field-ink" : "border-rule bg-surface text-stone",
              )}
              style={{ borderRadius: "var(--r-sm)", transitionDuration: "var(--dur-tap)" }}
            >
              <Mark name={b.mark} size={17} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
