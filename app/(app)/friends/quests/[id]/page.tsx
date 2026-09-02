"use client";
import { useRouter } from "next/navigation";
import { use, useMemo } from "react";
import { MapCanvas, type MapMarker } from "@/components/map/MapCanvas";
import { Button } from "@/components/primitives/Button";
import { Mark } from "@/components/primitives/Marks";
import { ShapeChip } from "@/components/primitives/ShapeChip";
import { Data, Label } from "@/components/primitives/Text";
import { EmptyState, Skeleton, StatusStrip } from "@/components/primitives/States";
import { StartGate } from "@/components/domain/StartGate";
import { Screen } from "@/components/shell/Screen";
import { data, TIERS } from "@/lib/data";
import { estimateDurationS, formatDistance, formatDuration, SHAPE_HINT } from "@/lib/walking";
import { useAsync } from "@/hooks/use-async";

const SPAN_M = 2000;
const toWorld = (n: number) => (n - 0.5) * SPAN_M;

/** A friend's quest, before you commit to it.
 *
 *  A preview rather than the quest screen: enough to decide, and one way in.
 *  A shared quest has no objectives attached until you take it, so this shows
 *  the shape of the walk and what it will cost you in time, not a checklist of
 *  what is waiting. */
export default function FriendQuestScreen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const fq = useAsync(() => data.getFriendQuest(id), [id]);
  /** The route line is illustrative until a shared quest carries its own path.
   *  Borrowing a real one keeps the preview honest about shape and length
   *  without inventing a route through country nobody has surveyed. */
  const quests = useAsync(() => data.getQuests("stroll"), []);

  const q = fq.data;
  const shown = quests.data?.[0];

  const trail = useMemo<[number, number][]>(
    () => (shown?.path ?? []).map(([x, y]) => [toWorld(x), toWorld(y)]),
    [shown],
  );
  const markers = useMemo<MapMarker[]>(
    () => (shown?.path?.[0] ? [{ id: "start", x: toWorld(shown.path[0][0]), y: toWorld(shown.path[0][1]), kind: "you" as const }] : []),
    [shown],
  );

  const totalS = q ? estimateDurationS(q.distanceM, {
    surface: "unpaved", ascentM: 40, dwellS: 3 * 240,
  }) : 0;

  return (
    <Screen docked>
      <div className="flex items-center justify-between pb-4">
        <Button tone="quiet" aria-label="Back" onClick={() => router.back()}>←</Button>
        <Label>Shared quest</Label>
      </div>

      {fq.error ? <StatusStrip>Could not load this quest. {fq.error}</StatusStrip> : null}

      {fq.loading ? (
        <div className="flex flex-col gap-3"><Skeleton h={160} /><Skeleton h={72} /></div>
      ) : !q ? (
        <EmptyState line="That quest is no longer shared."
          action={<Button onClick={() => router.push("/friends")}>Back to friends</Button>} />
      ) : (
        <>
          {/* The map is the preview. A shared quest is a shape and a length
              before it is anything else, and a picture of the country would be
              a promise we cannot keep for someone else's route. */}
          <div className="relative h-[188px] w-full overflow-hidden border border-rule"
            style={{ borderRadius: "var(--r-md)" }}>
            {/* Zoomed to hold the whole route. The world span is 2km across and the
                preview is 374px wide, so anything above about 0.17 runs the
                line off both edges and the shape, which is the thing being
                previewed, is lost. */}
            <MapCanvas markers={markers} trail={trail} interactive={false} initialScale={0.16} />
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-stone">
            <Mark name="user" size={13} />
            <Data className="text-[10px] uppercase">{q.friend} made this</Data>
          </div>
          <h1 className="t-h1 mt-1.5 text-ink">{q.title}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Label>{TIERS.find((t) => t.id === q.tier)?.label}</Label>
            <ShapeChip shape={q.shape} />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Card2 value={formatDistance(q.distanceM)} label="Distance" />
            <Card2 value={formatDuration(totalS)} label="At your pace" />
            <Card2 value={q.townland} label="Starts in" small />
          </div>

          <p className="t-body mt-4 text-ink">{SHAPE_HINT[q.shape]}</p>

          <p className="t-small mt-3 text-stone">
            Taking this makes your own copy. {q.friend}{" "}is not told where
            you go with it, and your walk stays yours.
          </p>

          {/* Straight through to the walk, stopping only if the walker is not
              where it begins. A shared quest carries no route of its own yet,
              so it hands off to the quest it previews. */}
          <div className="mt-5">
            <StartGate
              questId={shown?.id ?? "q-cloonanaha"}
              start={shown?.start}
              startName={shown?.startName ?? q.townland}
              label="Try this quest"
            />
          </div>
        </>
      )}
    </Screen>
  );
}

/** Local stat tile. Three across, mono value over a label, which is the same
 *  shape the quest screen uses for its own numbers. */
function Card2({ value, label, small = false }: { value: string; label: string; small?: boolean }) {
  return (
    <div className="border border-rule bg-surface p-2.5" style={{ borderRadius: "var(--r-md)" }}>
      {small ? (
        <p className="t-small font-semibold leading-tight text-ink">{value}</p>
      ) : (
        <Data className="block text-ink">{value}</Data>
      )}
      <Label className="mt-1 block" style={{ fontSize: 9 }}>{label}</Label>
    </div>
  );
}
