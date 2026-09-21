import { distanceM } from "../geo.ts";
import type { LatLng } from "../data/types.ts";

/** How far the walker has actually walked.
 *
 *  The walk screen used to derive this from `objectives.reached`, a flag on a
 *  fixture that nothing ever set, so the card read "0 M of 2.99 KM" for the
 *  whole walk however far you went. This is the honest version: the sum of the
 *  ground covered between fixes.
 *
 *  Two things have to be filtered out or the number is nonsense.
 *
 *  A phone standing still does not report the same position twice. It wanders
 *  by a few metres a second, and summing that wander adds a kilometre to
 *  somebody sitting on a bench. So a step under `JITTER_M` is not a step.
 *
 *  A phone also jumps. A fix can arrive hundreds of metres out, usually when
 *  it switches between GPS and the network, and one of those adds a leg the
 *  walker never walked. So a step that would imply a run is dropped unless the
 *  reading is confident about itself. */

/** Below this, it is the receiver breathing rather than the walker moving. */
const JITTER_M = 8;

/** Above this in one step, something teleported. Kept generous because a fix
 *  can legitimately be half a minute apart on a phone in a pocket. */
const LEAP_M = 120;

/** A reading this vague cannot support a long step. Metres. */
const VAGUE_M = 50;

export interface Track {
  /** Ground covered, in metres. */
  metres: number;
  /** The last accepted position, which is what the next step is measured from. */
  last: LatLng | null;
  /** Accepted fixes. Useful for telling "not started" from "not moving". */
  fixes: number;
}

export const emptyTrack: Track = { metres: 0, last: null, fixes: 0 };

export function extend(track: Track, p: LatLng, accuracyM = 0): Track {
  if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return track;
  if (!track.last) return { metres: 0, last: p, fixes: 1 };

  const step = distanceM(track.last, p);
  if (step < JITTER_M) return track;
  /* A long step from a vague reading is the receiver changing its mind, not
     the walker sprinting. The position still moves, so the next step is
     measured from here, but the distance is not credited. */
  if (step > LEAP_M && accuracyM > VAGUE_M) {
    return { ...track, last: p, fixes: track.fixes + 1 };
  }
  return { metres: track.metres + step, last: p, fixes: track.fixes + 1 };
}

/** Close enough to count as having got there.
 *
 *  Generous, because a routed line turns where the streets allow and a phone
 *  under trees is not precise. Standing across the road from a round tower is
 *  having been to the round tower. */
export const ARRIVED_M = 45;

/** Which of these places the walker is standing at. Ids, so the caller can
 *  union them into what it already knows rather than recomputing history. */
export function arrivedAt(
  places: { id: string; lat: number; lng: number }[], p: LatLng, withinM = ARRIVED_M,
): string[] {
  return places.filter((o) => distanceM(p, { lat: o.lat, lng: o.lng }) <= withinM)
    .map((o) => o.id);
}
