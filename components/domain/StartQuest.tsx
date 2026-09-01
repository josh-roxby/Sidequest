"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Action } from "@/components/primitives/Action";
import { Mark, type MarkName } from "@/components/primitives/Marks";
import { MapCanvas } from "@/components/map/MapCanvas";
import { QuestGenerating } from "./QuestGenerating";
import { ShapeChip } from "@/components/primitives/ShapeChip";
import { Data, Label } from "@/components/primitives/Text";
import { data, TIERS, type Quest, type QuestShape, type Tier } from "@/lib/data";
import { estimateDurationS, formatDistance, formatDuration } from "@/lib/walking";
import { cn } from "@/lib/cn";

const TIER_MARK: Record<Tier, MarkName> = {
  trot: "trot", stroll: "stroll", sidequest: "sidequest", adventure: "adventure",
};

type ShapePref = QuestShape | "either";

/** The default face of Quests: choose a length, choose a shape, get a walk
 *  from where you are standing. Everything else on this screen is secondary to
 *  that one action. */
export function StartQuest() {
  const router = useRouter();
  const [tier, setTier] = useState<Tier>("stroll");
  const [shape, setShape] = useState<ShapePref>("either");
  const [working, setWorking] = useState(false);
  const [pending, setPending] = useState<Quest | null>(null);
  const [result, setResult] = useState<Quest | null>(null);

  const spec = TIERS.find((t) => t.id === tier)!;

  /** The fetch and the animation run together, and the result is held back
   *  until the animation finishes. Planning a real route will take longer than
   *  a mock read, so the takeover is the floor rather than a fake delay: when
   *  routing is live it simply stays up until the work is actually done. */
  async function generate() {
    setWorking(true);
    setResult(null);
    const all = await data.getQuests(tier);
    const match = all.filter((q) => shape === "either" || q.shape === shape);
    setPending((match.length ? match : all)[0] ?? null);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {working ? (
        <QuestGenerating onDone={() => { setResult(pending); setPending(null); setWorking(false); }} />
      ) : null}

      {/* The map itself, not a picture of one: you are choosing a walk from
          where you are standing, so seeing your own ground and the tiles you
          have already cleared is the honest header for that decision. */}
      <div className="relative min-h-0 flex-1 overflow-hidden border border-rule"
        style={{ borderRadius: "var(--r-md)" }}>
        <MapCanvas interactive={false} initialScale={1.6}
          markers={[{ id: "you", x: 0, y: 0, kind: "you" }]} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
          style={{ background: "linear-gradient(to top, var(--paper) 12%, transparent)" }} />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <Label>You are in</Label>
          <h1 className="t-display mt-1 text-ink">Ennistymon</h1>
          <Data className="mt-1 block text-[11px] uppercase text-stone">
            Co. Clare · 46 points within reach
          </Data>
        </div>
      </div>

      <div className="shrink-0 pt-4">
        <Label>How long have you got</Label>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {TIERS.map((t) => {
            const on = tier === t.id;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={on}
                onClick={() => { setTier(t.id); setResult(null); }}
                className={cn(
                  "flex flex-col items-center gap-1 border px-1 py-2.5",
                  on ? "border-field bg-field text-field-ink" : "border-rule bg-surface text-stone",
                )}
                style={{ borderRadius: "var(--r-sm)", transition: "background-color var(--dur-state)" }}
              >
                <Mark name={TIER_MARK[t.id]} size={17} />
                <span className="text-[9px] font-semibold uppercase tracking-[0.05em]">
                  {t.label}
                </span>
                <span className="t-data text-[9px]">{t.duration}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Label className="shrink-0">Shape</Label>
          <div className="flex gap-1.5">
            {(["either", "loop", "line"] as ShapePref[]).map((s) => {
              const on = shape === s;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() => { setShape(s); setResult(null); }}
                  className={cn(
                    "border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em]",
                    on ? "border-field bg-field text-field-ink" : "border-rule bg-surface text-stone",
                  )}
                  style={{ borderRadius: "var(--r-full)" }}
                >
                  {s === "either" ? "Either" : s === "loop" ? "Loop" : "There and back"}
                </button>
              );
            })}
          </div>
        </div>

        {result ? (
          <button
            type="button"
            onClick={() => router.push(`/quests/${result.id}`)}
            className="mt-3 w-full border border-ink bg-surface p-3 text-left active:bg-field-soft"
            style={{ borderRadius: "var(--r-md)" }}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="t-h2 text-ink">{result.title}</p>
              <ShapeChip shape={result.shape} tip={false} />
            </div>
            <p className="t-small mt-1 text-stone">{result.flavour}</p>
            <Data className="mt-2 block text-[11px] uppercase text-field">
              {formatDistance(result.distanceM)} ·{" "}
              {formatDuration(estimateDurationS(result.distanceM, {
                surface: result.surface, ascentM: result.ascentM,
                dwellS: result.objectives.length * 240,
              }))}{" "}
              · {result.honesty[0]}
            </Data>
          </button>
        ) : null}

        <div className="mt-3">
          <Action loading={working} onClick={generate}>
            {result ? `Find another ${spec.label.toLowerCase()}` : `Start a ${spec.label.toLowerCase()}`}
          </Action>
        </div>
      </div>
    </div>
  );
}
