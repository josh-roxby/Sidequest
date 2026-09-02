"use client";
import { mediaSrc } from "@/lib/media";

/** The band of country along the foot of Home.
 *
 *  Each layer holds its artwork twice and translates by exactly -50%, the same
 *  trick as the activity marquee, so the loop has no seam of its own. That is
 *  also why the artwork itself has to tile: its right edge butts against its
 *  left edge every cycle. docs/design-system.md §H.
 *
 *  Layers are listed rather than discovered. A plate that does not tile cleanly
 *  produces a visible jump twice a minute, which is worse than one layer and no
 *  parallax, so a new layer joins this list only once it has been checked.
 *  `hills-near` is drawn and deliberately not listed: see docs/audit.md M-05. */
const LAYERS = [
  {
    key: "hills-far",
    /** Rendered height of the ridge itself. Also sets how much of the plate
     *  fits across the screen, since the artwork is scaled from it: taller
     *  means fewer, larger hills, and this ridge has to read as distance. */
    height: 46,
    /** How much of the plate's own height carries the ridge, measured from its
     *  top edge. The rest of the plate is transparent, so the artwork has to be
     *  scaled by this and anchored to its top or the ridge arrives as a
     *  seven pixel scratch with an empty band under it. */
    ink: 0.125,
    seconds: 150,
    opacity: 0.55,
  },
];

export function CountryBand() {
  return (
    <div aria-hidden className="pointer-events-none relative h-full w-full overflow-hidden">
      {LAYERS.map((l) => (
        <div
          key={l.key}
          className="absolute inset-x-0 bottom-0 overflow-hidden"
          style={{ height: l.height, opacity: l.opacity }}
        >
          <div
            className="flex h-full w-[200%]"
            style={{ animation: `sq-marquee ${l.seconds}s linear infinite` }}
          >
            {/* Twice, side by side. The second copy is what the first one
                becomes at the end of the cycle. */}
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-full w-1/2"
                style={{
                  backgroundImage: `url(${mediaSrc(l.key)})`,
                  backgroundRepeat: "repeat-x",
                  backgroundPosition: "left top",
                  backgroundSize: `auto ${Math.round(l.height / l.ink)}px`,
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
