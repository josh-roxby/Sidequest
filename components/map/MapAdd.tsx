"use client";
import { useState } from "react";
import { Action } from "@/components/primitives/Action";
import { Field } from "@/components/primitives/Field";
import { Mark } from "@/components/primitives/Marks";
import { Data, Label } from "@/components/primitives/Text";
import { Frame } from "@/components/shell/Frame";
import { data, type Quest } from "@/lib/data";
import { cn } from "@/lib/cn";

type Mode = null | "choose" | "note" | "point";

/** Add something to the map from where you are standing.
 *
 *  Two things, deliberately kept apart. A note is yours: nobody else ever sees
 *  it, so it saves immediately. A community point is a claim about a real place
 *  on other people's maps, so it goes to review first. Collapsing the two into
 *  one "add" flow would blur the difference, and the difference is the whole
 *  reason the second one is trustworthy. */
export function MapAdd({
  quests,
  at,
  onAdded,
}: {
  quests: Quest[];
  at: { x: number; y: number };
  onAdded: () => void;
}) {
  const [mode, setMode] = useState<Mode>(null);
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
      x: at.x,
      y: at.y,
    });
    setSaving(false);
    reset();
    onAdded();
  }

  async function savePoint() {
    if (!title.trim()) return;
    setSaving(true);
    await data.addCommunityPoint({
      title: title.trim(), description: desc.trim(), author: "Josh", x: at.x, y: at.y,
    });
    setSaving(false);
    setSent(true);
    onAdded();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setMode("choose")}
        aria-label="Add to the map"
        className="flex h-11 w-11 items-center justify-center border border-field bg-field text-field-ink active:scale-[0.97]"
        style={{ borderRadius: "var(--r-sm)", transitionDuration: "var(--dur-tap)" }}
      >
        <Mark name="plus" size={18} />
      </button>

      <Frame
        open={mode === "choose"}
        onDismiss={reset}
        label="Here"
        title="Add to the map"
      >
        <div className="flex flex-col gap-2">
          <Choice
            mark="note" tone="ink" title="A note"
            line="Just for you. Nobody else ever sees it."
            onClick={() => setMode("note")}
          />
          <Choice
            mark="friends" tone="rust" title="A community point"
            line="A real place worth knowing. Reviewed before it appears for anyone else."
            onClick={() => setMode("point")}
          />
        </div>
      </Frame>

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
          </div>
        )}
      </Frame>
    </>
  );
}

function Choice({
  mark, tone, title, line, onClick,
}: {
  mark: "note" | "friends"; tone: "ink" | "rust"; title: string; line: string; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-start gap-3 border border-rule bg-surface p-3.5 text-left active:bg-field-soft"
      style={{ borderRadius: "var(--r-md)" }}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center border"
        style={{
          borderRadius: "var(--r-full)",
          borderColor: tone === "rust" ? "var(--rust)" : "var(--ink)",
          color: tone === "rust" ? "var(--rust)" : "var(--ink)",
        }}>
        <Mark name={mark} size={16} />
      </span>
      <span className="min-w-0">
        <p className="t-small font-semibold text-ink">{title}</p>
        <p className="t-small mt-0.5 text-stone">{line}</p>
      </span>
    </button>
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
