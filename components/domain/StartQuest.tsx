"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ThumbAction } from "@/components/shell/ThumbAction";
import { Mark, type MarkName } from "@/components/primitives/Marks";
import { MapView, type MapViewHandle } from "@/components/map/MapView";
import { DEFAULT_CENTRE } from "@/lib/map/project";
import { QuestGenerating } from "./QuestGenerating";
import { ShapeChip } from "@/components/primitives/ShapeChip";
import { Data, Label } from "@/components/primitives/Text";
import { data, TIERS, type Quest, type QuestShape, type Tier } from "@/lib/data";
import { estimateDurationS, formatDistance, formatDuration } from "@/lib/walking";
import { cn } from "@/lib/cn";
import { distanceM } from "@/lib/geo";
import { useAsync } from "@/hooks/use-async";
import { assembleQuest } from "@/lib/quest/assemble";
import { putGenerated } from "@/lib/quest/session";
import { getPosition } from "@/lib/location";
import type { Street } from "@/lib/map/streets";

const TIER_MARK: Record<Tier, MarkName> = {
  trot: "trot", stroll: "stroll", sidequest: "sidequest", adventure: "adventure",
};

type ShapePref = QuestShape | "either";

/** "Start an adventure", not "Start a adventure". Only the tier labels pass
 *  through here and none of them begin with a silent h or a long u, so the
 *  vowel test is enough. */
