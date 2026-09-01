"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { Mark, type MarkName } from "@/components/primitives/Marks";
import { cn } from "@/lib/cn";
import { getTaught, getTaughtServer, markTaught, subscribeTaught } from "@/lib/taught";
import { useSyncExternalStore } from "react";

const HOLD_MS = 400;

interface Dest {
  href: string;
  label: string;
  mark: MarkName;
  /** Rust rather than field. One destination is permanently accented; it is
   *  the outward-facing one, where you go to find somewhere new. */
  accent?: boolean;
  shortcuts: { label: string; href: string }[];
}

export const DESTS: Dest[] = [
  { href: "/map", label: "Map", mark: "map", shortcuts: [
    { label: "Recentre", href: "/map?a=recentre" },
    { label: "Layers", href: "/map?a=layers" },
    { label: "Drop a pin", href: "/map?a=pin" }] },
  { href: "/quests", label: "Quests", mark: "quest", shortcuts: [
    { label: "Change tier", href: "/quests?a=tier" },
    { label: "Saved", href: "/quests?a=saved" }] },
  { href: "/inventory", label: "Inventory", mark: "journal", shortcuts: [
    { label: "Tales read", href: "/inventory?a=tales" },
    { label: "Badges", href: "/inventory?a=badges" },
    { label: "Territory", href: "/inventory?a=territory" }] },
  { href: "/outposts", label: "Outposts", mark: "you", accent: true, shortcuts: [
    { label: "Saved places", href: "/outposts?a=saved" },
    { label: "Set base camp", href: "/outposts?a=base" }] },
];

/** Press-and-hold shared by both nav forms. The ring drawing over the hold
 *  duration IS the affordance: a half-press shows something starting, so the
 *  gesture teaches itself without a tooltip. Every shortcut is also reachable
 *  by tapping through, so nothing is hold-only. */
function useHold(onHold: (i: number) => void) {
  const [holding, setHolding] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHolding(null);
  }, []);

  const down = useCallback((i: number) => {
    held.current = false;
    setHolding(i);
    timer.current = setTimeout(() => {
      held.current = true;
      setHolding(null);
      markTaught();
      navigator.vibrate?.(8);
      onHold(i);
    }, HOLD_MS);
  }, [onHold]);

  return { holding, held, down, clear, HOLD_MS };
}

function tileClass(active: boolean, accent: boolean) {
  if (accent) return "bg-rust text-field-ink";
  if (active) return "bg-field text-field-ink";
  return "bg-surface text-stone";
}

function Fan({ i, onClose }: { i: number; onClose: () => void }) {
  return (
    <>
      <button type="button" aria-label="Close shortcuts" onClick={onClose}
        className="fixed inset-0 z-40 cursor-default" />
      <nav
        className="absolute bottom-full left-0 right-0 z-50 mb-2 flex flex-col gap-px overflow-hidden border border-ink bg-ink"
        style={{ borderRadius: "var(--r-md)", transformOrigin: "bottom center",
                 animation: "sq-frame-in var(--dur-frame) var(--ease-out)" }}
      >
        {DESTS[i].shortcuts.map((s) => (
          <Link key={s.label} href={s.href} onClick={onClose}
            className="bg-surface px-3.5 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-ink active:bg-field-soft">
            {s.label}
          </Link>
        ))}
      </nav>
    </>
  );
}

function HoldRing({ ms }: { ms: number }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-[3px] border border-field-ink"
      style={{ borderRadius: "var(--r-sm)", animation: `sq-hold-ring ${ms}ms linear forwards` }} />
  );
}

/** Hub form: a full-width 2×2 launcher. Used where the screen is a list or a
 *  home and vertical space is not scarce. */
export function NavBlock() {
  const pathname = usePathname();
  const router = useRouter();
  const [fan, setFan] = useState<number | null>(null);
  const { holding, held, down, clear, HOLD_MS: ms } = useHold(setFan);
  const taught = useSyncExternalStore(subscribeTaught, getTaught, getTaughtServer);

  return (
    <div className="relative">
      {fan !== null ? <Fan i={fan} onClose={() => setFan(null)} /> : null}
      <nav aria-label="Sections" className="grid grid-cols-2" style={{ gap: "var(--tile-gap)" }}>
        {DESTS.map((d, i) => {
          const active = pathname === d.href;
          return (
            <Link
              key={d.href}
              href={d.href}
              aria-current={active ? "page" : undefined}
              onPointerDown={() => down(i)}
              onPointerUp={clear}
              onPointerLeave={clear}
              onPointerCancel={clear}
              onClick={(e) => {
                if (held.current) { e.preventDefault(); held.current = false; return; }
                setFan(null); router.push(d.href);
              }}
              className={cn(
                "relative flex flex-col items-center justify-center gap-2.5 border border-rule",
                "transition-colors active:scale-[0.985]",
                tileClass(active || i === 0, Boolean(d.accent)),
              )}
              style={{ height: "var(--tile-lg)", borderRadius: "var(--r-md)",
                       transitionDuration: "var(--dur-state)" }}
            >
              <Mark name={d.mark} size={26} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.09em]">
                {d.label}
              </span>
              {holding === i ? <HoldRing ms={ms} /> : null}
            </Link>
          );
        })}
      </nav>
      {!taught ? (
        <p className="t-data mt-2 text-center text-[10px] uppercase text-mute">
          Hold a tile for shortcuts
        </p>
      ) : null}
    </div>
  );
}

/** Compact form: four across, fixed to the bottom, 8px gutter on all three
 *  sides so it never touches the screen edge. Used on the map and on detail
 *  screens, where vertical space is the constraint. */
export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [fan, setFan] = useState<number | null>(null);
  const { holding, held, down, clear, HOLD_MS: ms } = useHold(setFan);

  return (
    <div
      className="fixed z-40"
      style={{ left: "var(--gutter)", right: "var(--gutter)",
               bottom: "calc(var(--gutter) + env(safe-area-inset-bottom))" }}
    >
      {fan !== null ? <Fan i={fan} onClose={() => setFan(null)} /> : null}
      <nav aria-label="Sections" className="grid grid-cols-4 gap-1.5">
        {DESTS.map((d, i) => {
          const active = pathname === d.href;
          return (
            <Link
              key={d.href}
              href={d.href}
              aria-current={active ? "page" : undefined}
              onPointerDown={() => down(i)}
              onPointerUp={clear}
              onPointerLeave={clear}
              onPointerCancel={clear}
              onClick={(e) => {
                if (held.current) { e.preventDefault(); held.current = false; return; }
                setFan(null); router.push(d.href);
              }}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 border border-rule",
                "transition-colors active:scale-[0.97]",
                tileClass(active, Boolean(d.accent)),
              )}
              style={{ height: "var(--bar-h)", borderRadius: "var(--r-md)",
                       transitionDuration: "var(--dur-state)" }}
            >
              <Mark name={d.mark} size={18} />
              <span className="text-[9px] font-semibold uppercase tracking-[0.07em]">
                {d.label}
              </span>
              {holding === i ? <HoldRing ms={ms} /> : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
