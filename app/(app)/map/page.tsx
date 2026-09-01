"use client";
import { useState } from "react";
import { MapSurface } from "@/components/map/MapSurface";
import { Frame } from "@/components/shell/Frame";
import { Action } from "@/components/primitives/Action";
import { Button } from "@/components/primitives/Button";
import { Data, Label } from "@/components/primitives/Text";
import { Skeleton, StatusStrip } from "@/components/primitives/States";
import { data, type Point } from "@/lib/data";
import { useAsync } from "@/hooks/use-async";

export default function MapScreen() {
  const territory = useAsync(() => data.getTerritory(), []);
  const points = useAsync(() => data.getPointsNearby(), []);
  const [open, setOpen] = useState<Point | null>(null);
  const [tale, setTale] = useState(false);

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <MapSurface points={points.data ?? []} onPoint={setOpen} />

      {/* Territory readout. Zero state is shown, never hidden: seeing 0 is
          the motivation. docs/ux-loops.md §C-2. */}
      <div
        className="absolute border border-ink bg-surface px-2.5 py-2"
        style={{ left: "var(--gutter)", top: "calc(env(safe-area-inset-top) + var(--gutter))" }}
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

      <Frame
        open={open !== null && !tale}
        onDismiss={() => setOpen(null)}
        label={open?.category ?? ""}
        title={open?.name ?? ""}
        action={
          open?.lore.length ? (
            <Button tone="outline" onClick={() => setTale(true)}>Read the tale</Button>
          ) : null
        }
      >
        {open ? (
          <div className="flex flex-col gap-3">
            {open.nameGa ? (
              <p className="t-body italic text-ink">{open.nameGa}</p>
            ) : null}
            <p className="t-small text-stone">Townland of {open.townland}</p>
          </div>
        ) : null}
      </Frame>

      {/* Reading surfaces get the tall ratio. Nothing else does. */}
      <Frame
        open={tale}
        onDismiss={() => setTale(false)}
        ratio="tall"
        label="The tale"
        title={open?.name ?? ""}
        action={<Action tone="outline" onClick={() => setTale(false)}>Back to the map</Action>}
      >
        <div className="flex flex-col gap-5">
          {open?.lore.map((l) => (
            <article key={l.title} className="flex flex-col gap-1.5">
              <Label>{l.kind}</Label>
              <h3 className="t-h2 text-ink">{l.title}</h3>
              {/* Share-alike and non-commercial sources are outbound links,
                  never embedded text. Enforced at the data layer; the reader
                  just renders what it is given. docs/PRD.md §8.12. */}
              {l.linkOnly ? (
                <a href={l.sourceUrl} target="_blank" rel="noopener noreferrer"
                   className="t-small text-rust underline">
                  Read at {l.sourceName}
                </a>
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
