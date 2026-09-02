"use client";
import { useMemo, useState } from "react";
import { MapCanvas, type MapMarker } from "@/components/map/MapCanvas";
import { Frame } from "@/components/shell/Frame";
import { Action } from "@/components/primitives/Action";
import { Mark } from "@/components/primitives/Marks";
import { MapDock } from "@/components/map/MapDock";
import { MapAdd, type AddMode } from "@/components/map/MapAdd";
import { Plate } from "@/components/primitives/Plate";
import { Data, Label } from "@/components/primitives/Text";
import { Skeleton, StatusStrip } from "@/components/primitives/States";
import { data, type CommunityPoint, type Note, type Point } from "@/lib/data";
import { hexAt } from "@/lib/map/hex";
import { useAsync } from "@/hooks/use-async";
import { useSettings } from "@/lib/settings";

/** Fixtures carry normalised 0–1 positions. The canvas works in metres, so
 *  one place converts and everything downstream is world space. */
const SPAN_M = 2000;
const toWorld = (n: number) => (n - 0.5) * SPAN_M;

export default function MapScreen() {
  const territory = useAsync(() => data.getTerritory(), []);
  const points = useAsync(() => data.getPointsNearby(), []);
  const quests = useAsync(() => data.getQuests("stroll"), []);
  const [refresh, setRefresh] = useState(0);
  const notes = useAsync(() => data.getNotes(), [refresh]);
  const cpoints = useAsync(() => data.getCommunityPoints(), [refresh]);
  const [openNote, setOpenNote] = useState<Note | null>(null);
  const [openCp, setOpenCp] = useState<CommunityPoint | null>(null);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const settings = useSettings();
  const [open, setOpen] = useState<Point | null>(null);
  const [tale, setTale] = useState(false);
  const [layers, setLayers] = useState<Record<string, boolean>>({
    fog: true, trail: true, points: true, quests: true, notes: true, community: true,
  });
  // The setting is the ceiling, the toggle is the switch underneath it. Turning
  // community points off in settings hides them everywhere without needing the
  // dock toggle to agree.
  const showCommunity = settings.showCommunity && layers.community;

  const markers = useMemo<MapMarker[]>(() => {
    const pts = (points.data ?? []).map((p) => ({
      id: p.id, x: toWorld(p.x), y: toWorld(p.y), kind: "point" as const, label: p.name,
    }));
    const noteMarks = (notes.data ?? []).map((n) => ({
      id: `note-${n.id}`, x: toWorld(n.x), y: toWorld(n.y), kind: "note" as const,
    }));
    const cpMarks = (cpoints.data ?? []).map((c) => ({
      id: `cp-${c.id}`, x: toWorld(c.x), y: toWorld(c.y), kind: "community" as const,
    }));
    return [{ id: "you", x: 0, y: 0, kind: "you" as const }, ...pts, ...noteMarks, ...cpMarks];
  }, [points.data, notes.data, cpoints.data]);

  const trail = useMemo<[number, number][]>(
    () => (quests.data?.[0]?.path ?? []).map(([x, y]) => [toWorld(x), toWorld(y)]),
    [quests.data],
  );

  /** Tiles holding a quest start, so available quests read as territory
   *  rather than as pins floating above it. */
  const questTiles = useMemo<[number, number][]>(
    () => (quests.data ?? []).map((q) => {
      const [x, y] = q.path[0];
      const h = hexAt(toWorld(x), toWorld(y), 90);
      return [h.q, h.r] as [number, number];
    }),
    [quests.data],
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      <MapCanvas
        markers={markers}
        trail={trail}
        questTiles={questTiles}
        hidden={[
          layers.points ? null : "point",
          layers.notes ? null : "note",
          showCommunity ? null : "community",
          layers.trail ? null : "trail",
          layers.quests ? null : "quests",
        ].filter(Boolean) as string[]}
        onMarker={(id) => {
          if (id.startsWith("note-")) {
            setOpenNote((notes.data ?? []).find((n) => `note-${n.id}` === id) ?? null);
            return;
          }
          if (id.startsWith("cp-")) {
            setOpenCp((cpoints.data ?? []).find((c) => `cp-${c.id}` === id) ?? null);
            return;
          }
          const p = (points.data ?? []).find((x) => x.id === id);
          if (p) setOpen(p);
        }}
      />

      <div
        className="pointer-events-none absolute border border-ink bg-surface px-2.5 py-2"
        style={{ left: "var(--gutter)", top: "calc(env(safe-area-inset-top) + var(--gutter))",
                 borderRadius: "var(--r-md)" }}
      >
        {territory.loading ? (
          <Skeleton h={30} />
        ) : territory.error ? (
          <Data className="text-[11px] uppercase text-stone">Territory unavailable</Data>
        ) : (
          <>
            <Label style={{ fontSize: 9 }}>{territory.data?.county}</Label>
            <Data className="mt-0.5 block text-ink">
              {territory.data?.tiles.toLocaleString()} TILES · {territory.data?.townlands} TOWNLANDS
            </Data>
          </>
        )}
      </div>

      {points.error ? (
        <div className="absolute inset-x-0" style={{ top: "calc(env(safe-area-inset-top) + 74px)" }}>
          <StatusStrip>Map points unavailable. Territory is still yours.</StatusStrip>
        </div>
      ) : null}

      <MapDock
        region={territory.data?.county ?? "In view"}
        tilesInView={{ revealed: territory.data?.tiles ?? 0, total: 4200 }}
        points={(points.data ?? []).map((p) => ({
          id: p.id, name: p.name, category: p.category, unlocked: p.lore.length > 0,
        }))}
        badges={[
          { label: "Rath finder", progress: 3, target: 5 },
          { label: "Well read", progress: 7, target: 20 },
          { label: "Parish bounds", progress: 14, target: 25 },
        ]}
        notes={notes.data ?? []}
        onNote={(id) => setOpenNote((notes.data ?? []).find((n) => n.id === id) ?? null)}
        onAdd={setAddMode}
        layers={layers}
        onLayer={(k, on) => setLayers((l) => ({ ...l, [k]: on }))}
        onPoint={(id) => {
          const p = (points.data ?? []).find((x) => x.id === id);
          if (p) setOpen(p);
        }}
      />

      <Frame
        open={open !== null && !tale}
        onDismiss={() => setOpen(null)}
        ratio="tall"
        label={open?.category ?? ""}
        title={open?.name ?? ""}
      >
        {open ? (
          <div className="-mx-4 -mt-3.5 flex flex-col">
            {/* Full-bleed plate, then the name, then the tags. The picture is
                what tells you whether it is worth the walk, so it goes first
                and it goes edge to edge. */}
            <Plate ratio="16/9" plate={open.plate} collapse
              className="rounded-none border-0 border-b border-rule" />
            <div className="flex flex-col gap-2 px-4 pt-3.5">
              {open.nameGa ? (
                <p className="t-body italic text-ink">{open.nameGa}</p>
              ) : null}
              <p className="t-small text-stone">Townland of {open.townland}</p>
              <p className="selectable t-body text-ink">{open.blurb}</p>

              {/* The tale reads inline as a snippet rather than behind a
                  button: one more tap to reach three sentences is a tax, not
                  a feature. The full tale is still gated on arrival. */}
              {open.visited && open.lore[0] ? (
                <div className="mt-1 border-l-2 border-field pl-3">
                  <Label style={{ fontSize: 9 }}>{open.lore[0].kind}</Label>
                  <p className="t-h2 mt-1 text-ink">{open.lore[0].title}</p>
                  <p className="selectable t-small mt-1 line-clamp-4 text-stone">
                    {open.lore[0].body}
                  </p>
                  <button type="button" onClick={() => setTale(true)}
                    className="t-small mt-1.5 font-semibold text-field underline">
                    The rest of the tale
                  </button>
                </div>
              ) : (
                <div className="mt-1 border-l-2 border-rule pl-3">
                  <Label style={{ fontSize: 9 }}>Tale locked</Label>
                  <p className="t-small mt-1 text-stone">
                    Walk into this tile and its story opens: what the name means,
                    what is standing there, who put it there.
                  </p>
                </div>
              )}

              <div className="mt-1 flex flex-wrap gap-1.5">
                {open.tags.map((t) => (
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

      {/* Rendered at the top level, outside every positioned container, so the
          frames are not trapped in the dock's stacking context. */}
      <MapAdd
        mode={addMode}
        setMode={setAddMode}
        quests={quests.data ?? []}
        at={{ x: 0.5, y: 0.5 }}
        onAdded={() => setRefresh((n) => n + 1)}
      />

      <Frame
        open={openNote !== null}
        onDismiss={() => setOpenNote(null)}
        label={openNote?.questTitle ?? "On the map"}
        title="Your note"
      >
        {openNote ? (
          <div className="flex flex-col gap-3">
            <p className="selectable t-body text-ink">{openNote.text}</p>
            <div className="flex flex-col gap-1 border-t border-rule pt-3">
              <Data className="text-[11px] uppercase text-stone">
                Written {openNote.createdAt}
              </Data>
              <Data className="text-[11px] uppercase text-mute">
                {openNote.questTitle
                  ? `On ${openNote.questTitle}`
                  : "Not attached to a quest"}
              </Data>
            </div>
          </div>
        ) : null}
      </Frame>

      <Frame
        open={openCp !== null}
        onDismiss={() => setOpenCp(null)}
        label={openCp?.status === "approved" ? "Community point" : "Waiting on review"}
        title={openCp?.title ?? ""}
      >
        {openCp ? (
          <div className="flex flex-col gap-3">
            <p className="selectable t-body text-ink">{openCp.description}</p>
            <div className="flex items-center gap-1.5 text-mute">
              <Mark name="user" size={12} />
              <Data className="text-[10px] uppercase">
                Added by {openCp.author} · {openCp.createdAt}
              </Data>
            </div>
            <p className="t-small border-t border-rule pt-3 text-stone">
              Once reviewed this will be available for every sidequester.
            </p>
            {openCp.status !== "approved" ? (
              <p className="t-small border-l-2 border-rust pl-3 text-stone">
                Only you can see this one for now.
              </p>
            ) : null}
          </div>
        ) : null}
      </Frame>

      <Frame
        open={tale}
        onDismiss={() => setTale(false)}
        ratio="tall"
        label="The tale"
        title={open?.name ?? ""}
        action={<Action tone="outline" onClick={() => setTale(false)}>Back to the map</Action>}
      >
        <div className="selectable flex flex-col gap-5">
          {open?.lore.map((l) => (
            <article key={l.title} className="flex flex-col gap-1.5">
              <Label>{l.kind}</Label>
              <h3 className="t-h2 text-ink">{l.title}</h3>
              {/* Share-alike and non-commercial sources are outbound links,
                  never embedded text. Enforced at the data layer; the reader
                  just renders what it is given. docs/PRD.md §8.12. */}
              {l.linkOnly ? (
                <a href={l.sourceUrl} target="_blank" rel="noopener noreferrer"
                   className="t-small text-rust underline">Read at {l.sourceName}</a>
              ) : (
                <p className="t-body text-ink">{l.body}</p>
              )}
              <p className="t-data text-[10px] uppercase text-mute">
                {l.sourceName} · {l.licence}
              </p>
            </article>
          ))}
        </div>
      </Frame>
    </div>
  );
}
