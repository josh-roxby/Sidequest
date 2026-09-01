"use client";
import { SettingsPanel } from "@/components/domain/SettingsPanel";
import { Screen, ScreenHead } from "@/components/shell/Screen";

export default function SettingsScreen() {
  return (
    <Screen>
      <ScreenHead label="Settings" title="How it behaves" />
      <SettingsPanel />
    </Screen>
  );
}
