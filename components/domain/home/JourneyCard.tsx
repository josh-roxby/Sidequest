import { Card } from "@/components/primitives/Card";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { ProgressBar } from "@/components/primitives/ProgressBar";
import { Backpack } from "@/components/illustrations/Backpack";
import { Illustration } from "@/components/illustrations/Illustration";

interface JourneyCardProps {
  level: number;
  title: string;
  xp: number;
  xpToNext: number;
}

/** "Your Journey" card on the Home screen. Backpack badge + level/title +
 *  XP bar + caption. See design doc §5.1 (and the Profile hero card uses
 *  the same idea with a different illustration). */
export function JourneyCard({ level, title, xp, xpToNext }: JourneyCardProps) {
  const value = xpToNext === 0 ? 0 : Math.min(1, xp / xpToNext);
  return (
    <Card variant="lg" hero>
      <Eyebrow className="mb-3">// Your Journey</Eyebrow>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-sage-light shadow-pop">
          <Illustration
            src="/illustrations/backpack.png"
            fallback={<Backpack size={48} />}
            alt=""
            className="h-12 w-12 object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
            Level {level}
          </p>
          <p className="font-display text-[20px] font-semibold leading-tight text-text-primary">
            {title}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        <ProgressBar
          value={value}
          label={`Level ${level} progress: ${xp} of ${xpToNext} XP`}
        />
        <p className="text-[11px] text-text-secondary">
          {xp.toLocaleString()} / {xpToNext.toLocaleString()} XP
        </p>
      </div>
    </Card>
  );
}
