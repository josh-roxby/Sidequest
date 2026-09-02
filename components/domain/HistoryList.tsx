"use client";
import Link from "next/link";
import { Button } from "@/components/primitives/Button";
import { Data, Label } from "@/components/primitives/Text";
import { EmptyState, Skeleton } from "@/components/primitives/States";
import { StatRow } from "@/components/primitives/Stat";
import { data, TIERS } from "@/lib/data";
import { useAsync } from "@/hooks/use-async";

/** Shared by /history and the History tab on /profile, so the two can never
 *  drift apart. */
export function HistoryList({ showStats = true }: { showStats?: boolean }) {
  const walks = useAsync(() => data.getWalks(), []);
  const list = walks.data ?? [];
  const km = list.reduce((n, w) => n + w.distanceM, 0) / 1000;
  const tiles = list.reduce((n, w) => n + w.tilesGained, 0);

  if (walks.loading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton h={58} /><Skeleton h={58} /><Skeleton h={58} />
      </div>
    );
  }
  if (walks.error) {
    return (
      <div className="flex flex-col items-start gap-3 border border-rule bg-surface p-3.5"
        style={{ borderRadius: "var(--r-md)" }}>
        <p className="t-small text-ink">Could not load your quests. Try again in a moment.</p>
        <Button>Retry</Button>
      </div>
    );
  }
  if (list.length === 0) {
    // The shortest tier is offered, because the barrier is always time.
    return <EmptyState line="No quests yet." action={<Button>Find a trot</Button>} />;
  }

  return (
    <>
      {showStats ? (
        <StatRow
          items={[
            { value: `${list.length}`, key: "quests" },
            { value: km.toFixed(1), key: "km" },
            { value: tiles.toLocaleString(), key: "tiles" },
          ]}
        />
      ) : null}

      <Label className={showStats ? "mt-5" : undefined}>History</Label>
      <div className="mt-2 flex flex-col gap-2">
        {list.map((w) => (
          <Link key={w.id} href={`/history/${w.id}`}
            className="block border border-rule bg-surface p-3.5 text-left active:bg-field-soft"
            style={{ borderRadius: "var(--r-md)" }}>
            <div className="flex items-baseline justify-between gap-3">
              <Data className="text-[11px] uppercase text-mute">{w.dateISO}</Data>
              <Data className="text-stone">{(w.distanceM / 1000).toFixed(2)} KM</Data>
            </div>
            <p className="t-small mt-1 font-semibold text-ink">{w.questTitle}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="t-label border border-rule px-1.5 py-0.5 text-stone">
                {TIERS.find((t) => t.id === w.tier)?.label}
              </span>
              {w.status === "abandoned" ? (
                <Data className="text-[10px] uppercase text-rust">Ended early</Data>
              ) : null}
              <Data className="text-[10px] uppercase text-mute">+{w.tilesGained} tiles</Data>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
