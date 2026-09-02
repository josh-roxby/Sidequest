"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { Mark } from "@/components/primitives/Marks";
import { ShapeChip } from "@/components/primitives/ShapeChip";
import { Data, Label } from "@/components/primitives/Text";
import { EmptyState, Skeleton, StatusStrip } from "@/components/primitives/States";
import { Screen } from "@/components/shell/Screen";
import { ThumbAction } from "@/components/shell/ThumbAction";
import { data, TIERS } from "@/lib/data";
import { formatDistance } from "@/lib/walking";
import { useAsync } from "@/hooks/use-async";

/** A friend, and the quests of theirs you can take.
 *
 *  Deliberately thin. There is no feed here, no location, no last seen on a
 *  map, and no way to tell where they are walking now. What a friend's page
 *  gives you is the same thing a friend gives you: routes worth stealing.
 *  docs/ux-loops.md §H. */
export default function FriendScreen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const friend = useAsync(() => data.getFriend(id), [id]);
  const quests = useAsync(() => data.getFriendQuests(), []);

  const f = friend.data;
  const theirs = (quests.data ?? []).filter((q) => q.friend === f?.name);

  return (
    <Screen docked>
      <div className="flex items-center justify-between pb-4">
        <Button tone="quiet" aria-label="Back" onClick={() => router.back()}>←</Button>
        <Label>Friend</Label>
      </div>

      {friend.error ? (
        <StatusStrip>Could not load this friend. {friend.error}</StatusStrip>
      ) : null}

      {friend.loading ? (
        <div className="flex flex-col gap-3"><Skeleton h={92} /><Skeleton h={64} /></div>
      ) : !f ? (
        <EmptyState line="That person is no longer on your list."
          action={<Button onClick={() => router.push("/friends")}>Back to friends</Button>} />
      ) : (
        <>
          <Card className="flex items-center gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center border border-ink bg-field-soft text-[15px] font-semibold text-field"
              style={{ borderRadius: "var(--r-full)" }}>
              {f.initials}
            </span>
            <span className="min-w-0 flex-1">
              <p className="t-h2 text-ink">{f.name}</p>
              <Data className="text-[10px] uppercase text-mute">
                Rank {String(f.rank).padStart(2, "0")} · {f.townland}
              </Data>
            </span>
          </Card>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <Card>
              <Data size="lg" className="text-ink">{f.walksTogether}</Data>
              <Label className="mt-1 block">Walked together</Label>
            </Card>
            <Card>
              <Data size="lg" className="text-ink">{theirs.length}</Data>
              <Label className="mt-1 block">Quests shared</Label>
            </Card>
          </div>

          <Label className="mt-6 block">Their quests</Label>
          <div className="mt-2 flex flex-col gap-2">
            {quests.loading ? (
              <><Skeleton h={82} /><Skeleton h={82} /></>
            ) : theirs.length === 0 ? (
              <EmptyState line={`${f.name} has not shared a quest yet.`} />
            ) : (
              theirs.map((q) => (
                <Link key={q.id} href={`/friends/quests/${q.id}`}
                  className="block active:scale-[0.99]"
                  style={{ transitionDuration: "var(--dur-tap)" }}>
                  <Card className="flex items-center gap-3">
                    <span className="min-w-0 flex-1">
                      <p className="t-small font-semibold text-ink">{q.title}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <ShapeChip shape={q.shape} tip={false} />
                        <Data className="text-[10px] uppercase text-mute">
                          {TIERS.find((t) => t.id === q.tier)?.label} · {formatDistance(q.distanceM)}
                        </Data>
                      </div>
                    </span>
                    <span className="shrink-0 text-mute"><Mark name="quest" size={14} /></span>
                  </Card>
                </Link>
              ))
            )}
          </div>

          <p className="t-small mt-5 text-stone">
            Nothing here says where {f.name}{" "}is or has been. A shared quest
            is a route, not a record of anyone&apos;s movements.
          </p>

          <ThumbAction onClick={() => router.push("/friends")}>
            <Mark name="friends" size={15} /> All friends
          </ThumbAction>
        </>
      )}
    </Screen>
  );
}
