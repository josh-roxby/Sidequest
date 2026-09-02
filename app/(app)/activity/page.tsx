"use client";
import { Mark } from "@/components/primitives/Marks";
import { Data } from "@/components/primitives/Text";
import { Skeleton } from "@/components/primitives/States";
import { Screen, ScreenHead } from "@/components/shell/Screen";
import { ACTIVITY_MARK } from "@/lib/activity";
import { data } from "@/lib/data";
import { useAsync } from "@/hooks/use-async";

/** What everyone else is up to.
 *
 *  A flat list and nothing else. No cards, no avatars, no detail pages behind
 *  each row, and first names only. The job is to make the place feel inhabited,
 *  and the moment a feed grows affordances it starts asking to be worked
 *  through rather than glanced at.
 *
 *  Every line is one line. Long ones ellipsise rather than wrap, because a
 *  ragged column stops reading as a pulse. */
export default function ActivityScreen() {
  const activity = useAsync(() => data.getActivity(), []);
  const list = activity.data ?? [];

  return (
    <Screen>
      <ScreenHead label="Community" title="What is happening" />

      {activity.loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} h={22} />)}
        </div>
      ) : (
        <ul className="flex flex-col">
          {list.map((e) => (
            <li key={e.id}
              className="flex items-center gap-2.5 border-b border-rule py-2.5 last:border-b-0">
              <span className="shrink-0 text-mute"><Mark name={ACTIVITY_MARK[e.kind]} size={13} /></span>
              <span className="t-small min-w-0 flex-1 truncate text-ink">{e.text}</span>
              <Data className="shrink-0 text-[10px] uppercase text-mute">{e.at}</Data>
            </li>
          ))}
        </ul>
      )}

      <p className="t-small mt-5 text-stone">
        First names only. Nobody&apos;s route or location is ever shown here.
      </p>
    </Screen>
  );
}
