"use client";
import { BadgesPanel } from "@/components/domain/BadgesPanel";
import { Screen, ScreenHead } from "@/components/shell/Screen";

export default function BadgesScreen() {
  return (
    <Screen>
      <ScreenHead label="Badges" title="What you have collected" />
      <BadgesPanel />
    </Screen>
  );
}
