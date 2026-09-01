"use client";
import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { Field } from "@/components/primitives/Field";
import { Mark } from "@/components/primitives/Marks";
import { ShapeChip } from "@/components/primitives/ShapeChip";
import { Tabs } from "@/components/primitives/Tabs";
import { Data, Label } from "@/components/primitives/Text";
import { EmptyState, Skeleton } from "@/components/primitives/States";
import { Screen, ScreenHead } from "@/components/shell/Screen";
import { ThumbAction } from "@/components/shell/ThumbAction";
import { Frame } from "@/components/shell/Frame";
import { ReferralTile } from "@/components/domain/ReferralTile";
import { data, TIERS } from "@/lib/data";
import { formatDistance } from "@/lib/walking";
import { useAsync } from "@/hooks/use-async";

/** The people you walk with.
 *
 *  Deliberately not a social network: there is no feed of theirs to scroll, no
 *  follower count, and no way to see where anyone is. What a friend gives you
 *  is a route worth stealing and a reason to go this week. */
export default function FriendsScreen() {
  const [tab, setTab] = useState("friends");
  const [adding, setAdding] = useState(false);
  const friends = useAsync(() => data.getFriends(), []);
  const requests = useAsync(() => data.getFriendRequests(), []);
  const quests = useAsync(() => data.getFriendQuests(), []);
  const challenges = useAsync(() => data.getChallenges(), []);

  const reqCount = requests.data?.length ?? 0;

  return (
    <Screen docked>
      <ScreenHead label="Friends" title="Who you walk with" />

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: "friends", label: "Friends", count: friends.data?.length },
          { id: "quests", label: "Their quests" },
          { id: "requests", label: "Requests", count: reqCount || undefined },
          { id: "challenges", label: "Challenges" },
        ]}
      />

      <div className="mt-4">
        {tab === "friends" ? (
          friends.loading ? (
            <div className="flex flex-col gap-2"><Skeleton h={64} /><Skeleton h={64} /></div>
          ) : (friends.data ?? []).length === 0 ? (
            <EmptyState line="Nobody yet. Invite someone and the map gets more interesting."
              action={<Button onClick={() => setAdding(true)}>Add a friend</Button>} />
          ) : (
            <div className="flex flex-col gap-2">
              {(friends.data ?? []).map((f) => (
                <Card key={f.id} className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-ink bg-field-soft text-[12px] font-semibold text-field"
                    style={{ borderRadius: "var(--r-full)" }}>
                    {f.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <p className="t-small font-semibold text-ink">{f.name}</p>
                    <Data className="text-[10px] uppercase text-mute">
                      Rank {String(f.rank).padStart(2, "0")} · {f.townland}
                    </Data>
                  </span>
                  <span className="shrink-0 text-right">
                    <Data className="block text-ink">{f.walksTogether}</Data>
                    <p className="t-label text-mute" style={{ fontSize: 9 }}>together</p>
                  </span>
                </Card>
              ))}
            </div>
          )
        ) : null}

        {tab === "quests" ? (
          quests.loading ? (
            <div className="flex flex-col gap-2"><Skeleton h={92} /><Skeleton h={92} /></div>
          ) : (
            <div className="flex flex-col gap-2">
              {(quests.data ?? []).map((q) => (
                <Card key={q.id}>
                  <Label style={{ fontSize: 9 }}>{q.friend} made this</Label>
                  <p className="t-h2 mt-1 text-ink">{q.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <ShapeChip shape={q.shape} tip={false} />
                    <Data className="text-[10px] uppercase text-mute">
                      {TIERS.find((t) => t.id === q.tier)?.label} · {formatDistance(q.distanceM)} · {q.townland}
                    </Data>
                  </div>
                </Card>
              ))}
            </div>
          )
        ) : null}

        {tab === "requests" ? (
          reqCount === 0 ? (
            <EmptyState line="No requests waiting." />
          ) : (
            <div className="flex flex-col gap-2">
              {(requests.data ?? []).map((r) => (
                <Card key={r.id} className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-rule bg-surface-2 text-[12px] font-semibold text-stone"
                    style={{ borderRadius: "var(--r-full)" }}>
                    {r.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <p className="t-small font-semibold text-ink">{r.name}</p>
                    <Data className="text-[10px] uppercase text-mute">{r.townland}</Data>
                  </span>
                  <span className="flex shrink-0 gap-1.5">
                    <Button tone="solid">Accept</Button>
                    <Button tone="quiet">Ignore</Button>
                  </span>
                </Card>
              ))}
            </div>
          )
        ) : null}

        {tab === "challenges" ? (
          <div className="flex flex-col gap-2">
            {(challenges.data ?? []).map((c) => (
              <Card key={c.id} className="border-dashed">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-rust text-rust"
                    style={{ borderRadius: "var(--r-full)" }}>
                    <Mark name="star" size={13} />
                  </span>
                  <span className="min-w-0">
                    <p className="t-small font-semibold text-ink">{c.title}</p>
                    <p className="t-small mt-0.5 text-stone">{c.line}</p>
                  </span>
                </div>
              </Card>
            ))}
            <p className="t-small mt-1 text-stone">
              Challenges are between the two of you. Nothing is scored, published
              or ranked.
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-6">
        <ReferralTile />
      </div>

      <ThumbAction onClick={() => setAdding(true)}>
        <Mark name="plus" size={15} /> Add a friend
      </ThumbAction>

      <Frame
        open={adding}
        onDismiss={() => setAdding(false)}
        label="Add a friend"
        title="Who are you walking with?"
        action={<Button tone="solid" onClick={() => setAdding(false)}>Send request</Button>}
      >
        <div className="flex flex-col gap-4">
          <Field label="Their name or code" placeholder="niamh, or SQ-CLARE-0042" />
          <p className="t-small text-stone">
            They get a request. Nothing is shared until they accept, and even
            then it is quests and badges, never where either of you is.
          </p>
        </div>
      </Frame>
    </Screen>
  );
}
