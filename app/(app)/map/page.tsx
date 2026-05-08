import { Eyebrow } from "@/components/primitives/Eyebrow";
import { Card } from "@/components/primitives/Card";
import { ScreenContainer } from "@/components/shell/ScreenContainer";

export default function MapScreen() {
  return (
    <ScreenContainer>
      <div className="py-4">
        <Eyebrow>Map</Eyebrow>
        <h1 className="font-display text-[26px] font-semibold text-text-primary">
          The cartographer&apos;s view
        </h1>
        <p className="mt-1 text-[13px] text-text-secondary">
          Stylised map + GPS + fog of war land here next.
        </p>
      </div>

      <Card variant="lg">
        <p className="text-[13px] text-text-secondary">
          Map screen scaffolded. See <code className="font-mono">TODO.md</code>{" "}
          and <code className="font-mono">docs/fog-of-war.md</code> for the
          plan.
        </p>
      </Card>
    </ScreenContainer>
  );
}
