"use client";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapView, type MapMarker, type MapViewHandle } from "@/components/map/MapView";
import { Action } from "@/components/primitives/Action";
import { Button } from "@/components/primitives/Button";
import { Mark } from "@/components/primitives/Marks";
import { Plate } from "@/components/primitives/Plate";
import { ShapeChip } from "@/components/primitives/ShapeChip";
import { Data, Label } from "@/components/primitives/Text";
import { EncounterList } from "@/components/domain/EncounterList";
import { Frame } from "@/components/shell/Frame";
import { data, type Objective, type Point, type LatLng } from "@/lib/data";
import { DEFAULT_CENTRE } from "@/lib/map/project";
import { estimateDurationS, formatDistance, formatDuration } from "@/lib/walking";
import { useAsync } from "@/hooks/use-async";
import { useVisited } from "@/hooks/use-visited";
import { useRoutedQuest } from "@/hooks/use-routed-quest";
import { arrivedAt, emptyTrack, extend } from "@/lib/quest/track";
import { recordWalk, walkRecordFrom } from "@/lib/walk/history";
import { cn } from "@/lib/cn";

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
  /* Where the walker actually is, once they have asked to be placed. Until
     then the start of the route is the honest stand-in. */
  const [here, setHere] = useState<LatLng | null>(null);
  /* The walk as it happens. `track` is ground actually covered, summed between
     fixes; `arrived` is the places reached by being at them. Both used to come
     off `objectives.reached`, a flag on a fixture that nothing ever set, so
     the card read 0 M for the whole walk however far anybody went. */
  const [track, setTrack] = useState(emptyTrack);
  const [arrived, setArrived] = useState<Set<string>>(() => new Set());
  /* Ground covered on earlier walks, already lit when the screen opens. */
  const [visited, unlock] = useVisited();
  /* When Set off was pressed, and the cells this walk in particular earned.
     The visited set is every walk ever, so it cannot answer "what did today
     get me", which is the number the history row wants. */
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const gained = useRef<Set<string>>(new Set());

  const map = useRef<MapViewHandle>(null);
  /* The walk as written is an arc across the ground. Once the basemap has the
     ways under it, the same router that draws a generated walk redraws this
     one, so the line on the screen is one a walker can actually follow. */
  const { quest: q, onMapReady } = useRoutedQuest(quest.data, map);

  /* Held in a ref so the fix handler never has to be rebuilt when the walk
     is re-cut onto real streets. A new handler identity there would mean a
     new prop on the map on the one render that matters least. */
  const questRef = useRef(q);
  useEffect(() => { questRef.current = q; }, [q]);
  const trackRef = useRef(track);
  useEffect(() => { trackRef.current = track; }, [track]);

  /** Reached by having been there, or by the fixture already saying so for a
   *  walk somebody took before this screen could tell. */
  const isReached = useCallback(
    (o: Objective) => arrived.has(o.id) || o.reached, [arrived]);

  /** Every fix while the walk is live: where the walker is, how far they have
   *  come, and anything they are now standing at. The map owns the watch and
   *  the camera; this owns what the walk makes of it. */
  const onFix = useCallback((p: LatLng) => {
    setHere(p);
    setTrack((t) => extend(t, p));
    const objectives = questRef.current?.objectives ?? [];
    const at = arrivedAt(objectives, p);
    if (at.length === 0) return;
    setArrived((prev) => {
      const next = at.filter((id) => !prev.has(id));
      return next.length === 0 ? prev : new Set([...prev, ...next]);
    });
  }, []);

  /** Setting off is what starts the watch.
   *
   *  Not the page load. The rule is that the browser's own prompt never fires
   *  on a load, and this is the press it hangs off: the walker has read the
   *  brief and pressed Set off. In practice the permission is already granted
   *  by then, because a walk cannot be generated without a fix, so no prompt
   *  appears at all and the pin simply starts following.
   *
   *  `locate` on the map does all of it: first fix, heading, the continuous
   *  watch, the camera, and a cell unlock every time the walker crosses into
   *  new ground. The screen only had to ask. */
  const setOff = useCallback(() => {
    setBriefed(true);
    setStartedAt(Date.now());
    map.current?.locate();
  }, []);

  /** Cells go to the store, which is every walk ever, and to this walk's own
   *  tally, which is what the history row reports. */
  const onUnlock = useCallback((cell: string) => {
    gained.current.add(cell);
    unlock(cell);
  }, [unlock]);

  /** Ending it is what writes it down.
   *
   *  Recorded before the navigation rather than after, because the screen is
   *  gone a frame later and an effect on the way out is a race. Ending the
   *  same walk twice, which a double press will do, overwrites one row rather
   *  than adding a second. */
  const endWalk = useCallback(() => {
    const walk = questRef.current;
    if (walk && startedAt !== null) {
      recordWalk(walkRecordFrom({
        quest: walk,
        walkedM: trackRef.current.metres,
        startedAt,
        endedAt: Date.now(),
        tilesGained: gained.current.size,
      }), walk);
    }
    router.push("/history");
  }, [router, startedAt]);

  const markers = useMemo<MapMarker[]>(() => {
    const you = here ?? (q ? { lat: q.path[0][1], lng: q.path[0][0] } : DEFAULT_CENTRE);
    if (!q) return [{ id: "you", ...you, kind: "you" }];
    return [
      { id: "you", ...you, kind: "you" as const },
      ...q.objectives.map((o) => ({
        id: o.id, lat: o.lat, lng: o.lng,
        kind: (isReached(o) ? "objective-done" : "objective") as MapMarker["kind"],
        label: o.label,
      })),
    ];
  }, [q, here, isReached]);

  const trail = useMemo<[number, number][]>(
    () => (q?.path ?? []),
    [q],
  );

  /** Everything the walker needs on screen at the start: the route and every
   *  waypoint on it. */
  const fitPoints = useMemo(
    () => [
      ...(q?.path ?? []).map(([lng, lat]) => ({ lat, lng })),
      ...(q?.objectives ?? []).map((o) => ({ lat: o.lat, lng: o.lng })),
    ],
    [q],
  );

  const point = (o: Objective): Point | undefined =>
    (points.data ?? []).find((p) => p.id === o.pointId);

  /** The point behind the open waypoint, resolved once rather than looked up
   *  five times inside the drawer's markup. */
  const openPoint = openObj ? point(openObj) : undefined;

  const doneCount = q?.objectives.filter(isReached).length ?? 0;
  const totalS = q ? estimateDurationS(q.distanceM, {
    surface: q.surface, ascentM: q.ascentM, dwellS: q.objectives.length * 240,
  }) : 0;
  /* Ground actually covered, not the furthest waypoint ticked off. */
  const walkedM = Math.round(track.metres);

  /** Pinned at submission, not at typing. The pin should mark where you
   *  actually stopped, and people write for a minute after they stop walking. */
  async function saveNote() {
    if (!q || !noteText.trim()) return;
    await data.addNote({
      walkId: "w-active",
      questTitle: q.title,
      text: noteText.trim(),
      atM: walkedM,
      /* Pinned at the start until the live position lands in slice 6. */
      lat: q.path[0][1],
      lng: q.path[0][0],
    });
    setNoteText("");
    setNoting(false);
    setNoteCount((n) => n + 1);
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <MapView ref={map} markers={markers} trail={trail}
        onReady={onMapReady}
        fit={fitPoints}
        home={q?.path[0] ? { lat: q.path[0][1], lng: q.path[0][0] } : undefined}
        /* Without this the camera flew to the walker and the dot stayed at the
           quest start, so pressing locate moved the map away from the only mark
           that answers "where am I". */
        onLocate={onFix}
        visited={visited}
        onUnlock={onUnlock}
        controls={
          <>
            <button
              type="button"
              onClick={() => setEnding(true)}
              aria-label="End walk"
              className="flex h-11 w-11 items-center justify-center border border-rust bg-rust text-field-ink active:scale-[0.97]"
              style={{ borderRadius: "var(--r-full)" }}
            >
              <Mark name="flag" size={17} />
            </button>
            <button
              type="button"
              onClick={() => setNoting(true)}
              aria-label="Write a note"
              className="relative flex h-11 w-11 items-center justify-center border border-rule bg-surface text-stone active:scale-[0.97]"
              style={{ borderRadius: "var(--r-full)" }}
            >
              <Mark name="note" size={17} />
              {noteCount > 0 ? (
                <span aria-hidden className="absolute right-1.5 top-1.5 h-1.5 w-1.5 bg-field"
                  style={{ borderRadius: "var(--r-full)" }} />
              ) : null}
            </button>
          </>
        } />

      {/* Opens once, on arrival, so you set off knowing roughly what is out
          there without having read the whole walk in advance. */}
      <Frame
        open={Boolean(q) && !briefed}
        onDismiss={setOff}
        ratio="tall"
        label={`${formatDistance(q?.distanceM ?? 0)} · ${formatDuration(totalS)}`}
        title={q?.title ?? ""}
        action={<Action onClick={setOff}>Set off</Action>}
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
        action={<Action tone="rust" onClick={endWalk}>End walk</Action>}
      >
        <p className="t-body text-ink">
          You have covered {formatDistance(walkedM)} of {formatDistance(q?.distanceM ?? 0)}.
        </p>
        <p className="t-small mt-2 text-stone">
          The ground you covered is kept. Ending early costs you nothing you
          have already walked for.
        </p>
      </Frame>

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
