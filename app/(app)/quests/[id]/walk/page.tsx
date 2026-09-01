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

  const doneCount = q?.objectives.filter((o) => o.reached).length ?? 0;
  const totalS = q ? estimateDurationS(q.distanceM, {
    surface: q.surface, ascentM: q.ascentM, dwellS: q.objectives.length * 240,
  }) : 0;
  const walkedM = q ? Math.max(...q.objectives.filter((o) => o.reached).map((o) => o.atM), 0) : 0;

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <MapCanvas markers={markers} trail={trail} initialScale={1.3} />

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
        {(q?.objectives ?? []).map((o) => {
          const p = point(o);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setOpenObj(o)}
              className={cn(
                "w-[200px] shrink-0 select-none overflow-hidden border bg-surface text-left active:scale-[0.99]",
                o.reached ? "border-field" : "border-dashed border-rule",
              )}
              style={{ borderRadius: "var(--r-md)", transitionDuration: "var(--dur-tap)" }}
            >
              <Plate ratio="16/9" label={o.reached ? p?.category ?? "Waypoint" : "Locked"}
                className="rounded-none border-0 border-b border-rule" />
              <div className="p-2.5">
                <div className="flex items-center gap-1.5">
                  <Mark name={o.reached ? "badge" : "flag"} size={12} />
                  <Data className="text-[9px] uppercase text-mute">
                    {formatDistance(o.atM)} in
                  </Data>
                </div>
                <p className="mt-1 text-[12px] font-semibold leading-tight text-ink">{o.label}</p>
                <p className="t-small mt-0.5 line-clamp-2 text-stone">
                  {o.reached
                    ? p?.lore[0]?.title ?? "You have been here."
                    : "Details unlock when you arrive."}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <Frame
        open={openObj !== null}
        onDismiss={() => setOpenObj(null)}
        ratio={openObj?.reached ? "tall" : "square"}
        label={openObj?.reached ? point(openObj)?.category ?? "Waypoint" : "Not reached yet"}
        title={openObj?.label ?? ""}
        action={openObj?.reached && point(openObj)?.lore.length
          ? <Button tone="outline" onClick={() => router.push(`/tales/t-1`)}>Read the tale</Button>
          : null}
      >
        {openObj ? (
          openObj.reached ? (
            <div className="-mx-4 -mt-3.5 flex flex-col">
              <Plate ratio="16/9" label={point(openObj)?.townland}
                className="rounded-none border-0 border-b border-rule" />
              <div className="selectable flex flex-col gap-2 px-4 pt-3.5">
                {point(openObj)?.nameGa ? (
                  <p className="t-body italic text-ink">{point(openObj)?.nameGa}</p>
                ) : null}
                <p className="t-body text-ink">{point(openObj)?.lore[0]?.body}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {(point(openObj)?.tags ?? []).map((t) => (
                    <span key={t}
                      className="border border-rule bg-surface-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.05em] text-stone"
                      style={{ borderRadius: "var(--r-full)" }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Plate ratio="16/9" label="Locked" />
              <p className="t-body text-ink">
                {formatDistance(openObj.atM)} in. Walk into this tile and the rest
                opens: what it is, what the name means, and who put it there.
              </p>
              <Data className="text-[11px] uppercase text-mute">
                {openObj.required ? "Required" : "Optional"}
              </Data>
            </div>
          )
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

      {/* End walk lives beside the nav button rather than replacing it, so the
          rest of the app stays reachable mid-walk. */}
      <button
        type="button"
        onClick={() => setEnding(true)}
        aria-label="End walk"
        className="absolute flex h-11 w-11 items-center justify-center border border-rust bg-rust text-field-ink active:scale-[0.97]"
        style={{ right: "var(--gutter)", top: "calc(env(safe-area-inset-top) + var(--gutter))",
                 borderRadius: "var(--r-sm)" }}
      >
        <Mark name="flag" size={17} />
      </button>
    </div>
  );
}
