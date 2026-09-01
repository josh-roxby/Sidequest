"use client";
import { HistoryList } from "@/components/domain/HistoryList";
import { Screen, ScreenHead } from "@/components/shell/Screen";

export default function HistoryScreen() {
  return (
    <Screen>
      <ScreenHead label="History" title="Every walk you have taken" />
      <HistoryList />
    </Screen>
  );
}
