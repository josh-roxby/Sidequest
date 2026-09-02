"use client";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { Mark } from "@/components/primitives/Marks";
import { NavDrawer } from "./NavDrawer";
import { QUADS, type QuadDir } from "@/lib/nav";
import { getTaught, getTaughtServer, markTaught, subscribeTaught } from "@/lib/taught";
import { useHanded, useSettings } from "@/lib/settings";
import { cn } from "@/lib/cn";

/** Release before this and it is a tap: the drawer opens. Reach it and the
 *  shortcut fan takes over.
 *
 *  Ambiguity between the two is no longer a risk at any threshold, because the
 *  tap runs off the native click rather than off pointerup. That frees this
 *  number to be tuned purely on feel, and 300ms is about as short as a hold
 *  can be while still reading as deliberate rather than as a slow tap. */
const HOLD_MS = 300;
/** Tile pitch: one tile plus one gap. The three shortcut tiles sit on this
 *  lattice around the anchor, forming a 2×2 with the button at bottom-right. */
const CELL = 64;
/** How far the thumb must travel before a direction counts. Below this the
 *  gesture is ambiguous and releasing cancels. */
const DEAD_ZONE = 22;

/** Lattice offsets for a right-handed button. Mirrored on x for left-handed,
 *  so the gesture is the same shape either way: up and away, up, and away. */
const OFFSET: Record<QuadDir, { x: number; y: number }> = {
  tl: { x: -CELL, y: -CELL },
  tr: { x: 0, y: -CELL },
  bl: { x: -CELL, y: 0 },
};

/** One button, bottom-right, carrying a surveyed-sheet glyph.
 *
 *  Tap opens the drawer. Press and hold fans three tiles onto the lattice
 *  around it, and you drag toward the one you want and release. Positions are
 *  fixed so it becomes muscle memory: up-left Map, up Quests, left Badges.
 *
 *  Drag-to-select rather than tap-the-fanned-tile, because the whole point is
 *  that it completes in one continuous gesture without lifting your thumb.
 *  Everything reachable this way is also in the drawer, so nothing is
 *  hold-only. docs/design-system.md §C. */
