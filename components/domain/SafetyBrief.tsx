"use client";
import { useRef, useState } from "react";
import { Action } from "@/components/primitives/Action";
import { Mark } from "@/components/primitives/Marks";
import { Data, Label } from "@/components/primitives/Text";
import { Frame } from "@/components/shell/Frame";
import { cn } from "@/lib/cn";
import { acknowledge } from "@/lib/safety";
import { BRIEF, QUESTIONS } from "@/lib/safety-brief";

/** The safety brief, shown once before a walker's first quest.
 *
 *  There is a question at the end and the accept is disabled until it is
 *  answered correctly. That is deliberate and it is not a dark pattern in
 *  reverse: a tick box records that someone saw a screen, and a question
 *  records that they read it. We are sending people onto unlit boreens and
 *  across land where there is no right to roam, so the difference matters.
 *
 *  Multi select, and the whole set has to be right. A question you can pass by
 *  ticking every box is not a question. A wrong answer sends them back to the
 *  brief with a pointer rather than failing them. */
export function SafetyBrief({
  open,
  onAccept,
  onDismiss,
}: {
  open: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  /** Drawn once per mount rather than per render, so the question does not
   *  change under someone mid-answer. */
  const [q] = useState(() => QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]);
  const [picked, setPicked] = useState<string[]>([]);
  const [wrong, setWrong] = useState(false);
  const [suppress, setSuppress] = useState(true);
  const bodyRef = useRef<HTMLDivElement>(null);

  const toggle = (id: string) => {
    setWrong(false);
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const correct = q.options.filter((o) => o.correct).map((o) => o.id);
  const isRight =
    picked.length === correct.length && correct.every((id) => picked.includes(id));

  /** Enabled as soon as they have answered, not once they have answered
   *  correctly. A button that only lights up on the right answer never lets a
   *  wrong one happen, so it can never send anyone back to reread, which is
   *  the whole point of asking. */
  function accept() {
    if (!isRight) {
      setWrong(true);
      /* Back to the top of the brief, because "have another read" should put
         the reading in front of them rather than just say the words. */
      bodyRef.current?.closest("[role=dialog]")?.querySelector(".overflow-y-auto")
        ?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    acknowledge(suppress);
    onAccept();
  }

  return (
    <Frame
      open={open}
      onDismiss={onDismiss}
      ratio="tall"
      label="We care about you"
      title="Before you set off"
      action={
        <Action onClick={accept} disabled={picked.length === 0}>
          {picked.length === 0 ? "Answer to continue" : "I have read this"}
        </Action>
      }
    >
      <div ref={bodyRef} className="flex flex-col gap-4">
        <p className="t-body text-ink">
          Take a minute with this so you can enjoy the walk knowing you have
          thought about it. It appears once.
        </p>

        <div className="flex flex-col">
          {BRIEF.map((b) => (
            <div key={b.title} className="flex gap-2.5 border-b border-rule py-3 last:border-b-0">
              <span className="mt-0.5 shrink-0 text-stone"><Mark name={b.mark} size={15} /></span>
              <span className="min-w-0">
                <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-ink">
                  {b.title}
                </p>
                <p className="selectable t-small mt-1 text-stone">{b.body}</p>
              </span>
            </div>
          ))}
        </div>

        <div className="border border-ink bg-surface-2 p-3" style={{ borderRadius: "var(--r-md)" }}>
          <Label>One question, so we know it landed</Label>
          <p className="t-body mt-1.5 text-ink">{q.prompt}</p>
          <Data className="mt-1 block text-[10px] uppercase text-mute">Select all that apply</Data>

          <div className="mt-3 flex flex-col gap-1.5">
            {q.options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => toggle(o.id)}
                aria-pressed={picked.includes(o.id)}
                className={cn(
                  "flex min-h-[44px] items-center gap-2.5 border px-3 py-2 text-left active:scale-[0.995]",
                  picked.includes(o.id)
                    ? "border-field bg-field-soft text-ink"
                    : "border-rule bg-surface text-stone",
                )}
                style={{ borderRadius: "var(--r-sm)", transitionDuration: "var(--dur-tap)" }}
              >
                <span
                  aria-hidden
                  className={cn("flex h-4 w-4 shrink-0 items-center justify-center border",
                    picked.includes(o.id) ? "border-field bg-field" : "border-rule")}
                  style={{ borderRadius: "var(--r-sm)" }}
                >
                  {picked.includes(o.id) ? (
                    <span className="text-[10px] leading-none text-field-ink">✓</span>
                  ) : null}
                </span>
                <span className="t-small">{o.label}</span>
              </button>
            ))}
          </div>

          {wrong ? (
            <p className="t-small mt-3 border-l-2 border-rust pl-3 text-stone">
              Not quite. Have another read and try again. {q.hint}
            </p>
          ) : null}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setSuppress((v) => !v)}
            aria-pressed={suppress}
            className="flex min-h-[44px] w-full items-center gap-2.5 text-left"
          >
            <span
              aria-hidden
              className={cn("flex h-5 w-5 shrink-0 items-center justify-center border",
                suppress ? "border-field bg-field" : "border-rule")}
              style={{ borderRadius: "var(--r-sm)" }}
            >
              {suppress ? <span className="text-[11px] leading-none text-field-ink">✓</span> : null}
            </span>
            <span className="t-small text-ink">Do not show this again</span>
          </button>
          <p className="t-small text-stone">
            Leave this off to see the brief before every walk. You can turn it
            back on in Settings.
          </p>
        </div>

        <p className="t-small text-stone">
          Accepting records that you read this. It does not make us responsible
          for the ground under your feet: you are the one out there and the call
          is always yours.
        </p>
      </div>
    </Frame>
  );
}
