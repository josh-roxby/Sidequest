import type { DataSource } from "./types";
import { mockSource } from "./mock";
import { supabaseSource } from "./supabase";
import { getGenerated, isGenerated } from "../quest/session";
import { localWalkDetail, localWalks } from "../walk/history";

/** The single read interface every screen uses. Screens never import
 *  Supabase and cannot tell which implementation is behind this.
 *
 *  Defaults to mock: this phase runs with no database at all, and a screen
 *  that silently reaches for a table nobody has created is how the previous
 *  build ended up looking finished while being wired to nothing. */
const source: DataSource =
  process.env.NEXT_PUBLIC_DATA_MODE === "live" ? supabaseSource : mockSource;

/** Walks assembled from the walker's own position are read back through the
 *  same interface as everything else, so no screen has to know the difference
 *  between a walk from the corpus and one built a moment ago for where its
 *  reader is standing. The overlay is here rather than inside an
 *  implementation because it is true of every implementation. */
export const data: DataSource = {
  ...source,
  getQuest: async (id: string) =>
    (isGenerated(id) ? getGenerated(id) : null) ?? source.getQuest(id),

  /* Walks the walker actually took, and only those.
   *
   *  The corpus carries three written walks in Clare for the design to have
   *  something to lay out against, and showing them here told everybody they
   *  had been on three walks they had never heard of. History is wired now,
   *  so it shows what is real and an empty state when there is nothing, which
   *  is the rule this phase runs on. */
  getWalks: async () => localWalks(),

  getWalkDetail: async (id: string) =>
    localWalkDetail(id) ?? source.getWalkDetail(id),
};

export * from "./types";
