import { SHAPE_HINT, SHAPE_LABEL, type Shape } from "@/lib/walking";
import { Tooltip } from "./Tooltip";

/** Every quest is a loop or a line, and it says so. The chip is not decoration:
 *  knowing before you leave whether you finish where you started, or turn round
 *  and walk back, changes how people plan the hour. */
export function ShapeChip({ shape, tip = true }: { shape: Shape; tip?: boolean }) {
  const chip = (
    <span
      className="flex items-center gap-1.5 border border-rule bg-surface px-2 py-1"
      style={{ borderRadius: "var(--r-full)" }}
    >
      <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden
        fill="none" stroke="var(--field)" strokeWidth="1.6" strokeLinecap="square">
        {shape === "loop"
          ? <circle cx="6.5" cy="6.5" r="4.4" />
          : <><path d="M2 6.5h9" /><path d="M8.4 3.6 11 6.5 8.4 9.4" /></>}
      </svg>
      <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ink">
        {SHAPE_LABEL[shape]}
      </span>
    </span>
  );
  if (!tip) return chip;
  return <Tooltip text={SHAPE_HINT[shape]}>{chip}</Tooltip>;
}
