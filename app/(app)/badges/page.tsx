"use client";
import { Card } from "@/components/primitives/Card";
import { Mark } from "@/components/primitives/Marks";
import { Data, Label } from "@/components/primitives/Text";
import { Skeleton } from "@/components/primitives/States";
import { Screen, ScreenHead } from "@/components/shell/Screen";
import { data } from "@/lib/data";
import { useAsync } from "@/hooks/use-async";

export default function BadgesScreen() {
  const badges = useAsync(() => data.getBadges(), []);
  const list = badges.data ?? [];
  const earned = list.filter((b) => b.earnedAt).length;

  return (
    <Screen>
      <ScreenHead label="Badges" title="What you have earned" />

      {badges.loading ? (
        <div className="grid grid-cols-2 gap-2"><Skeleton h={124} /><Skeleton h={124} /></div>
      ) : (
        <>
          <div className="flex items-center gap-3 pb-4">
            <Data size="lg" className="text-ink">{earned}</Data>
            <Label>of {list.length} earned</Label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {list.map((b) => {
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
    </Screen>
  );
}
