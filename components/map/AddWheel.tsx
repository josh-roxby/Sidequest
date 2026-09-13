"use client";
import { useEffect, useRef, useState } from "react";
import { Mark, type MarkName } from "@/components/primitives/Marks";
import { cn } from "@/lib/cn";

export interface WheelOption {
  id: string;
  label: string;
  glyph: MarkName;
}

/** The radial menu a long press opens on the map.
 *
 *  It opens around the thumb rather than in a corner, because the thumb is
 *  already where the walker is pointing and a menu that appears somewhere else
 *  makes them let go and start again. The centre circle marks the spot that was
 *  held, which is also where whatever they add will land, so the gesture and
 *  the result are the same place.
 *
 *  The options are circles on an arc rather than pie wedges. A wedge at thumb
 *  size is mostly empty at the inside and cramped at the outside, and there is
 *  nowhere honest to put a label; a circle is the same shape as every other map
 *  object in the app and is a bigger target for the same screen area.
 *
 *  The arc turns to face open screen. A press near the bottom right, which is
 *  where a right thumb naturally lands, would otherwise put half the options
 *  off the edge. */

/** Distance from the held point to the centre of an option. Far enough that the
 *  thumb does not cover the option it is choosing. */
const RADIUS = 96;
const OPTION = 60;
const CENTRE = 56;
/** How far the pointer must be from the centre before a choice counts. Inside
 *  this the walker is still on the spot they held, which means cancel. */
const DEAD_ZONE = 34;

export function AddWheel({
  at,
  options,
  onPick,
  onCancel,
}: {
  /** Where the thumb went down, in screen pixels within the map. */
  at: { x: number; y: number };
  options: WheelOption[];
  onPick: (id: string) => void;
  onCancel: () => void;
}) {
  const [active, setActive] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  /* Which way there is room to open. The arc is centred on the direction with
     the most space, so options never open off the edge of the screen. */
  const [spread, setSpread] = useState(0);
  useEffect(() => {
    const w = box.current?.clientWidth ?? 390;
    const h = box.current?.clientHeight ?? 844;
    /* Point the arc back towards the middle of the map. At the centre of the
       screen this is arbitrary and any direction is as good as another. */
    setSpread(Math.atan2(h / 2 - at.y, w / 2 - at.x));
  }, [at.x, at.y]);

  const placed = options.map((o, i) => {
    /* Fanned about the open direction, a fixed angle apart, so two options and
       five options both read as a fan rather than one being a wide sweep. Wide
       enough that neighbouring circles and their labels do not touch. */
    const step = Math.PI / 3;
    const angle = spread + (i - (options.length - 1) / 2) * step;
    return {
      ...o,
      x: at.x + Math.cos(angle) * RADIUS,
      y: at.y + Math.sin(angle) * RADIUS,
      /* The label sits further out along the same spoke rather than directly
         below its circle. Below, two neighbouring labels overlap as soon as the
         fan is tight; along the spoke they separate as the fan does. */
      lx: at.x + Math.cos(angle) * (RADIUS + 62),
      ly: at.y + Math.sin(angle) * (RADIUS + 62),
    };
  });

  function pointAt(clientX: number, clientY: number) {
    const rect = box.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function update(clientX: number, clientY: number) {
    const p = pointAt(clientX, clientY);
    if (!p) return;
    if (Math.hypot(p.x - at.x, p.y - at.y) < DEAD_ZONE) {
      setActive(null);
      return;
    }
    let best: string | null = null;
    let bestD = Infinity;
    for (const o of placed) {
      const d = Math.hypot(p.x - o.x, p.y - o.y);
      if (d < bestD) { bestD = d; best = o.id; }
    }
    /* Generous: anywhere nearer this option than the next one, out to well past
       the circle itself, counts. Requiring the thumb to land inside a 60px
       circle while it is also covering it is a poor bargain. */
    setActive(bestD < RADIUS ? best : null);
  }

  return (
    <div
      ref={box}
      className="gesture absolute inset-0 z-40"
      /* The press that opened this is still down, so the same gesture carries
         through: move to choose, lift to commit. Releasing anywhere else
         cancels, which is the escape hatch that needs no button. */
      onPointerMove={(e) => update(e.clientX, e.clientY)}
      onPointerUp={(e) => {
        update(e.clientX, e.clientY);
        const p = pointAt(e.clientX, e.clientY);
        if (!p) return onCancel();
        let best: string | null = null;
        let bestD = Infinity;
        for (const o of placed) {
          const d = Math.hypot(p.x - o.x, p.y - o.y);
          if (d < bestD) { bestD = d; best = o.id; }
        }
        if (Math.hypot(p.x - at.x, p.y - at.y) < DEAD_ZONE || bestD >= RADIUS || !best) {
          onCancel();
          return;
        }
        onPick(best);
      }}
      onPointerCancel={onCancel}
    >
      {/* Everything under the wheel dims, so the wheel reads as the only thing
          you can act on while it is open. */}
      <div className="absolute inset-0 bg-ink/20" />

      {/* Tracks from the held point out to each option. They make the thing
          read as one control rather than as scattered buttons. */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        {placed.map((o) => (
          <line
            key={o.id}
            x1={at.x} y1={at.y} x2={o.x} y2={o.y}
            stroke="var(--surface)"
            strokeWidth={active === o.id ? 3 : 1.5}
            strokeOpacity={active === o.id ? 0.9 : 0.45}
          />
        ))}
      </svg>

      {/* The spot that was held, and where the thing being added will land. */}
      <div
        aria-hidden
        className="pointer-events-none absolute border-2 border-surface bg-rust/30"
        style={{
          left: at.x, top: at.y, width: CENTRE, height: CENTRE,
          transform: "translate(-50%, -50%)",
          borderRadius: "var(--r-full)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bg-rust"
        style={{
          left: at.x, top: at.y, width: 10, height: 10,
          transform: "translate(-50%, -50%)",
          borderRadius: "var(--r-full)",
        }}
      />

      {placed.map((o) => (
        <span
          key={`${o.id}-label`}
          className={cn(
            "t-data pointer-events-none absolute whitespace-nowrap border px-1.5 py-0.5",
            "text-[9px] uppercase",
            active === o.id
              ? "border-field bg-field text-field-ink"
              : "border-rule bg-surface text-stone",
          )}
          style={{
            left: o.lx, top: o.ly,
            transform: "translate(-50%, -50%)",
            borderRadius: "var(--r-sm)",
          }}
        >
          {o.label}
        </span>
      ))}

      {placed.map((o) => (
        <div key={o.id} className="pointer-events-none absolute"
          style={{ left: o.x, top: o.y, transform: "translate(-50%, -50%)" }}>
          <div
            className={cn(
              "flex items-center justify-center border transition-transform",
              active === o.id
                ? "scale-110 border-field bg-field text-field-ink"
                : "border-rule bg-surface text-stone",
            )}
            style={{ width: OPTION, height: OPTION, borderRadius: "var(--r-full)" }}
          >
            <Mark name={o.glyph} size={22} />
          </div>
        </div>
      ))}
    </div>
  );
}
