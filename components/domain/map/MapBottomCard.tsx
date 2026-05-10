import { X } from "lucide-react";
import { Card } from "@/components/primitives/Card";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { ProgressBar } from "@/components/primitives/ProgressBar";
import { Button } from "@/components/primitives/Button";

interface MapBottomCardProps {
  walkName: string;
  distance: string;
  duration: string;
  difficulty: string;
  /** 0..1 */
  progress: number;
}

/** Floating bottom card on the map screen. Eyebrow + walk name +
 *  three-column stat row + progress + End Walk button. Sits above the
 *  bottom nav (which is at bottom-2). See design doc §5.2. */
export function MapBottomCard({
  walkName,
  distance,
  duration,
  difficulty,
  progress,
}: MapBottomCardProps) {
  return (
    <div className="pointer-events-none absolute inset-x-3 z-30" style={{ bottom: "72px" }}>
      <Card variant="lg" hero className="pointer-events-auto">
        <Eyebrow className="mb-1.5">Current Walk</Eyebrow>
        <h2 className="font-display text-[18px] font-semibold leading-tight text-text-primary">
          {walkName}
        </h2>

        <div className="mt-3 grid grid-cols-3 divide-x divide-border">
          <Stat label="Distance" value={distance} />
          <Stat label="Time" value={duration} />
          <Stat label="Difficulty" value={difficulty} />
        </div>

        <div className="mt-3 space-y-1">
          <ProgressBar value={progress} label="Walk progress" />
          <p className="text-[10px] text-text-muted">{Math.round(progress * 100)}% complete</p>
        </div>

        <Button
          variant="primary"
          fullWidth
          className="mt-3"
          leadingIcon={<X size={15} strokeWidth={2.2} />}
        >
          End walk
        </Button>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 first:pl-0 last:pr-0">
      <p className="font-display text-[15px] font-semibold tabular-nums text-text-primary">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-text-muted">
        {label}
      </p>
    </div>
  );
}
