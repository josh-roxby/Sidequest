"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { Mark, type MarkName } from "@/components/primitives/Marks";
import { cn } from "@/lib/cn";
import { getTaught, getTaughtServer, markTaught, subscribeTaught } from "@/lib/taught";

const HOLD_MS = 400;

interface Dest {
  href: string;
  label: string;
  mark: MarkName;
  /** Shown when the tile is held. Every one of these is also reachable by
   *  tapping through — nothing in the app is hold-only. */
  shortcuts: { label: string; href: string }[];
}

const DESTS: Dest[] = [
  { href: "/map", label: "Map", mark: "map", shortcuts: [
    { label: "Recentre", href: "/map?a=recentre" },
    { label: "Layers", href: "/map?a=layers" },
    { label: "Drop a pin", href: "/map?a=pin" }] },
  { href: "/quests", label: "Quests", mark: "quest", shortcuts: [
    { label: "Change tier", href: "/quests?a=tier" },
    { label: "Saved", href: "/quests?a=saved" },
    { label: "Collections", href: "/quests?a=collections" }] },
  { href: "/journal", label: "Journal", mark: "journal", shortcuts: [
    { label: "Search", href: "/journal?a=search" },
    { label: "Tales read", href: "/journal?a=tales" }] },
  { href: "/you", label: "You", mark: "you", shortcuts: [
    { label: "Territory", href: "/you?a=territory" },
    { label: "Badges", href: "/you?a=badges" },
    { label: "Settings", href: "/you?a=settings" }] },
];

/** 2×2 square anchored in the thumb arc, 8px off the bottom-right. It never
 *  spans the screen width, so it never reads as a tab bar, and it leaves the
 *  whole left of the map clear.
 *
 *  The 2px gap is --ink rather than transparent so the block reads as one
 *  ruled object, not four floating buttons.
 *
 *  Hidden while a frame is open: the frame's dismiss control takes over the
 *  same 56px anchor. docs/design-system.md §C. */
export function ThumbBlock({ hidden = false }: { hidden?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [fan, setFan] = useState<number | null>(null);
  const [holding, setHolding] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);

  const taught = useSyncExternalStore(subscribeTaught, getTaught, getTaughtServer);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHolding(null);
  }, []);

  const onDown = useCallback((i: number) => {
    held.current = false;
    setHolding(i);
    timer.current = setTimeout(() => {
      held.current = true;
      setHolding(null);
      setFan(i);
      markTaught();
      navigator.vibrate?.(8);
    }, HOLD_MS);
  }, []);

  const onClick = useCallback((e: React.MouseEvent, href: string) => {
    // A completed hold already acted; swallow the click it also fires.
    if (held.current) { e.preventDefault(); held.current = false; return; }
    setFan(null);
    router.push(href);
  }, [router]);

  if (hidden) return null;

  return (
    <>
      {fan !== null ? (
        <button
          type="button"
          aria-label="Close shortcuts"
          className="fixed inset-0 z-30 cursor-default"
          onClick={() => setFan(null)}
        />
      ) : null}

      {!taught ? (
        <p
          className="t-data pointer-events-none fixed z-30 text-[10px] uppercase leading-[1.4] text-stone"
          style={{ left: "var(--gutter)", bottom: "calc(var(--gutter) + 6px)", maxWidth: 130 }}
        >
          Tap to switch<br />Hold for more
        </p>
      ) : null}

      {fan !== null ? (
        <nav
          className="fixed z-40 flex flex-col gap-px border border-ink bg-ink"
          style={{
            right: "var(--gutter)",
            bottom: "calc(var(--gutter) + var(--block) + 2px)",
            width: "var(--block)",
            transformOrigin: "bottom right",
            animation: "sq-frame-in var(--dur-frame) var(--ease-out)",
          }}
        >
          {DESTS[fan].shortcuts.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              onClick={() => setFan(null)}
              className="bg-surface px-2.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink active:bg-field-soft"
            >
              {s.label}
            </Link>
          ))}
        </nav>
      ) : null}

      <nav
        aria-label="Sections"
        className="fixed z-40 grid gap-px border border-ink bg-ink"
        style={{
          right: "var(--gutter)",
          bottom: "calc(var(--gutter) + env(safe-area-inset-bottom))",
          gridTemplateColumns: "var(--tile) var(--tile)",
          gridTemplateRows: "var(--tile) var(--tile)",
          gap: "var(--tile-gap)",
        }}
      >
        {DESTS.map((d, i) => {
          const active = pathname === d.href;
          return (
            <Link
              key={d.href}
              href={d.href}
              aria-current={active ? "page" : undefined}
              onPointerDown={() => onDown(i)}
              onPointerUp={clear}
              onPointerLeave={clear}
              onPointerCancel={clear}
              onClick={(e) => onClick(e, d.href)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-[3px] rounded-none",
                "transition-colors active:scale-[0.97]",
                active ? "bg-field text-field-ink" : "bg-surface text-stone",
              )}
              style={{ transitionDuration: "var(--dur-state)" }}
            >
              <Mark name={d.mark} size={15} />
              <span className="text-[9px] font-semibold uppercase tracking-[0.07em]">
                {d.label}
              </span>
              {/* The ring drawing over the hold duration IS the affordance:
                  a half-press shows something starting, so the gesture
                  teaches itself. docs/design-system.md §C-3-1. */}
              {holding === i ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-[2px] border border-rust"
                  style={{ animation: `sq-hold-ring ${HOLD_MS}ms linear forwards` }}
                />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
