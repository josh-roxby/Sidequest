import { Mark, type MarkName } from "./Marks";
import { cn } from "@/lib/cn";

export interface MarqueeItem {
  mark: MarkName;
  text: string;
}

/** Continuously scrolling strip of tiles.
 *
 *  The track holds the items twice and translates by exactly -50%, so the
 *  second copy is in the first copy's starting position at the moment the
 *  animation resets. That is what makes the loop seamless: there is no jump to
 *  hide, because the two frames are pixel-identical. Any other duplication
 *  scheme leaves a visible seam.
 *
 *  Each update is a bordered tile with its own glyph rather than a run of text
 *  separated by a gap. A moving strip gives the eye no time to find where one
 *  update ends and the next begins, and a gap alone does not do it; the glyph
 *  also says what kind of thing happened before the words are read, which is
 *  the same job it does on the activity page.
 *
 *  Duration scales with item count rather than being fixed, so adding an
 *  update slows the strip down instead of speeding every item past. */
export function Marquee({
  items,
  className,
  secondsPerItem = 5,
}: {
  items: MarqueeItem[];
  className?: string;
  secondsPerItem?: number;
}) {
  if (items.length === 0) return null;
  const doubled = [...items, ...items];

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      // The list is decorative repetition; a screen reader gets it once, from
      // the activity page this links to.
      aria-hidden
    >
      <div
        className="flex w-max shrink-0 items-center gap-1.5 whitespace-nowrap"
        style={{
          animation: `sq-marquee ${items.length * secondsPerItem}s linear infinite`,
        }}
      >
        {doubled.map((it, i) => (
          <span
            key={`${it.text}-${i}`}
            className="flex items-center gap-1.5 border border-rule bg-surface-2 px-2 py-1 text-stone"
            style={{ borderRadius: "var(--r-sm)" }}
          >
            <Mark name={it.mark} size={11} />
            <span className="t-data text-[10px] uppercase">{it.text}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
