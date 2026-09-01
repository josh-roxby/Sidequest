import type { DataSource, Quest, Tier } from "../types";
import { BADGES, CATEGORIES, COLLECTIBLES, POINTS, QUESTS, TALES, TERRITORY, WALKS } from "./fixtures";

/** Artificial latency, so loading and skeleton states are visible during
 *  development rather than theoretical. Raise it to inspect a skeleton, set
 *  it to 0 for fast iteration. */
const LATENCY_MS = Number(process.env.NEXT_PUBLIC_MOCK_LATENCY_MS ?? 180);

/** Set NEXT_PUBLIC_MOCK_FAIL to a method name to exercise its error state
 *  without breaking anything else. e.g. NEXT_PUBLIC_MOCK_FAIL=getQuests */
const FAIL = process.env.NEXT_PUBLIC_MOCK_FAIL ?? "";

async function settle<T>(name: string, value: T): Promise<T> {
  await new Promise((r) => setTimeout(r, LATENCY_MS));
  if (FAIL === name) throw new Error(`Mock failure: ${name}`);
  return value;
}

export const mockSource: DataSource = {
  getTerritory: () => settle("getTerritory", TERRITORY),
  getQuests: (tier: Tier) =>
    settle<Quest[]>("getQuests", QUESTS.filter((q) => q.tier === tier)),
  getQuest: (id: string) =>
    settle<Quest | null>("getQuest", QUESTS.find((q) => q.id === id) ?? null),
  getPointsNearby: () => settle("getPointsNearby", POINTS),
  getWalks: () => settle("getWalks", WALKS),
  getCategories: () => settle("getCategories", CATEGORIES),
  getCollectibles: () => settle("getCollectibles", COLLECTIBLES),
  getBadges: () => settle("getBadges", BADGES),
  getTales: () => settle("getTales", TALES),
};
