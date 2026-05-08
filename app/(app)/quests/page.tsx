import { Camera, Star } from "lucide-react";
import { Card } from "@/components/primitives/Card";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { Pill } from "@/components/primitives/Pill";
import { ProgressBar } from "@/components/primitives/ProgressBar";
import { Button } from "@/components/primitives/Button";
import { FlowerMedallion } from "@/components/marks/FlowerMedallion";
import { ScreenContainer } from "@/components/shell/ScreenContainer";

export default function QuestsScreen() {
  return (
    <ScreenContainer>
      <div className="py-4">
        <Eyebrow>// Quests</Eyebrow>
        <h1 className="font-display text-[26px] font-semibold text-text-primary">
          Today&apos;s side quest
        </h1>
        <p className="mt-1 text-[13px] text-text-secondary">
          One small act of curiosity.
        </p>
      </div>

      <Eyebrow className="mt-2">// Current Quest</Eyebrow>
      <Card variant="lg" hero className="mt-2">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <FlowerMedallion size={84} />
            <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-gold-soft shadow-pop">
              <Star size={14} strokeWidth={2.2} className="text-white" fill="currentColor" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[20px] font-semibold leading-tight text-text-primary">
              Find something purple
            </h2>
            <p className="mt-1 text-[13px] italic text-text-secondary">
              It could be a flower, a door, a bike — anything.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Pill tone="lavender">+15 XP</Pill>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <ProgressBar value={0} label="Quest progress" />
          <p className="text-[11px] text-text-muted">Tap when you find it.</p>
        </div>

        <div className="mt-4">
          <Button
            variant="primary"
            fullWidth
            leadingIcon={<Camera size={18} strokeWidth={2} />}
          >
            I found it!
          </Button>
        </div>
      </Card>

      <Eyebrow className="mt-6">// Quest History</Eyebrow>
      <Card variant="soft" className="mt-2">
        <p className="text-[13px] text-text-secondary">
          Past quests will land here once you start your first walk.
        </p>
      </Card>
    </ScreenContainer>
  );
}
