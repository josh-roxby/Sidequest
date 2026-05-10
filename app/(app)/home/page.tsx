import Link from "next/link";
import { Compass, Footprints } from "lucide-react";
import { ScreenContainer } from "@/components/shell/ScreenContainer";
import { HomeHeader } from "@/components/domain/home/HomeHeader";
import { HeroCard } from "@/components/domain/home/HeroCard";
import { JourneyCard } from "@/components/domain/home/JourneyCard";
import { InspirationCard } from "@/components/domain/home/InspirationCard";
import { Button } from "@/components/primitives/Button";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const initials =
    (user.user_metadata?.display_name as string | undefined)
      ?.split(/\s+/)
      .map((s: string) => s[0]?.toUpperCase())
      .filter(Boolean)
      .slice(0, 2)
      .join("") ||
    user.email?.slice(0, 2).toUpperCase() ||
    "SQ";

  return (
    <ScreenContainer>
      <HomeHeader initials={initials} />

      <div className="space-y-4">
        <HeroCard
          weather="62°F · partly sunny · light breeze"
          greeting="Where shall we wander today?"
        />

        <JourneyCard level={7} title="Wanderer" xp={620} xpToNext={1000} />

        <div className="space-y-2 pt-1">
          <Link href="/quests" className="block">
            <Button
              variant="primary"
              fullWidth
              leadingIcon={<Compass size={18} strokeWidth={2} />}
            >
              Start a new quest
            </Button>
          </Link>
          <Link href="/map" className="block">
            <Button
              variant="secondary"
              fullWidth
              leadingIcon={<Footprints size={18} strokeWidth={1.8} />}
            >
              Pick up where you left off
            </Button>
          </Link>
        </div>

        <InspirationCard quote="Every walk holds a story." />
      </div>
    </ScreenContainer>
  );
}
