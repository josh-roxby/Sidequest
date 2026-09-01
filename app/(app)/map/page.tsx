"use client";
import { useMemo, useState } from "react";
import { MapCanvas, type MapMarker } from "@/components/map/MapCanvas";
import { Frame } from "@/components/shell/Frame";
import { Action } from "@/components/primitives/Action";
import { Button } from "@/components/primitives/Button";
import { MapDock } from "@/components/map/MapDock";
import { Plate } from "@/components/primitives/Plate";
import { Data, Label } from "@/components/primitives/Text";
import { Skeleton, StatusStrip } from "@/components/primitives/States";
import { data, type Point } from "@/lib/data";
import { hexAt } from "@/lib/map/hex";
import { useAsync } from "@/hooks/use-async";

/** Fixtures carry normalised 0–1 positions. The canvas works in metres, so
 *  one place converts and everything downstream is world space. */
const SPAN_M = 2000;
const toWorld = (n: number) => (n - 0.5) * SPAN_M;

export default function MapScreen() {
  const territory = useAsync(() => data.getTerritory(), []);
  const points = useAsync(() => data.getPointsNearby(), []);
  const quests = useAsync(() => data.getQuests("stroll"), []);
  const [open, setOpen] = useState<Point | null>(null);
  const [tale, setTale] = useState(false);
  const [layers, setLayers] = useState<Record<string, boolean>>({
    fog: true, trail: true, points: true, quests: true,
  });

  const markers = useMemo<MapMarker[]>(() => {
    const pts = (points.data ?? []).map((p) => ({
      id: p.id, x: toWorld(p.x), y: toWorld(p.y), kind: "point" as const, label: p.name,
    }));
    return [{ id: "you", x: 0, y: 0, kind: "you" as const }, ...pts];
  }, [points.data]);

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
    <div className="relative h-dvh w-full overflow-hidden">
      <MapCanvas
        markers={layers.points ? markers : markers.filter((m) => m.kind === "you")}
        trail={layers.trail ? trail : []}
        questTiles={layers.quests ? questTiles : []}
        onMarker={(id) => {
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
        label={open?.category ?? ""}
        title={open?.name ?? ""}
        action={open?.lore.length
          ? <Button tone="outline" onClick={() => setTale(true)}>Read the tale</Button>
          : null}
      >
        {open ? (
          <div className="-mx-4 -mt-3.5 flex flex-col">
            {/* Full-bleed plate, then the name, then the tags. The picture is
                what tells you whether it is worth the walk, so it goes first
                and it goes edge to edge. */}
            <Plate ratio="16/9" label={open.townland}
              className="rounded-none border-0 border-b border-rule" />
            <div className="flex flex-col gap-2 px-4 pt-3.5">
              {open.nameGa ? (
                <p className="t-body italic text-ink">{open.nameGa}</p>
              ) : null}
              <p className="t-small text-stone">Townland of {open.townland}</p>
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
