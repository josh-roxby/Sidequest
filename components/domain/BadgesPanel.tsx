"use client";
import { Card } from "@/components/primitives/Card";
import { Plate } from "@/components/primitives/Plate";
import { Data, Label } from "@/components/primitives/Text";
import { EmptyState, Skeleton, StatusStrip } from "@/components/primitives/States";
import { cn } from "@/lib/cn";
import { data } from "@/lib/data";
import { useAsync } from "@/hooks/use-async";

/** What you have earned.
 *
 *  There was a second tab here, Collected, holding a per-point trinket
 *  alongside the badge it counted toward. It was removed rather than reworked:
 *  two currencies for the same act of arriving somewhere is one more than the
 *  walk earns. */
export function BadgesPanel() {
  const badges = useAsync(() => data.getBadges(), []);
  const list = badges.data ?? [];
  const earned = list.filter((b) => b.earnedAt).length;

  if (badges.error) {
    return <StatusStrip>Could not load your badges. {badges.error}</StatusStrip>;
  }
  if (badges.loading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Skeleton h={214} /><Skeleton h={214} />
      </div>
    );
  }
  if (list.length === 0) {
    return <EmptyState line="No badges yet. Reach a few points and the first one lands." />;
  }

  return (
    <>
      <div className="flex items-center gap-3 pb-3">
        <Data size="lg" className="text-ink">{earned}</Data>
        <Label>of {list.length} earned</Label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {list.map((b) => {
          const done = Boolean(b.earnedAt);
          const pct = Math.min(1, b.progress / b.target);
          return (
            <Card key={b.id} inset={false}
              className={cn("overflow-hidden", done ? undefined : "border-dashed")}>
              {/* The device is drawn as a full plate rather than a glyph in a
                  chip. These are survey illustrations with stipple all through
                  them and they are unreadable at 18px, which is the size the
                  group mark was designed for. */}
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
  );
}
