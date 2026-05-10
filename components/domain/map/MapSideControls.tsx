import { Crosshair, Layers, Navigation } from "lucide-react";

/** Right-column floating controls on the map — see design doc §5.2.
 *  Vertically centred stack of three 40px white circular buttons with
 *  `pop` shadow. */
export function MapSideControls() {
  return (
    <div className="pointer-events-none absolute right-3 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-2">
      <button
        type="button"
        aria-label="Navigate"
        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-border bg-[rgba(255,255,255,0.96)] shadow-pop"
      >
        <Navigation size={16} strokeWidth={1.9} className="text-primary" />
      </button>
      <button
        type="button"
        aria-label="Map layers"
        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-border bg-[rgba(255,255,255,0.96)] shadow-pop"
      >
        <Layers size={16} strokeWidth={1.9} className="text-text-secondary" />
      </button>
      <button
        type="button"
        aria-label="Centre on my location"
        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-border bg-[rgba(255,255,255,0.96)] shadow-pop"
      >
        <Crosshair size={16} strokeWidth={1.9} className="text-text-secondary" />
      </button>
    </div>
  );
}
