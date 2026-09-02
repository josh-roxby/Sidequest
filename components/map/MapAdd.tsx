"use client";
import { useState } from "react";
import { Action } from "@/components/primitives/Action";
import { Field } from "@/components/primitives/Field";
import { Data, Label } from "@/components/primitives/Text";
import { Frame } from "@/components/shell/Frame";
import type { LatLng } from "@/lib/data";
import { data, type Quest } from "@/lib/data";
import { cn } from "@/lib/cn";

export type AddMode = null | "note" | "point";

/** The two add drawers. The button and its menu live in the dock; these are
 *  rendered by the page at the top level, outside any positioned container.
 *
 *  That placement is the fix for the stacking bug: a container with a z-index
 *  opens a stacking context, and a fixed child of it cannot escape however
 *  high its own z-index goes. The frames were mounted inside the dock's
 *  wrapper and were landing underneath the nav.
 *
 *  Two things, deliberately kept apart. A note is yours: nobody else ever sees
 *  it, so it saves immediately. A community point is a claim about a real place
 *  on other people's maps, so it goes to review first. Collapsing the two into
 *  one add flow would blur the difference, and the difference is the whole
 *  reason the second one is trustworthy. */
export function MapAdd({
  mode,
  setMode,
  quests,
  at,
  onAdded,
}: {
  mode: AddMode;
  setMode: (m: AddMode) => void;
  quests: Quest[];
  /** Where the pin lands. The centre of the map for now; the live position
   *  once slice 6 lands. */
  at: LatLng;
  onAdded: () => void;
}) {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [questId, setQuestId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  function reset() {
    setMode(null); setText(""); setTitle(""); setDesc(""); setQuestId(null); setSent(false);
  }

  async function saveNote() {
    if (!text.trim()) return;
    setSaving(true);
    const q = quests.find((x) => x.id === questId) ?? null;
    await data.addNote({
      walkId: null,
      questTitle: q?.title ?? null,
      text: text.trim(),
      atM: 0,
      lat: at.lat,
      lng: at.lng,
    });
    setSaving(false);
    reset();
    onAdded();
  }

  async function savePoint() {
    if (!title.trim()) return;
    setSaving(true);
    await data.addCommunityPoint({
      title: title.trim(), description: desc.trim(), author: "Josh", lat: at.lat, lng: at.lng,
    });
    setSaving(false);
    setSent(true);
    onAdded();
  }

  return (
    <>

      <Frame
        open={mode === "note"}
        onDismiss={reset}
        label="Pinned here"
        title="Note this"
        action={<Action loading={saving} onClick={saveNote} disabled={!text.trim()}>Pin it here</Action>}
      >
        <div className="flex flex-col gap-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="A heron on the stream. The gate that sticks."
            className="selectable w-full resize-none border border-ink bg-surface p-3 text-[15px] leading-snug text-ink placeholder:text-mute"
            style={{ borderRadius: "var(--r-sm)" }}
          />
          <div>
            <Label>Attach to a quest</Label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Pill on={questId === null} onClick={() => setQuestId(null)}>None</Pill>
              {quests.map((q) => (
                <Pill key={q.id} on={questId === q.id} onClick={() => setQuestId(q.id)}>
                  {q.title}
                </Pill>
              ))}
            </div>
          </div>
        </div>
      </Frame>

      <Frame
        open={mode === "point"}
        onDismiss={reset}
        ratio="tall"
        label={sent ? "Sent for review" : "Here"}
        title={sent ? "Thanks" : "A community point"}
        action={sent
          ? <Action tone="outline" onClick={reset}>Done</Action>
          : <Action loading={saving} onClick={savePoint} disabled={!title.trim()}>Submit for review</Action>}
      >
        {sent ? (
          <div className="flex flex-col gap-3">
            <p className="t-body text-ink">
              It is on your map now with a pending mark. Once it is reviewed it
              appears for everyone walking here.
            </p>
            <p className="t-small text-stone">
              Review is not us being precious. A map of real places that anyone
              can write on stops being a map worth trusting.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Field label="What is it" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="The clapper bridge" />
            <div>
              <Label>A line or two</Label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={4}
                placeholder="Flat slabs across the stream below the ford. Older than the road beside it."
                className="selectable mt-1.5 w-full resize-none border border-ink bg-surface p-3 text-[15px] leading-snug text-ink placeholder:text-mute"
                style={{ borderRadius: "var(--r-sm)" }}
              />
            </div>
            <Data className="text-[10px] uppercase text-mute">
              Pinned at where you are standing
            </Data>
            <p className="t-small border-t border-rule pt-3 text-stone">
              Once reviewed this will be available for every sidequester.
            </p>
          </div>
        )}
      </Frame>
    </>
  );
}


function Pill({ on, onClick, children }: {
  on: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={cn("border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.05em]",
        on ? "border-field bg-field text-field-ink" : "border-rule bg-surface text-stone")}
      style={{ borderRadius: "var(--r-full)" }}>
      {children}
    </button>
  );
}
