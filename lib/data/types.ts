/** Read-model shapes. These mirror the schema in docs/PRD.md §10 rather than
 *  the tables one-to-one: screens get what they render, joins already done.
 *  The mock and Supabase implementations both return exactly these. */

export type Tier = "trot" | "stroll" | "sidequest" | "adventure";

export interface TierSpec {
  id: Tier;
  label: string;
  /** Formatted for display. Durations read "45 MIN" and "1H 30". */
  duration: string;
  targetMinutes: number;
  minM: number;
  maxM: number;
  reachM: number;
}

export const TIERS: TierSpec[] = [
  { id: "trot",      label: "Trot",      duration: "15 MIN", targetMinutes: 15,  minM: 900,   maxM: 1300,  reachM: 350 },
  { id: "stroll",    label: "Stroll",    duration: "45 MIN", targetMinutes: 45,  minM: 2600,  maxM: 3400,  reachM: 1000 },
  { id: "sidequest", label: "Sidequest", duration: "1H 30",  targetMinutes: 90,  minM: 5500,  maxM: 6500,  reachM: 2000 },
  { id: "adventure", label: "Adventure", duration: "3H 00",  targetMinutes: 180, minM: 10000, maxM: 13000, reachM: 4000 },
];

export type CategoryGroup =
  | "fort" | "sacred" | "ancient" | "water" | "green" | "height" | "built" | "table";

export interface Lore {
  kind: "archaeology" | "architecture" | "placename" | "fact" | "reference";
  title: string;
  body: string;
  sourceName: string;
  sourceUrl: string;
  licence: string;
  /** Share-alike and non-commercial sources render as an outbound link, never
   *  as embedded body text. Enforced here so the reader just renders what it
   *  is given. docs/PRD.md §8.12. */
  linkOnly: boolean;
}

export interface Point {
  id: string;
  name: string;
  nameGa?: string;
  category: string;
  group: CategoryGroup;
  townland: string;
  lore: Lore[];
  /** Normalised 0–1 position on the placeholder map surface. */
  x: number;
  y: number;
}

export interface Objective {
  id: string;
  pointId: string | null;
  label: string;
  required: boolean;
  x: number;
  y: number;
}

export interface Quest {
  id: string;
  tier: Tier;
  title: string;
  flavour: string;
  distanceM: number;
  durationMin: number;
  startsAwayM: number;
  townland: string;
  objectives: Objective[];
  /** Never suppressed to make a quest look better. If nothing applies this
   *  is ["Made paths throughout"]. docs/ux-loops.md §D-2. */
  honesty: string[];
  /** Normalised polyline points for the placeholder surface. */
  path: [number, number][];
}

export interface Territory {
  county: string;
  tiles: number;
  townlands: number;
  townlandsTotal: number;
  areaKm2: number;
  countryPct: number;
}

export interface CategoryProgress {
  group: CategoryGroup;
  label: string;
  reached: number;
  /** Post reachability and visibility passes, so it is honest. Null when the
   *  dataset does not know, which is better than inventing a denominator. */
  total: number | null;
}

export interface WalkRecord {
  id: string;
  questTitle: string;
  tier: Tier;
  dateISO: string;
  distanceM: number;
  durationMin: number;
  tilesGained: number;
  townland: string;
  status: "completed" | "abandoned";
}

export interface DataSource {
  getTerritory(): Promise<Territory>;
  getQuests(tier: Tier): Promise<Quest[]>;
  getPointsNearby(): Promise<Point[]>;
  getWalks(): Promise<WalkRecord[]>;
  getCategories(): Promise<CategoryProgress[]>;
}
