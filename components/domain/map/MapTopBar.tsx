import { ChevronDown, Footprints, SlidersHorizontal } from "lucide-react";

interface MapTopBarProps {
  distance: string;
}

/** Map screen top controls — distance pill (footprints + value + chevron)
 *  on the left, filter button on the right. See design doc §5.2. */
export function MapTopBar({ distance }: MapTopBarProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between px-4 pt-3">
      <button
        type="button"
        className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-[rgba(255,255,255,0.96)] px-3 py-2 text-[13px] font-medium text-text-primary shadow-pop backdrop-blur-[6px]"
      >
        <Footprints size={14} strokeWidth={1.9} className="text-primary" />
        <span className="font-display tabular-nums">{distance}</span>
        <ChevronDown size={14} strokeWidth={1.8} className="text-text-muted" />
      </button>

      <button
        type="button"
        aria-label="Filter map"
        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-border bg-[rgba(255,255,255,0.96)] shadow-pop backdrop-blur-[6px]"
      >
        <SlidersHorizontal size={16} strokeWidth={1.9} className="text-text-secondary" />
      </button>
    </div>
  );
}
