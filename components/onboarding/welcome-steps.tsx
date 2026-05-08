/* Step content for the welcome carousel. Treat this file as
 * adjustable copy + visual slot — the carousel UI itself doesn't care
 * about the count or order.
 *
 * Each step ships with a custom illustration block. As painted assets
 * land we'll swap individual visuals over to <Illustration src=… />. */

import { CompassMark } from "@/components/marks/CompassMark";
import { FlowerMedallion } from "@/components/marks/FlowerMedallion";
import { Landscape } from "@/components/illustrations/Landscape";
import { ShieldBadge } from "@/components/marks/ShieldBadge";
import { PinFlower, PinLeaf } from "@/components/marks/Pins";

export interface WelcomeStep {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  visual: React.ReactNode;
}

function StepVisual({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-64 w-full items-center justify-center">
      <div className="absolute inset-0 -z-10 rounded-[40px] bg-gradient-to-b from-sage-light to-bg" />
      {children}
    </div>
  );
}

export const welcomeSteps: WelcomeStep[] = [
  {
    id: "welcome",
    eyebrow: "Side Quest",
    title: "Every walk holds a story.",
    body:
      "A peaceful adventure journal for the real world. Drop a pin, take a wander, and turn ordinary walks into small acts of curiosity.",
    visual: (
      <StepVisual>
        <CompassMark size={140} />
      </StepVisual>
    ),
  },
  {
    id: "explore",
    eyebrow: "The Map",
    title: "Let the map guide you.",
    body:
      "We&apos;ll plot a gentle loop within your chosen radius — never just there-and-back, always a fresh route home.",
    visual: (
      <StepVisual>
        <div className="relative h-44 w-72 overflow-hidden rounded-3xl border border-border bg-map-paper shadow-pop">
          <Landscape className="absolute inset-0 h-full w-full opacity-60" />
          <svg viewBox="0 0 288 176" className="absolute inset-0 h-full w-full">
            <path
              d="M40 140 C 80 100, 130 90, 160 70 S 230 50, 250 38"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2"
              strokeDasharray="0 9"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute left-7 top-[120px]">
            <PinLeaf size={26} />
          </div>
          <div className="absolute right-9 top-[24px]">
            <PinFlower size={26} />
          </div>
        </div>
      </StepVisual>
    ),
  },
  {
    id: "quests",
    eyebrow: "Side Quests",
    title: "A small task for the road.",
    body:
      "Find something purple. Photograph an unusual cloud. Quests are tiny prompts that turn the route into something to notice.",
    visual: (
      <StepVisual>
        <FlowerMedallion size={150} />
      </StepVisual>
    ),
  },
  {
    id: "progress",
    eyebrow: "Earn the map",
    title: "Reveal your world, one walk at a time.",
    body:
      "Every step uncovers a little more of the map. Earn shields, level up, and look back on a journal of where you&apos;ve been.",
    visual: (
      <StepVisual>
        <div className="flex items-end gap-3">
          <ShieldBadge motif="leaf" tone="sage" size={64} />
          <ShieldBadge motif="compass" tone="moss" size={80} />
          <ShieldBadge motif="flower" tone="lavender" size={64} />
        </div>
      </StepVisual>
    ),
  },
  {
    id: "ready",
    eyebrow: "Ready when you are",
    title: "Pick your starting point.",
    body:
      "We&apos;ll set up your home pin next, then you&apos;re off. Your data lives in your account — you&apos;re in control of it.",
    visual: (
      <StepVisual>
        <Landscape className="h-56 w-72 rounded-3xl shadow-pop" />
      </StepVisual>
    ),
  },
];
