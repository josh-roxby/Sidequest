/** Duration estimates.
 *
 *  Every quest is either a LOOP, a continuous circuit ending where it began,
 *  or a LINE, out along a path and back down the same one. `distanceM` is
 *  always the full distance walked, both legs of a line included, so a line
 *  and a loop of the same number never disagree about how long they take.
 *
 *  Pace is not a flat 5 km/h. Surface and climb both cost real time and a
 *  walking app that ignores them will keep telling people forty five minutes
 *  and taking an hour. */

export type Surface = "made" | "unpaved" | "rough";
export type Shape = "loop" | "line";

/** Comfortable pace on a made path, level ground, in metres per second.
 *  4.7 km/h: a little under the textbook 5, which assumes you are trying. */
const BASE_MPS = 4.7 / 3.6;

const SURFACE_FACTOR: Record<Surface, number> = {
  made: 1,
  unpaved: 0.9,
  rough: 0.78,
};

/** Naismith's correction: roughly a minute for every ten metres climbed. It
 *  is a century old and still closer than ignoring ascent. */
const SECONDS_PER_METRE_ASCENT = 6;

export function estimateDurationS(
  distanceM: number,
  { surface = "made", ascentM = 0, dwellS = 0 }:
    { surface?: Surface; ascentM?: number; dwellS?: number } = {},
): number {
  const walking = distanceM / (BASE_MPS * SURFACE_FACTOR[surface]);
  return Math.round(walking + ascentM * SECONDS_PER_METRE_ASCENT + dwellS);
}

/** "45 MIN", "1H 30". Never "1.5 hours". */
export function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} MIN`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h}H 00` : `${h}H ${String(rem).padStart(2, "0")}`;
}

export function formatDistance(distanceM: number): string {
  if (distanceM < 1000) return `${Math.round(distanceM)} M`;
  return `${(distanceM / 1000).toFixed(distanceM < 10_000 ? 2 : 1)} KM`;
}

export const SHAPE_LABEL: Record<Shape, string> = {
  loop: "Loop",
  line: "There and back",
};

export const SHAPE_HINT: Record<Shape, string> = {
  loop: "Ends where it starts, no ground walked twice",
  line: "Out along one path and back down the same one",
};