export function NavButton() {
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [quads, setQuads] = useState(false);
  const [aim, setAim] = useState<QuadDir | null>(null);
  const [pressing, setPressing] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const holdFired = useRef(false);
  const taught = useSyncExternalStore(subscribeTaught, getTaught, getTaughtServer);
  const handed = useHanded();
  const haptics = useSettings().haptics;
  const flip = handed === "left" ? -1 : 1;
  const off = (d: QuadDir) => ({ x: OFFSET[d].x * flip, y: OFFSET[d].y });

  const reset = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setPressing(false);
    setQuads(false);
    setAim(null);
    origin.current = null;
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    holdFired.current = false;
    origin.current = { x: e.clientX, y: e.clientY };
    setPressing(true);
    timer.current = setTimeout(() => {
      holdFired.current = true;
      setPressing(false);
      setQuads(true);
      markTaught();
      if (haptics) navigator.vibrate?.(8);
    }, HOLD_MS);
  }, [haptics]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!quads || !origin.current) return;
    const dx = e.clientX - origin.current.x;
    const dy = e.clientY - origin.current.y;
    if (Math.hypot(dx, dy) < DEAD_ZONE) { setAim(null); return; }
    // Nearest tile centre wins. Cheaper and far more forgiving than angle
    // wedges, which misfire near the boundaries.
    let best: QuadDir | null = null;
    let bestD = Infinity;
    for (const q of QUADS) {
      const o = off(q.dir);
      const d = Math.hypot(dx - o.x, dy - o.y);
      if (d < bestD) { bestD = d; best = q.dir; }
    }
    setAim((prev) => {
      if (prev !== best && haptics) navigator.vibrate?.(4);
      return best;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quads, haptics, flip]);

  /** Pointerup only resolves the hold. The tap path deliberately runs off the
   *  native click below, because click is the one gesture signal every browser
   *  agrees on: it survives the small thumb travel that a touch always has,
   *  and it fires after any pointer capture has been released. Driving the
   *  drawer off pointerup instead is what made a thumb tap unreliable. */
  const onPointerUp = useCallback(() => {
    if (!quads) { reset(); return; }
    const target = aim ? QUADS.find((q) => q.dir === aim) : null;
    reset();
    if (target) router.push(target.href);
  }, [quads, aim, reset, router]);

  const onClick = useCallback(() => {
    // A completed hold already acted; swallow the click it also produces.
    if (holdFired.current) { holdFired.current = false; return; }
    setDrawer(true);
  }, []);

  return (
    <>
      <NavDrawer open={drawer} onDismiss={() => setDrawer(false)} />

      {quads ? (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(22,24,26,0.18)" }}
          aria-hidden
        />
      ) : null}

      <div
        className="fixed z-40"
        style={{
          [handed === "left" ? "left" : "right"]: "var(--gutter)",
          bottom: "calc(var(--gutter) + env(safe-area-inset-bottom))",
        }}
      >
        {quads
          ? QUADS.map((q) => {
              const on = aim === q.dir;
              return (
                <span
                  key={q.dir}
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute flex flex-col items-center justify-center gap-1 border",
                    on ? "border-field bg-field text-field-ink" : "border-rule bg-surface text-stone",
                  )}
                  style={{
                    width: "var(--tile)",
                    height: "var(--tile)",
                    left: 0,
                    top: 0,
                    borderRadius: "var(--r-md)",
                    ["--qx" as string]: `${off(q.dir).x}px`,
                    ["--qy" as string]: `${off(q.dir).y}px`,
                    transform: `translate(${off(q.dir).x}px, ${off(q.dir).y}px) scale(${on ? 1.06 : 1})`,
                    animation: "sq-quad-in var(--dur-frame) var(--ease-out)",
                    transition: "transform var(--dur-state) var(--ease), background-color var(--dur-state)",
                  }}
                >
                  <Mark name={q.mark} size={16} />
                  <span className="text-[8px] font-semibold uppercase tracking-[0.06em]">
                    {q.label}
                  </span>
                </span>
              );
            })
          : null}

        {/* Sits above the button, never beside it. Beside it put the hint
            straight over whatever occupies the opposite bottom corner: the
            waypoint rail on a walk, the docked action on Home. It also carries
            its own surface, because unbacked type over the map canvas is not
            readable against hex fill. */}
        {!taught && !quads ? (
          <p className={cn(
            "t-data pointer-events-none absolute bottom-full mb-2 whitespace-nowrap border border-rule bg-surface px-2 py-1 text-[10px] uppercase leading-[1.5] text-mute",
            handed === "left" ? "left-0 text-left" : "right-0 text-right",
          )}
          style={{ borderRadius: "var(--r-sm)" }}>
            Tap for all<br />Hold and drag
          </p>
        ) : null}

        <button
          type="button"
          aria-label="Navigation"
          aria-haspopup="dialog"
          aria-expanded={drawer}
          className={cn(
            "gesture relative flex items-center justify-center border",
            quads || pressing ? "border-field bg-field text-field-ink" : "border-ink bg-surface text-ink",
          )}
          style={{
            width: "var(--tile)",
            height: "var(--tile)",
            borderRadius: "var(--r-md)",
            transition: "background-color var(--dur-state) var(--ease)",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={reset}
          onClick={onClick}
          onContextMenu={(e) => e.preventDefault()}
        >
          <Mark name="grid" size={22} />
          {pressing ? (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-[3px] border border-rust"
              style={{ borderRadius: "var(--r-sm)", animation: `sq-hold-ring ${HOLD_MS}ms linear forwards` }}
            />
          ) : null}
        </button>
      </div>
    </>
  );
}
