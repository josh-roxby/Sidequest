"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/primitives/Button";
import { Plate } from "@/components/primitives/Plate";
import { Data, Label } from "@/components/primitives/Text";
import type { Lore } from "@/lib/data";

/** One card at a time, swiped or stepped.
 *
 *  Built on native scroll snap rather than a transform carousel: it gives real
 *  momentum, respects the platform's own overscroll feel, and keeps every card
 *  in the accessibility tree and reachable by keyboard, which a transform
 *  track with hidden slides does not. The arrows scroll the same container, so
 *  there is one source of truth for position. */
export function TaleCarousel({ cards, plate }: { cards: Lore[]; plate?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  const goTo = useCallback((i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const next = Math.max(0, Math.min(cards.length - 1, i));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  }, [cards.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(index + 1);
      if (e.key === "ArrowLeft") goTo(index - 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [goTo, index]);

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="gesture -mx-4 flex snap-x snap-mandatory overflow-x-auto scroll-smooth px-4"
        style={{ scrollbarWidth: "none", touchAction: "pan-x" }}
        aria-roledescription="carousel"
      >
        {cards.map((c, i) => (
          <article
            key={c.title}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${cards.length}`}
            className="w-full shrink-0 snap-center pr-2 last:pr-0"
          >
            <div className="flex flex-col overflow-hidden border border-rule bg-surface"
              style={{ borderRadius: "var(--r-md)" }}>
              <Plate ratio="16/9" plate={plate} label={c.kind} className="rounded-none border-0 border-b border-rule" />
              <div className="flex flex-col gap-2 p-4">
                <Label>{c.kind}</Label>
                <h3 className="t-h2 text-ink">{c.title}</h3>
                {/* Share-alike and non-commercial sources are outbound links,
                    never embedded text. Enforced at the data layer; this just
                    renders what it is given. docs/PRD.md §8.12. */}
                {c.linkOnly ? (
                  <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer"
                     className="t-small text-rust underline">
                    Read this one at {c.sourceName}
                  </a>
                ) : (
                  <p className="selectable t-body text-ink">{c.body}</p>
                )}
                <p className="t-data mt-1 text-[10px] uppercase text-mute">
                  {c.sourceName} · {c.licence}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button aria-label="Previous" onClick={() => goTo(index - 1)} disabled={index === 0}>←</Button>
        <div className="flex flex-1 items-center justify-center gap-1.5" aria-hidden>
          {cards.map((c, i) => (
            <span
              key={c.title}
              className="h-1.5 transition-all"
              style={{
                width: i === index ? 18 : 6,
                borderRadius: "var(--r-full)",
                background: i === index ? "var(--field)" : "var(--rule)",
                transitionDuration: "var(--dur-state)",
              }}
            />
          ))}
        </div>
        <Data className="text-[11px] uppercase text-mute">{index + 1} / {cards.length}</Data>
        <Button aria-label="Next" onClick={() => goTo(index + 1)} disabled={index === cards.length - 1}>→</Button>
      </div>
    </div>
  );
}
