"use client";
import Link from "next/link";
import { Card } from "@/components/primitives/Card";
import { Data, Label } from "@/components/primitives/Text";
import { EmptyState, Skeleton } from "@/components/primitives/States";
import { Button } from "@/components/primitives/Button";
import { data } from "@/lib/data";
import { formatDistance } from "@/lib/walking";
import { useAsync } from "@/hooks/use-async";

/** Every note, newest first, text only.
 *
 *  No map here on purpose. A note is a sentence you wanted to keep, and read
 *  as a run of sentences it becomes a diary of walks rather than a list of
 *  pins. The pin still exists on the walk it belongs to. */
export function NotesList() {
  const notes = useAsync(() => data.getNotes(), []);
  const list = [...(notes.data ?? [])].reverse();

  if (notes.loading) {
    return <div className="flex flex-col gap-2"><Skeleton h={82} /><Skeleton h={82} /></div>;
  }
  if (list.length === 0) {
    return (
      <EmptyState
        line="Nothing written down yet. On a walk, tap the note button to keep a moment."
        action={<Button>Find a stroll</Button>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {list.map((n) => (
        <Card key={n.id}>
          <div className="flex items-baseline justify-between gap-3">
            {n.walkId ? (
              <Link href={`/history/${n.walkId}`} className="min-w-0">
                <Label style={{ fontSize: 9 }}>{n.questTitle}</Label>
              </Link>
            ) : (
              <Label style={{ fontSize: 9 }} className="min-w-0">On the map</Label>
            )}
            <Data className="shrink-0 text-[10px] uppercase text-mute">{n.createdAt}</Data>
          </div>
          <p className="selectable t-body mt-1.5 text-ink">{n.text}</p>
          <Data className="mt-1.5 block text-[10px] uppercase text-mute">
            Pinned {formatDistance(n.atM)} in
          </Data>
        </Card>
      ))}
    </div>
  );
}
