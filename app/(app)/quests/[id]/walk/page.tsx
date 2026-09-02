"use client";
import { useRouter } from "next/navigation";
import { use, useMemo, useState } from "react";
import { MapCanvas, type MapMarker } from "@/components/map/MapCanvas";
import { Action } from "@/components/primitives/Action";
import { Button } from "@/components/primitives/Button";
import { Mark } from "@/components/primitives/Marks";
import { Plate } from "@/components/primitives/Plate";
import { ShapeChip } from "@/components/primitives/ShapeChip";
import { Data, Label } from "@/components/primitives/Text";
import { EncounterList } from "@/components/domain/EncounterList";
import { Frame } from "@/components/shell/Frame";
import { data, type Objective, type Point } from "@/lib/data";
import { estimateDurationS, formatDistance, formatDuration } from "@/lib/walking";
import { useAsync } from "@/hooks/use-async";
import { cn } from "@/lib/cn";

const SPAN_M = 2000;
const toWorld = (n: number) => (n - 0.5) * SPAN_M;

/** The walk itself: the map takes the screen and the quest sits over it.
 *
 *  Points along the route show a name and one line until you have actually
 *  been inside their tile. The detail is the reward for going, not something
 *  you can read on the sofa and skip the walk for. */
export default function WalkScreen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const quest = useAsync(() => data.getQuest(id), [id]);
  const points = useAsync(() => data.getPointsNearby(), []);
  const [openObj, setOpenObj] = useState<Objective | null>(null);
  const [ending, setEnding] = useState(false);
  const [briefed, setBriefed] = useState(false);
  const [noting, setNoting] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteCount, setNoteCount] = useState(0);

  const q = quest.data;

  const markers = useMemo<MapMarker[]>(() => {
    if (!q) return [{ id: "you", x: 0, y: 0, kind: "you" }];
    return [
      { id: "you", x: toWorld(q.path[0][0]), y: toWorld(q.path[0][1]), kind: "you" as const },
      ...q.objectives.map((o) => ({
        id: o.id, x: toWorld(o.x), y: toWorld(o.y),
        kind: (o.reached ? "objective-done" : "objective") as MapMarker["kind"],
        label: o.label,
      })),
    ];
  }, [q]);

  const trail = useMemo<[number, number][]>(
    () => (q?.path ?? []).map(([x, y]) => [toWorld(x), toWorld(y)]),
    [q],
  );

  const point = (o: Objective): Point | undefined =>
    (points.data ?? []).find((p) => p.id === o.pointId);

  /** The point behind the open waypoint, resolved once rather than looked up
   *  five times inside the drawer's markup. */
  const openPoint = openObj ? point(openObj) : undefined;

  const doneCount = q?.objectives.filter((o) => o.reached).length ?? 0;
  const totalS = q ? estimateDurationS(q.distanceM, {
    surface: q.surface, ascentM: q.ascentM, dwellS: q.objectives.length * 240,
  }) : 0;
  const walkedM = q ? Math.max(...q.objectives.filter((o) => o.reached).map((o) => o.atM), 0) : 0;

  /** Pinned at submission, not at typing. The pin should mark where you
   *  actually stopped, and people write for a minute after they stop walking. */
  async function saveNote() {
    if (!q || !noteText.trim()) return;
    await data.addNote({
      walkId: "w-active",
      questTitle: q.title,
      text: noteText.trim(),
      atM: walkedM,
      x: q.path[0][0],
      y: q.path[0][1],
    });
    setNoteText("");
    setNoting(false);
    setNoteCount((n) => n + 1);
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <MapCanvas markers={markers} trail={trail} initialScale={1.3} />

      {/* Opens once, on arrival, so you set off knowing roughly what is out
          there without having read the whole walk in advance. */}
      <Frame
        open={Boolean(q) && !briefed}
        onDismiss={() => setBriefed(true)}
        ratio="tall"
        label={`${formatDistance(q?.distanceM ?? 0)} · ${formatDuration(totalS)}`}
        title={q?.title ?? ""}
        action={<Action onClick={() => setBriefed(true)}>Set off</Action>}
      >
        <div className="flex flex-col gap-3">
          <p className="t-body text-ink">{q?.flavour}</p>
          <Label>What you might run into</Label>
          {q ? <EncounterList encounters={q.encounters} /> : null}
          <p className="t-small text-stone">
            Anything marked maybe is exactly that. Opening hours are the one
            thing we cannot promise, so nothing here depends on them.
          </p>
        </div>
      </Frame>

      {/* Progress, top left. Everything a walker needs at a glance and
          nothing they do not. */}
      <div
        className="absolute border border-ink bg-surface px-3 py-2.5"
        style={{ left: "var(--gutter)", top: "calc(env(safe-area-inset-top) + var(--gutter))",
                 right: "calc(var(--gutter) + 52px)", borderRadius: "var(--r-md)" }}
      >
        {q ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <Label style={{ fontSize: 9 }}>Walking</Label>
              <ShapeChip shape={q.shape} tip={false} />
            </div>
            <p className="t-h2 mt-1 text-ink">{q.title}</p>
            <Data className="mt-1 block text-[11px] uppercase text-stone">
              {formatDistance(walkedM)} of {formatDistance(q.distanceM)} ·{" "}
              {formatDuration(totalS)} total · {doneCount}/{q.objectives.length} points
            </Data>
            <div className="mt-2 h-1 w-full bg-surface-2">
              <div className="h-full bg-field"
                style={{ width: `${(walkedM / q.distanceM) * 100}%` }} />
            </div>
          </>
        ) : null}
      </div>

      {/* Points along the way, in route order, clear of the nav button. */}
      <div
        className="gesture absolute flex gap-2 overflow-x-auto"
        style={{ left: 0, right: 0, paddingLeft: "var(--gutter)",
                 paddingRight: "calc(var(--gutter) + var(--tile) + var(--s-2))",
                 bottom: "calc(var(--gutter) + env(safe-area-inset-bottom))",
                 scrollbarWidth: "none", touchAction: "pan-x" }}
      >
        {(q?.objectives ?? []).map((o, i) => {
          const p = point(o);
          return (
            <button
              key={o.id}
              type="button"
              /* Only a waypoint you have stood in opens. There is nothing
                 behind an unreached one but the line already on its face, and
                 a tap that opens a card saying "not yet" teaches the walker to
                 stop tapping. It stays on the rail, dimmed, because seeing
                 what is coming is the point of the rail. */
              onClick={o.reached ? () => setOpenObj(o) : undefined}
              disabled={!o.reached}
              aria-label={o.reached ? o.label : `${o.label}, not reached yet`}
              className={cn(
                "w-[190px] shrink-0 select-none overflow-hidden border bg-surface p-2.5 text-left",
                o.reached
                  ? "border-field active:scale-[0.99]"
                  : "border-dashed border-rule opacity-45",
              )}
              style={{ borderRadius: "var(--r-md)", transitionDuration: "var(--dur-tap)" }}
            >
              {/* No plate. We will not have artwork for every point in the
                  country, and a waypoint card that is mostly a placeholder
                  reads as broken rather than as unfinished. The index and the
                  distance carry the structure instead. */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-stone">
                  <Mark name={o.reached ? "badge" : p?.group ?? "flag"} size={12} />
                  <Data className="text-[9px] uppercase">
                    {String(i + 1).padStart(2, "0")}
                  </Data>
                </div>
                <Data className="text-[9px] uppercase text-mute">
                  {formatDistance(o.atM)} in
                </Data>
              </div>
              <p className="mt-1.5 text-[12px] font-semibold leading-tight text-ink">{o.label}</p>
              <p className="t-small mt-0.5 line-clamp-2 text-stone">
                {o.reached
                  ? p?.lore[0]?.title ?? "You have been here."
                  : p?.blurb ?? "Details unlock when you arrive."}
              </p>
            </button>
          );
        })}
      </div>

      <Frame
        open={openObj !== null}
        onDismiss={() => setOpenObj(null)}
        ratio="tall"
        label={openPoint?.category ?? "Waypoint"}
        title={openObj?.label ?? ""}
        action={openPoint?.lore.length
          ? <Button tone="outline" onClick={() => router.push(`/tales/t-1`)}>Read the tale</Button>
          : null}
      >
        {openObj ? (
          <div className="-mx-4 -mt-3.5 flex flex-col">
            {/* Collapses when there is no artwork, so a point we have never
                illustrated opens as a finished card of type rather than a
                caption under an empty frame. */}
            <Plate ratio="16/9" plate={openPoint?.plate} collapse
              className="rounded-none border-0 border-b border-rule" />
            <div className="selectable flex flex-col gap-2 px-4 pt-3.5">
              <Data className="text-[10px] uppercase text-mute">
                {formatDistance(openObj.atM)} in · {openPoint?.townland}
              </Data>
              {openPoint?.nameGa ? (
                <p className="t-body italic text-ink">{openPoint.nameGa}</p>
              ) : null}
              <p className="t-body text-ink">
                {openPoint?.lore[0]?.body ?? openPoint?.blurb}
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {(openPoint?.tags ?? []).map((t) => (
                  <span key={t}
                    className="border border-rule bg-surface-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.05em] text-stone"
                    style={{ borderRadius: "var(--r-full)" }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Frame>

      <Frame
        open={ending}
        onDismiss={() => setEnding(false)}
        label="End here?"
        title={q?.title ?? ""}
        action={<Action tone="rust" onClick={() => router.push("/history")}>End walk</Action>}
      >
        <p className="t-body text-ink">
          You have covered {formatDistance(walkedM)} of {formatDistance(q?.distanceM ?? 0)}.
        </p>
        <p className="t-small mt-2 text-stone">
          Every tile you uncovered stays uncovered. Ending early costs you nothing
          you have already walked for.
        </p>
      </Frame>

      {/* End walk and notes live beside the nav button rather than replacing
          it, so the rest of the app stays reachable mid-walk. */}
      <div className="absolute flex flex-col gap-1.5"
        style={{ right: "var(--gutter)", top: "calc(env(safe-area-inset-top) + var(--gutter))" }}>
        <button
          type="button"
          onClick={() => setEnding(true)}
          aria-label="End walk"
          className="flex h-11 w-11 items-center justify-center border border-rust bg-rust text-field-ink active:scale-[0.97]"
          style={{ borderRadius: "var(--r-sm)" }}
        >
          <Mark name="flag" size={17} />
        </button>
        <button
          type="button"
          onClick={() => setNoting(true)}
          aria-label="Write a note"
          className="relative flex h-11 w-11 items-center justify-center border border-rule bg-surface text-stone active:scale-[0.97]"
          style={{ borderRadius: "var(--r-sm)" }}
        >
          <Mark name="note" size={17} />
          {noteCount > 0 ? (
            <span aria-hidden className="absolute right-1 top-1 h-1.5 w-1.5 bg-field" />
          ) : null}
        </button>
      </div>

      <Frame
        open={noting}
        onDismiss={() => setNoting(false)}
        label={`Pinned at ${formatDistance(walkedM)} in`}
        title="Note this"
        action={
          <Action onClick={saveNote} disabled={!noteText.trim()}>Pin it here</Action>
        }
      >
        <div className="flex flex-col gap-3">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={5}
            placeholder="A heron on the stream. The gate that sticks. Whatever you want to remember."
            className="selectable w-full resize-none border border-ink bg-surface p-3 text-[15px] leading-snug text-ink placeholder:text-mute"
            style={{ borderRadius: "var(--r-sm)" }}
          />
          <p className="t-small text-stone">
            Pinned where you are when you press, so it marks the spot rather
            than wherever you finish. Notes turn up on the walk afterwards and
            in your profile.
          </p>
        </div>
      </Frame>
    </div>
  );
}
