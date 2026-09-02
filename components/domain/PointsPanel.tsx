"use client";
import { Card } from "@/components/primitives/Card";
import { Mark } from "@/components/primitives/Marks";
import { Plate } from "@/components/primitives/Plate";
import { Data, Label } from "@/components/primitives/Text";
import { EmptyState, Skeleton, StatusStrip } from "@/components/primitives/States";
import { data } from "@/lib/data";
import { useAsync } from "@/hooks/use-async";

/** Every point you have stood in front of, and what is out there by kind.
 *
 *  The kinds grid sits above the list because it is the denominator: the list
 *  says what you have, the grid says what that is a fraction of. Totals come
 *  from the dataset after the reachability and visibility passes, so they are
 *  honest; where the dataset does not know, it says so rather than inventing
 *  one. docs/PRD.md §10. */
export function PointsPanel() {
  const points = useAsync(() => data.getPointsNearby(), []);
  const groups = useAsync(() => data.getCategories(), []);

  /** Unlocked only. A point you have not reached is not yours to browse: the
   *  detail is the reward for going, and a list of everything nearby would
   *  turn this into a gazetteer you can read on the sofa. */
  const unlocked = (points.data ?? []).filter((p) => p.visited);

  if (points.error) {
    return <StatusStrip>Could not load your points. {points.error}</StatusStrip>;
  }

  return (
    <>
      <Label className="block">By kind</Label>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {groups.loading
          ? <><Skeleton h={150} /><Skeleton h={150} /></>
          : (groups.data ?? []).map((g) => {
              const pct = g.total ? Math.min(1, g.reached / g.total) : 0;
              return (
                <Card key={g.group} inset={false} className="overflow-hidden">
                  <Plate ratio="1/1" plate={`category-${g.group}`} label={g.label} sizes="50vw"
                    className="border-0 border-b border-rule" />
                  <div className="p-2.5">
                    <div className="flex items-center gap-1.5">
                      <Mark name={g.group} size={12} />
                      <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink">
                        {g.label}
                      </p>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <Data size="lg" className="text-ink">{g.reached}</Data>
                      <Data className="text-stone">
                        {g.total === null ? "found" : `/ ${g.total}`}
                      </Data>
                    </div>
                    {g.total === null ? (
                      <Data className="mt-1.5 block text-[10px] uppercase text-mute">
                        Total unknown
                      </Data>
                    ) : (
                      <div className="mt-2 h-1 w-full bg-surface-2">
                        <div className="h-full bg-field" style={{ width: `${pct * 100}%` }} />
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
      </div>

      <Label className="mt-6 block">Unlocked</Label>
      <div className="mt-2 flex flex-col gap-2">
        {points.loading ? (
          <><Skeleton h={72} /><Skeleton h={72} /></>
        ) : unlocked.length === 0 ? (
          <EmptyState line="Nothing unlocked yet. Walk into a point's tile and it opens here." />
        ) : (
          unlocked.map((p) => (
            <Card key={p.id} className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 text-stone"><Mark name={p.group} size={15} /></span>
              <span className="min-w-0 flex-1">
                <p className="t-small font-semibold text-ink">{p.name}</p>
                {p.nameGa ? <p className="t-small italic text-stone">{p.nameGa}</p> : null}
                <Data className="mt-1 block text-[10px] uppercase text-mute">
                  {p.category} · {p.townland}
                </Data>
                <p className="t-small mt-1 text-stone">{p.blurb}</p>
              </span>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
