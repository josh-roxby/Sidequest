"use client";
import { useEffect, useState } from "react";
import { Data, Label } from "@/components/primitives/Text";

const STEPS = [
  "Reading the ground around you",
  "Finding what is worth reaching",
  "Routing a way there and back",
  "Checking surfaces and gates",
];

/** Full-screen takeover while a quest is planned.
 *
 *  The route draws itself: one stroked path per stage, revealed by animating
 *  stroke-dashoffset from its own length down to zero. That is the honest
 *  shape of the work, because planning really is anchor, then route, then
 *  check, and showing it in order makes three seconds feel like progress
 *  rather than a wait.
 *
 *  Stroke animation is GPU-friendly and runs off CSS, so nothing here competes
 *  with the fetch it is covering. */
export function QuestGenerating({ onDone, ms = 3000 }: { onDone: () => void; ms?: number }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      setPct(Math.round(k * 100));
      if (k < 1) raf = requestAnimationFrame(tick);
      else onDone();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ms, onDone]);

  const step = Math.min(STEPS.length - 1, Math.floor((pct / 100) * STEPS.length));

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-6 bg-paper px-8"
    >
      <svg width="180" height="180" viewBox="0 0 180 180" aria-hidden fill="none">
        {/* Hex field settling in */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (Math.PI / 3) * i - Math.PI / 6;
          return (
            <polygon
              key={i}
              points={hexPoints(90 + Math.cos(a) * 46, 90 + Math.sin(a) * 46, 26)}
              stroke="var(--rule)"
              strokeWidth="1"
              style={{
                opacity: 0,
                animation: `sq-fade-in 400ms var(--ease-out) ${200 + i * 90}ms forwards`,
              }}
            />
          );
        })}
        <polygon points={hexPoints(90, 90, 26)} stroke="var(--rule)" strokeWidth="1" />

        {/* The route, drawn stage by stage */}
        <path
          d="M46 120 C58 92, 82 76, 104 66"
          stroke="var(--field)" strokeWidth="2.5" strokeLinecap="square"
          pathLength={1} strokeDasharray={1}
          style={{ strokeDashoffset: 1, animation: `sq-draw ${ms * 0.42}ms linear 120ms forwards` }}
        />
        <path
          d="M104 66 C126 58, 140 76, 132 98"
          stroke="var(--field)" strokeWidth="2.5" strokeLinecap="square"
          pathLength={1} strokeDasharray={1}
          style={{ strokeDashoffset: 1, animation: `sq-draw ${ms * 0.26}ms linear ${ms * 0.44}ms forwards` }}
        />
        <path
          d="M132 98 C118 124, 76 136, 46 120"
          stroke="var(--field)" strokeWidth="2.5" strokeLinecap="square"
          strokeDasharray="6 5"
          pathLength={1}
          style={{ strokeDashoffset: 1, animation: `sq-draw ${ms * 0.28}ms linear ${ms * 0.7}ms forwards` }}
        />

        <rect x="41" y="115" width="10" height="10" fill="var(--rust)" />
        <rect x="99" y="61" width="10" height="10" fill="var(--field)"
          style={{ opacity: 0, animation: `sq-fade-in 300ms var(--ease-out) ${ms * 0.46}ms forwards` }} />
      </svg>

      <div className="flex flex-col items-center gap-2">
        <Data size="xl" className="text-ink">{String(pct).padStart(3, "0")}%</Data>
        <Label className="text-center">{STEPS[step]}</Label>
      </div>

      <div className="h-1 w-40 overflow-hidden bg-surface-2" style={{ borderRadius: "var(--r-full)" }}>
        <div className="h-full bg-field" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}
