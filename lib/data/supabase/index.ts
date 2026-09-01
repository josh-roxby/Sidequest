import type { DataSource } from "../types";

/** Written against the same interface, exported, and deliberately NOT
 *  selected. Wiring these up needs the migrations in supabase/migrations/
 *  applied first, which is a TODO.md item awaiting approval — see CLAUDE.md.
 *
 *  Kept in the tree so the shape of the real queries stays visible while the
 *  screens are built, and so switching over is one env var rather than a
 *  rewrite. */
export const supabaseSource: DataSource = {
  getTerritory: notWired("getTerritory"),
  getQuests: notWired("getQuests"),
  getQuest: notWired("getQuest"),
  getPointsNearby: notWired("getPointsNearby"),
  getWalks: notWired("getWalks"),
  getCategories: notWired("getCategories"),
  getCollectibles: notWired("getCollectibles"),
  getBadges: notWired("getBadges"),
  getTales: notWired("getTales"),
};

function notWired(name: string) {
  return async (): Promise<never> => {
    throw new Error(
      `lib/data/supabase.${name} is not wired up. The migrations in ` +
        `supabase/migrations/ have not been applied. Keep ` +
        `NEXT_PUBLIC_DATA_MODE=mock until they are.`,
    );
  };
}
