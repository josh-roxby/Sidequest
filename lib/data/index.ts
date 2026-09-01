import type { DataSource } from "./types";
import { mockSource } from "./mock";
import { supabaseSource } from "./supabase";

/** The single read interface every screen uses. Screens never import
 *  Supabase and cannot tell which implementation is behind this.
 *
 *  Defaults to mock: this phase runs with no database at all, and a screen
 *  that silently reaches for a table nobody has created is how the previous
 *  build ended up looking finished while being wired to nothing. */
export const data: DataSource =
  process.env.NEXT_PUBLIC_DATA_MODE === "live" ? supabaseSource : mockSource;

export * from "./types";
