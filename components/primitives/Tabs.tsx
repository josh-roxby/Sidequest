"use client";
import { cn } from "@/lib/cn";
import { Data } from "./Text";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

/** Active tab is a field pill; the rest are plain text. Counts are mono. */
export function Tabs({
  items, value, onChange,
}: {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="tablist" className="no-bar flex items-center gap-1 overflow-x-auto">
      {items.map((t) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.07em]",
              on ? "bg-field text-field-ink" : "text-stone",
            )}
            style={{ borderRadius: "var(--r-full)", transition: "background-color var(--dur-state)" }}
          >
            {t.label}
            {t.count !== undefined ? (
              <Data className={cn("text-[11px]", on ? "text-field-ink" : "text-mute")}>
                {t.count}
              </Data>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Square checkbox, filled field when done. Used for quest objectives, which
 *  are read at a glance rather than toggled, so the row is not a control
 *  unless onChange is supplied. */
/** The panel under a tab row. Slides in on every change, so switching tabs
 *  reads as travelling through one surface rather than as a page swap.
 *
 *  Keyed on the tab id, so React remounts it and the animation runs each time.
 *  Deliberately one direction rather than mirroring the direction you moved:
 *  knowing that needs the previous index during render, and every way of
 *  keeping it there is either a ref read during render or a state write in an
 *  effect. A consistent slide costs nothing and cannot go wrong. */
export function TabPanel({
  value, children,
}: {
  value: string; children: React.ReactNode;
}) {
  return (
    <div
      key={value}
      role="tabpanel"
      style={{ animation: "sq-slide-l var(--dur-frame) var(--ease-out)" }}
    >
      {children}
    </div>
  );
}

export function Check({ done, label, value }: { done: boolean; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-rule py-2.5 last:border-b-0">
      <span
        aria-hidden
        className="flex h-4 w-4 shrink-0 items-center justify-center border"
        style={{
          borderRadius: "var(--r-sm)",
          borderColor: done ? "var(--field)" : "var(--rule)",
          background: done ? "var(--field)" : "transparent",
        }}
      >
        {done ? <span className="text-[10px] leading-none text-field-ink">✓</span> : null}
      </span>
      <span className="t-small flex-1 text-ink">{label}</span>
      {value ? <Data className="text-stone">{value}</Data> : null}
    </div>
  );
}
