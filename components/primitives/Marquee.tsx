import { cn } from "@/lib/cn";

/** Continuously scrolling strip.
 *
 *  The track holds the items twice and translates by exactly -50%, so the
 *  second copy is in the first copy's starting position at the moment the
 *  animation resets. That is what makes the loop seamless: there is no jump to
 *  hide, because the two frames are pixel-identical. Any other duplication
 *  scheme leaves a visible seam.
 *
 *  Duration scales with item count rather than being fixed, so adding an
 *  update slows the strip down instead of speeding every item past. */
export function Marquee({
  items,
  className,
  secondsPerItem = 5,
}: {
  items: string[];
  className?: string;
  secondsPerItem?: number;
}) {
  if (items.length === 0) return null;
  const doubled = [...items, ...items];

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      // The list is decorative repetition; a screen reader gets it once, from
      // the visually hidden copy below.
      aria-hidden
    >
      <div
        className="flex w-max shrink-0 items-center gap-8 whitespace-nowrap"
        style={{
          animation: `sq-marquee ${items.length * secondsPerItem}s linear infinite`,
        }}
      >
        {doubled.map((t, i) => (
          <span key={`${t}-${i}`} className="t-data text-[10px] uppercase text-stone">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
