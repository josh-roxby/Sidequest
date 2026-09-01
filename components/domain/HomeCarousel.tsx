"use client";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { Plate } from "@/components/primitives/Plate";
import { Label } from "@/components/primitives/Text";
import { Skeleton } from "@/components/primitives/States";
import type { CardRatio, HomeCard } from "@/lib/data";

/** Mixed-ratio cards, all the same height, scrolled left to right.
 *
 *  Sizing runs off `aspect-ratio` with `height: 100%` and `width: auto`, so
 *  the browser derives each card's width from the height the flex row happens
 *  to give it. That is what lets a portrait quest card, a square update and a
 *  landscape banner sit in one row with their tops and bottoms flush at any
 *  screen height, with no measuring in JavaScript.
 *
 *  Snap is `start`, not `center`: cards align to the page's left gutter, so
 *  the row reads as a shelf rather than as a slideshow. */
const RATIO: Record<CardRatio, string> = {
  portrait: "9 / 16",
  square: "1 / 1",
  landscape: "16 / 9",
};

export function HomeCarousel({ cards, loading }: { cards: HomeCard[]; loading: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // Nearest card start to the current scroll position, since widths differ.
    let best = 0;
    let bestD = Infinity;
    Array.from(el.children).forEach((c, i) => {
      const d = Math.abs((c as HTMLElement).offsetLeft - el.scrollLeft - 16);
      if (d < bestD) { bestD = d; best = i; }
    });
    setIndex(best);
  }, []);

  if (loading) {
    return (
      <div className="flex h-full gap-2">
        <Skeleton className="h-full" h={0} />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div
        ref={ref}
        onScroll={onScroll}
        className="gesture -mx-4 flex min-h-0 flex-1 snap-x snap-mandatory gap-2 overflow-x-auto px-4"
        style={{ scrollbarWidth: "none", touchAction: "pan-x" }}
      >
        {cards.map((c) => (
          <Link
            key={c.id}
            href={c.href}
            className="relative flex h-full shrink-0 snap-start flex-col overflow-hidden border border-rule bg-surface active:scale-[0.99]"
            style={{
              aspectRatio: RATIO[c.ratio],
              width: "auto",
              maxWidth: "calc(100vw - 48px)",
              borderRadius: "var(--r-md)",
              transitionDuration: "var(--dur-tap)",
            }}
          >
            <Plate
              ratio={c.ratio === "portrait" ? "1/1" : c.ratio === "square" ? "1/1" : "16/9"}
              plate={c.plate}
              label={c.eyebrow}
              className="shrink-0 rounded-none border-0 border-b border-rule"
            />
            <div className="flex min-h-0 flex-1 flex-col justify-end gap-1 p-3">
              <Label style={{ fontSize: 9 }}>{c.eyebrow}</Label>
              <p className="text-[13px] font-semibold leading-tight text-ink">{c.title}</p>
              {c.body ? (
                <p className="t-small line-clamp-3 leading-snug text-stone">{c.body}</p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>

      <div className="flex shrink-0 items-center justify-center gap-1.5" aria-hidden>
        {cards.map((c, i) => (
          <span
            key={c.id}
            className="h-1 transition-all"
            style={{
              width: i === index ? 16 : 5,
              borderRadius: "var(--r-full)",
              background: i === index ? "var(--field)" : "var(--rule)",
              transitionDuration: "var(--dur-state)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
