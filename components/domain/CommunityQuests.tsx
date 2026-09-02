"use client";
import { Card } from "@/components/primitives/Card";
import { Mark } from "@/components/primitives/Marks";
import { Plate } from "@/components/primitives/Plate";
import { ShapeChip } from "@/components/primitives/ShapeChip";
import { Data } from "@/components/primitives/Text";
import { Skeleton } from "@/components/primitives/States";
import { data } from "@/lib/data";
import { formatDistance } from "@/lib/walking";
import { useAsync } from "@/hooks/use-async";

/** Preset quests other people made. Plates are square without exception, so
 *  the grid never jitters as it loads and a contributor cannot change the
 *  layout by uploading a tall photograph. */
export function CommunityQuests() {
  const quests = useAsync(() => data.getCommunityQuests(), []);
  const list = quests.data ?? [];

  if (quests.loading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Skeleton h={188} /><Skeleton h={188} /><Skeleton h={188} /><Skeleton h={188} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {list.map((q) => (
        <Card key={q.id} inset={false} className="overflow-hidden">
          <Plate ratio="1/1" plate={q.plate} label={q.townland} sizes="50vw"
            className="rounded-none border-0 border-b border-rule" />
          <div className="flex flex-col gap-1.5 p-2.5">
            <p className="text-[11px] font-semibold uppercase leading-tight tracking-[0.04em] text-ink">
              {q.title}
            </p>
            <div className="flex items-center gap-1.5 text-mute">
              <Mark name={q.tier} size={12} />
              <Data className="text-[10px] uppercase">
                {formatDistance(q.distanceM)}
              </Data>
            </div>
            <ShapeChip shape={q.shape} tip={false} />
            {/* The same two glyphs the map uses for a person and for the
                community, so a contributor and a walker count read the same
                wherever they appear. */}
            <div className="flex items-center gap-2.5 text-stone">
              <span className="flex items-center gap-1">
                <Mark name="user" size={12} />
                <Data className="text-[10px] uppercase">{q.author}</Data>
              </span>
              <span className="flex items-center gap-1">
                <Mark name="friends" size={12} />
                <Data className="text-[10px] uppercase">{q.walkers}</Data>
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
