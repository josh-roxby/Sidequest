"use client";
import { useState } from "react";
import { Card } from "@/components/primitives/Card";
import { Mark } from "@/components/primitives/Marks";
import { Plate } from "@/components/primitives/Plate";
import { Tabs } from "@/components/primitives/Tabs";
import { Data, Label } from "@/components/primitives/Text";
import { EmptyState, Skeleton } from "@/components/primitives/States";
import { Button } from "@/components/primitives/Button";
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
                  <Plate ratio="1/1" label={i.category} className="border-0 border-b border-rule" />
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
                    <Card key={b.id} className={done ? undefined : "border-dashed"}>
                      <span
                        className="flex h-11 w-11 items-center justify-center border"
                        style={{
                          borderRadius: "var(--r-full)",
                          borderColor: done ? "var(--field)" : "var(--rule)",
                          background: done ? "var(--field)" : "transparent",
                          color: done ? "var(--field-ink)" : "var(--mute)",
                        }}
                      >
                        <Mark name={b.group} size={18} />
                      </span>
                      <p className="mt-2.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-ink">
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