const article = (word: string) => ("aeiou".includes(word[0].toLowerCase()) ? "an" : "a");

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
  /** Why the last attempt produced no walk. A takeover that runs to a hundred
   *  per cent and then puts you back where you started, saying nothing, reads
   *  as a broken app: the walker did everything right and the screen simply
   *  gave up. So the two ways this can come back empty are states, not
   *  silence. */
  const [failed, setFailed] = useState<"none" | "empty" | "error">("none");
  /** Whether the takeover has played out. It is a floor on how long the wait
   *  lasts, not a timer the work has to beat: reading the streets off the map
   *  can take longer than the animation, and finishing the animation first used
   *  to mean the walker was dropped back where they started with nothing. */
  const [shown, setShown] = useState(false);
  /** The takeover is up while the work is in flight, and stays up through a
   *  failure until the animation has played out, so a walker never sees it
   *  vanish mid-sentence. */
  const takeover = working && !(shown && failed !== "none");

  const mapRef = useRef<MapViewHandle>(null);
  const spec = TIERS.find((t) => t.id === tier)!;
  const territory = useAsync(() => data.getTerritory(), []);
  const points = useAsync(() => data.getPointsNearby(), []);

  /* "Nearby" has to be measured, not assumed. The read hands back the whole
     corpus, so taking the first row put a Clare townland under a Dublin county
     heading. The nearest point names where you are, and the count is the ones
     inside this tier's reach, which is the radius the walk is actually built
     from. */
  const around = useMemo(() => {
    const all = points.data ?? [];
    if (all.length === 0) return { townland: null, within: 0 };
    const byDistance = all
      .map((p) => ({ p, d: distanceM(DEFAULT_CENTRE, { lat: p.lat, lng: p.lng }) }))
      .sort((a, b) => a.d - b.d);
    return {
      townland: byDistance[0].p.townland,
      within: byDistance.filter((x) => x.d <= spec.reachM).length,
    };
  }, [points.data, spec.reachM]);

  /** The fetch and the animation run together, and the result is held back
   *  until the animation finishes. Planning a real route will take longer than
   *  a mock read, so the takeover is the floor rather than a fake delay: when
   *  routing is live it simply stays up until the work is actually done. */
  async function generate() {
    setWorking(true);
    setShown(false);
    setResult(null);
    setFailed("none");
    setPending(null);
    try {
      /* Where the walker actually is, asked for here because this is a press.
         A refusal is not fatal: the walk is then built from the home position,
         which is at least the right county, and the card says so. What must
         not happen again is handing someone in Dublin a walk in Clare because
         it happened to be first in the list. */
      let at = DEFAULT_CENTRE;
      let located = false;
      try {
        const fix = await getPosition();
        at = { lat: fix.lat, lng: fix.lng };
        located = true;
      } catch {
        // Falls through to the home position, and says so on the card.
      }
      /* The preview map earns its keep here. Moving it to the walker and
         waiting for it to settle loads the basemap tiles for that ground, and
         those tiles carry the roads and paths the router needs. No tiles, no
         streets, and the walk falls back to geometry rather than failing. */
      let streets: Street[] = [];
      if (located) {
        try {
          /* The ground the walk will actually cover, not a comfortable zoom.
             Half the walk out in any direction, plus a margin, is the box the
             router needs a graph for. */
          streets = await mapRef.current?.loadAround(at, spec.maxM * 0.6) ?? [];
        } catch {
          // A map that will not load is a walk drawn geometrically, not an error.
        }
      }

      const all = await data.getPointsNearby();
      /* Fresh every press. The assembler is deterministic on purpose, so that
         reopening a walk gives back the same walk rather than a new one under
         the same heading; without a seed that also meant asking twice from the
         same spot always produced the same walk, which from a desk in Fairview
         was the Casino at Marino every single time. The seed is what makes the
         next press a different walk while the one in hand stays put. */
      const seed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const { quest } = assembleQuest({ from: at, tier, shape, points: all, streets, seed });

      /* Both facts ride on the walk rather than on this screen, because this
         screen is gone a second later and the walk is what the walker reads
         before setting off. Honesty lines are already shown in the brief. */
      const built: Quest = located ? quest : {
        ...quest,
        honesty: ["Built from your home area, not from a live fix", ...quest.honesty],
      };
      putGenerated(built);
      setPending(built);
    } catch {
      /* Without this the takeover stays up forever on a read that throws,
         which is a worse failure than the one it is covering. */
      setPending(null);
      setFailed("error");
    }
  }

  /* Derived rather than switched off, because the two things that end the wait
     arrive in either order: the animation finishing and the work producing an
     answer. Deriving it means neither has to know about the other, and nothing
     sets state from inside an effect to keep them in step. */
  useEffect(() => {
    if (takeover && shown && pending) router.push(`/quests/${pending.id}/walk`);
  }, [takeover, shown, pending, router]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Planning ends by putting you on the map for the walk it planned.
          Landing back on a picker with a card to tap would make the wait feel
          like a step rather than the start of something. */}
      {takeover ? <QuestGenerating onDone={() => setShown(true)} /> : null}

      {/* The map itself, not a picture of one: you are choosing a walk from
          where you are standing, so seeing your own ground and the tiles you
          have already cleared is the honest header for that decision. */}
      <div className="relative min-h-0 flex-1 overflow-hidden border border-rule"
        style={{ borderRadius: "var(--r-md)" }}>
        <MapView ref={mapRef} interactive={false} initialZoom={15.7}
          markers={[{ id: "you", ...DEFAULT_CENTRE, kind: "you" }]} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
          style={{ background: "linear-gradient(to top, var(--paper) 12%, transparent)" }} />
        {/* Read, not written into the markup. This said "Corofin, Co. Clare ·
            46 points within reach" as three hardcoded strings, which was a
            screen claiming to know something it had not looked up, and became
            plainly wrong the day the corpus moved to Dublin. */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <Label>You are in</Label>
          <h1 className="t-display mt-1 text-ink">
            {around.townland ?? territory.data?.county ?? "\u2014"}
          </h1>
          <Data className="mt-1 block text-[11px] uppercase text-stone">
            {territory.loading || points.loading
              ? "Reading the ground"
              : territory.data
                ? `${territory.data.county} · ${around.within} ${around.within === 1 ? "point" : "points"} within reach`
                : "Territory unavailable"}
          </Data>
        </div>
      </div>

      <div className="shrink-0 pb-[var(--tile)] pt-4">
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

        {/* Only once the takeover is out of the way. The fetch can fail while
            the animation is still running, and a card sitting behind it is
            just clutter waiting to be uncovered. */}
        {failed !== "none" && !takeover ? (
          <div
            role="status"
            className="mt-3 w-full border border-rule bg-surface p-3"
            style={{ borderRadius: "var(--r-md)" }}
          >
            <p className="t-h2 text-ink">
              {failed === "error"
                ? "That did not come back"
                : `No ${spec.label.toLowerCase()} near you yet`}
            </p>
            <p className="t-small mt-1 text-stone">
              {failed === "error"
                ? "Something went wrong reading the walks. Try again in a moment."
                : "There is nothing this long within reach. Pick another length above and we will look again."}
            </p>
          </div>
        ) : null}

        <ThumbAction loading={takeover} onClick={generate}>
          Start {article(spec.label)} {spec.label.toLowerCase()}
        </ThumbAction>
      </div>
    </div>
  );
}
