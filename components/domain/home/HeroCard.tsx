import { Card } from "@/components/primitives/Card";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { Illustration } from "@/components/illustrations/Illustration";
import { Landscape } from "@/components/illustrations/Landscape";

interface HeroCardProps {
  /** e.g. "62°F · partly sunny · light breeze" */
  weather?: string;
  greeting?: string;
}

/** Top-of-home hero card. Painted landscape (with SVG fallback),
 *  Fraunces headline, weather subline. See design doc §5.1. */
export function HeroCard({
  weather = "62°F · partly sunny",
  greeting = "Where shall we wander today?",
}: HeroCardProps) {
  return (
    <Card variant="lg" hero className="overflow-hidden p-0">
      <div className="aspect-[16/9] w-full overflow-hidden">
        <Illustration
          src="/illustrations/landscape-home.png"
          fallback={<Landscape className="h-full w-full" />}
          alt=""
          className="h-full w-full"
        />
      </div>
      <div className="p-5">
        <Eyebrow className="mb-2">Today</Eyebrow>
        <h2 className="font-display text-[22px] font-semibold leading-snug text-text-primary">
          {greeting}
        </h2>
        <p className="mt-1 text-[13px] text-text-secondary">{weather}</p>
      </div>
    </Card>
  );
}
