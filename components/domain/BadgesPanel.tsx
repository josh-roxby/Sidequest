"use client";
import { useState } from "react";
import { Card } from "@/components/primitives/Card";
import { Mark } from "@/components/primitives/Marks";
import { Plate } from "@/components/primitives/Plate";
import { Tabs } from "@/components/primitives/Tabs";
import { Data, Label } from "@/components/primitives/Text";
import { EmptyState, Skeleton } from "@/components/primitives/States";
import { Button } from "@/components/primitives/Button";
import { cn } from "@/lib/cn";
import { data } from "@/lib/data";
import { useAsync } from "@/hooks/use-async";

/** Everything you have collected, in one place.
 *
 *  Two kinds sit here because they answer the same question in different
 *  grains. Collected is what you picked up from individual points. Earned is
 *  what those add up to. Splitting them across two destinations made the
 *  progression feel further apart than it is. */
export function BadgesPanel() {
  const [tab, setTab] = useState("collected");
  const items = useAsync(() => data.getCollectibles(), []);
  const badges = useAsync(() => data.getBadges(), []);
  const groups = useAsync(() => data.getCategories(), []);

  const collected = items.data ?? [];
  const earnedList = badges.data ?? [];
  const total = collected.reduce((n, i) => n + i.count, 0);
  const earned = earnedList.filter((b) => b.earnedAt).length;

  return (
    <>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: "collected", label: "Collected", count: total },
          { id: "earned", label: "Earned", count: earned },
          { id: "groups", label: "Kinds" },
        ]}
      />

      {tab === "collected" ? (
        <div className="mt-4">
          {items.loading ? (
            <div className="grid grid-cols-2 gap-2">
              <Skeleton h={132} /><Skeleton h={132} />
              <Skeleton h={132} /><Skeleton h={132} />
            </div>
          ) : collected.length === 0 ? (
            <EmptyState
              line="Nothing collected yet. Reach a point on a walk and it lands here."
              action={<Button>Find a trot</Button>}
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {collected.map((i) => (
                <Card key={i.id} inset={false} className="overflow-hidden">
                  <Plate ratio="1/1" plate={i.plate} label={i.category} sizes="50vw"
                    className="border-0 border-b border-rule" />
                  <div className="p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase leading-tight tracking-[0.04em] text-ink">
                        {i.name}
                      </p>
                      <Data className="shrink-0 text-stone">×{i.count}</Data>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-mute">
                      <Mark name={i.group} size={12} />
                      <Data className="text-[10px] uppercase">{i.townland}</Data>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : tab === "groups" ? (
        <div className="mt-4">
          {/* What is out there by kind, and how much of each you have stood in
              front of. The denominator is post reachability and visibility, so
              it is honest; where the dataset does not know it says so rather
              than inventing one. */}
          {groups.loading ? (
            <div className="grid grid-cols-2 gap-2">
              <Skeleton h={150} /><Skeleton h={150} />
              <Skeleton h={150} /><Skeleton h={150} />
            </div>
          ) : (groups.data ?? []).length === 0 ? (
            <EmptyState line="Nothing surveyed near you yet." />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {(groups.data ?? []).map((g) => {
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
          )}
        </div>
      ) : (
        <div className="mt-4">
          {badges.loading ? (
            <div className="grid grid-cols-2 gap-2"><Skeleton h={124} /><Skeleton h={124} /></div>
          ) : (
            <>
              <div className="flex items-center gap-3 pb-3">
                <Data size="lg" className="text-ink">{earned}</Data>
                <Label>of {earnedList.length} earned</Label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {earnedList.map((b) => {
                  const done = Boolean(b.earnedAt);
                  const pct = Math.min(1, b.progress / b.target);
                  return (
                    <Card key={b.id} inset={false}
                      className={cn("overflow-hidden", done ? undefined : "border-dashed")}>
                      {/* The device is drawn as a full plate rather than a glyph
                          in a chip. These are survey illustrations with stipple
                          all through them and they are unreadable at 18px, which
                          is the size the group mark was designed for. The mark
                          still carries the group on the collectible below. */}
                      <Plate ratio="1/1" plate={b.plate} label={b.group} sizes="50vw"
                        className="border-0 border-b border-rule" />
                      <div className="p-2.5">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-ink">
                        {b.label}
                      </p>
                      <p className="t-small mt-0.5 text-stone">{b.description}</p>
                      {done ? (
                        <Data className="mt-2 block text-[10px] uppercase text-field">
                          Earned {b.earnedAt}
                        </Data>
                      ) : (
                        <>
                          <div className="mt-2.5 h-1 w-full bg-surface-2">
                            <div className="h-full bg-field" style={{ width: `${pct * 100}%` }} />
                          </div>
                          <Data className="mt-1.5 block text-[10px] uppercase text-mute">
                            {b.progress} / {b.target}
                          </Data>
                        </>
                      )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
