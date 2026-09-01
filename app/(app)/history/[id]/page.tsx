"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use } from "react";
import { MapCanvas } from "@/components/map/MapCanvas";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { Mark } from "@/components/primitives/Marks";
import { ShapeChip } from "@/components/primitives/ShapeChip";
import { StatRow } from "@/components/primitives/Stat";
import { Data, Label, Rule } from "@/components/primitives/Text";
import { Skeleton } from "@/components/primitives/States";
import { Screen } from "@/components/shell/Screen";
import { data, TIERS } from "@/lib/data";
import { formatDistance, formatDuration } from "@/lib/walking";
import { useAsync } from "@/hooks/use-async";

const SPAN_M = 2000;
const toWorld = (n: number) => (n - 0.5) * SPAN_M;

/** A walk you already did, kept as a record rather than a receipt.
 *
 *  The map, then what it earned you, then what you learned, then what you
 *  wrote down. Distance and time are the least interesting things here, so
 *  they sit in one row and get out of the way. */
export default function TrailScreen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const detail = useAsync(() => data.getWalkDetail(id), [id]);
  const d = detail.data;

  const trail = (d?.quest?.path ?? []).map(([x, y]) => [toWorld(x), toWorld(y)] as [number, number]);

  return (
    <Screen>
      <div className="flex items-center justify-between pb-3">
        <Button tone="quiet" aria-label="Back" onClick={() => router.back()}>←</Button>
        <Data className="text-[10px] uppercase text-mute">{d?.walk.dateISO}</Data>
      </div>

      {detail.loading ? (
        <div className="flex flex-col gap-3"><Skeleton h={200} /><Skeleton h={80} /></div>
      ) : !d ? (
        <p className="t-body text-stone">That walk is no longer here.</p>
      ) : (
        <>
          <div className="relative -mx-4 h-[220px] overflow-hidden border-y border-rule">
            <MapCanvas
              interactive={false}
              initialScale={0.9}
              trail={trail}
              markers={(d.quest?.objectives ?? []).map((o) => ({
                id: o.id, x: toWorld(o.x), y: toWorld(o.y),
                kind: "objective-done" as const,
              }))}
            />
          </div>

          <h1 className="t-h1 mt-4 text-ink">{d.walk.questTitle}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="t-label border border-rule px-1.5 py-0.5 text-stone">
              {TIERS.find((t) => t.id === d.walk.tier)?.label}
            </span>
            {d.quest ? <ShapeChip shape={d.quest.shape} tip={false} /> : null}
            {d.walk.status === "abandoned" ? (
              <Data className="text-[10px] uppercase text-rust">Ended early</Data>
            ) : null}
          </div>
          <p className="t-small mt-2 text-stone">Townland of {d.walk.townland}</p>

          <div className="mt-4">
            <StatRow
              items={[
                { value: formatDistance(d.walk.distanceM).replace(" KM", ""), key: "km" },
                { value: formatDuration(d.walk.durationMin * 60).replace(" MIN", ""), key: "time" },
                { value: `${d.walk.tilesGained}`, key: "tiles" },
              ]}
            />
          </div>

          <Rule className="my-6" />

          <Label>Earned on this walk</Label>
          <div className="mt-2">
            {d.badges.length === 0 ? (
              <p className="t-small text-stone">No badges from this one.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {d.badges.map((b) => (
                  <Card key={b.id} className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-field bg-field text-field-ink"
                      style={{ borderRadius: "var(--r-full)" }}>
                      <Mark name={b.group} size={17} />
                    </span>
                    <span>
                      <p className="t-small font-semibold text-ink">{b.label}</p>
                      <p className="t-small text-stone">{b.description}</p>
                    </span>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Label className="mt-6">Tales opened</Label>
          <div className="mt-2">
            {d.tales.length === 0 ? (
              <p className="t-small text-stone">Nothing new opened on this walk.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {d.tales.map((t) => (
                  <Link key={t.id} href={`/tales/${t.id}`} className="block">
                    <Card>
                      <Label style={{ fontSize: 9 }}>{t.kind}</Label>
                      <p className="t-h2 mt-1 text-ink">{t.title}</p>
                      <p className="t-small mt-0.5 text-stone">{t.pointName}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Label className="mt-6">Your notes</Label>
          <div className="mt-2">
            {d.notes.length === 0 ? (
              <p className="t-small text-stone">You did not write anything down.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {d.notes.map((n) => (
                  <Card key={n.id}>
                    <Data className="text-[10px] uppercase text-mute">
                      Pinned {formatDistance(n.atM)} in
                    </Data>
                    <p className="selectable t-body mt-1.5 text-ink">{n.text}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Screen>
  );
}
