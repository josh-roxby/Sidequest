"use client";
import Link from "next/link";
import { Card } from "@/components/primitives/Card";
import { Data, Label } from "@/components/primitives/Text";
import { EmptyState, Skeleton } from "@/components/primitives/States";
import { Button } from "@/components/primitives/Button";
import { Screen, ScreenHead } from "@/components/shell/Screen";
import { data } from "@/lib/data";
import { useAsync } from "@/hooks/use-async";
import { cn } from "@/lib/cn";

/** Lore collected from points. Reading is itself a progression dimension: it
 *  rewards the behaviour the whole dataset exists to enable. */
export default function TalesScreen() {
  const tales = useAsync(() => data.getTales(), []);
  const list = tales.data ?? [];
  const read = list.filter((t) => t.readAt).length;

  return (
    <Screen>
      <ScreenHead label="Tales" title="What you have learned" />

      {tales.loading ? (
        <div className="flex flex-col gap-2"><Skeleton h={76} /><Skeleton h={76} /><Skeleton h={76} /></div>
      ) : list.length === 0 ? (
        <EmptyState
          line="No tales yet. Reach a point with a story and it opens here."
          action={<Button>Find a stroll</Button>}
        />
      ) : (
        <>
          <div className="flex items-center gap-3 pb-4">
            <Data size="lg" className="text-ink">{read}</Data>
            <Label>of {list.length} read</Label>
          </div>

          <div className="flex flex-col gap-2">
            {list.map((t) => (
              <Link key={t.id} href={`/tales/${t.id}`} className="block active:scale-[0.99]"
                style={{ transitionDuration: "var(--dur-tap)" }}>
              <Card className={cn(!t.readAt && "border-dashed")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Label style={{ fontSize: 9 }}>{t.kind}</Label>
                    <p className="t-h2 mt-1 text-ink">{t.title}</p>
                    <p className="t-small mt-1 text-stone">
                      {t.pointName}, townland of {t.townland}
                    </p>
                  </div>
                  <Data className="shrink-0 text-[10px] uppercase text-mute">
                    {t.readAt ?? "Unread"}
                  </Data>
                </div>
                <Data className="mt-2 block text-[10px] uppercase text-field">
                  {t.cards.length} cards
                </Data>
              </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </Screen>
  );
}
