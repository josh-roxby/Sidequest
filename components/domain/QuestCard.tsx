import Link from "next/link";
import { Card } from "@/components/primitives/Card";
import { Plate } from "@/components/primitives/Plate";
import { Data } from "@/components/primitives/Text";
import type { Quest } from "@/lib/data";

/** Thumbnail left, uppercase title, one line of description, progress in
 *  mono. A rust corner ribbon marks the active or saved quest. The whole card
 *  is the tap target. docs/design-system.md §I-2. */
export function QuestCard({
  quest,
  done = 0,
  flag = false,
}: {
  quest: Quest;
  done?: number;
  flag?: boolean;
}) {
  const total = quest.objectives.length;
  return (
    <Link href={`/quests/${quest.id}`} className="block active:scale-[0.99]"
      style={{ transitionDuration: "var(--dur-tap)" }}>
      <Card flag={flag} className="flex gap-3.5">
        <Plate ratio="1/1" label={quest.townland} className="w-[72px] shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.05em] text-ink">
            {quest.title}
          </h3>
          <p className="t-small mt-1 line-clamp-2 text-stone">{quest.flavour}</p>
          <div className="mt-2 flex items-center gap-2.5">
            <Data className="text-stone">{done} / {total}</Data>
            <Data className="text-[11px] uppercase text-mute">
              {(quest.distanceM / 1000).toFixed(1)} km · {quest.durationMin} min
            </Data>
          </div>
        </div>
      </Card>
    </Link>
  );
}
