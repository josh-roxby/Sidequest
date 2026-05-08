import { cn } from "@/lib/cn";

interface ProgressBarProps {
  /** 0..1 */
  value: number;
  className?: string;
  /** ARIA-label for screen readers when there's no visible caption. */
  label?: string;
}

/** 1.5px tall sage-light track with primary→light gradient fill,
 *  700ms width transition. See design doc §4.8. */
export function ProgressBar({ value, className, label }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label}
      className={cn("h-[1.5px] w-full overflow-hidden rounded-full bg-sage-light", className)}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
