import { buildGraph, routeOfLength, routeVia } from "./graph.ts";
import { atAlong, drawnLength, type Path } from "./route.ts";
import { distanceM } from "../geo.ts";
import { estimateDurationS } from "../walking.ts";
import type { LatLng, Quest } from "../data/types.ts";

/** Redrawing a written walk on the streets the walker actually has.
 *
 *  The corpus was drawn before there was a router, so its routes are arcs
 *  across the ground: the Bull Island walk goes over the water rather than
 *  along the promenade. Re-cutting them where they were written is the obvious
 *  fix and it is not available, because the machine that builds the corpus
 *  cannot reach a tile host or an OSM endpoint. The walker's phone can. So the
 *  line is drawn from the map in front of them, which also means one router
 *  and one set of rules for a written walk and a generated one, rather than
 *  two kinds of line that look the same and are not.
 *
 *  It refuses rather than guesses. No streets, no route, or a route so far off
 *  the written distance that it is plainly a different walk, and the written
 *  line stands with a line of honesty saying what it is. */

export interface Street {
  coords: Path;
  level: number;
}

/** A routed walk that has wandered this far from the one that was written is
 *  not that walk any more. Generous, because streets legitimately add distance
 *  a straight line never pays for, and the number shown is corrected to the
 *  truth either way. */
const TOO_FAR = 1.9;
const TOO_SHORT = 0.5;

/** How far a stated objective may sit from the routed line and still count as
 *  somewhere the walk passes. A route turns where the streets allow, which is
 *  not always the doorstep. */
const PASSES_M = 150;

export const ROUTED = "Routed on real streets and paths";
export const DRAWN = "Not drawn yet: the streets here have not loaded, so the places are marked and the line is not. It will appear once the map has them.";

/** Strips whichever of the two claims is already on a walk, so re-cutting the
 *  same walk twice cannot leave both. */
const withoutRoutingClaim = (honesty: string[]) =>
  honesty.filter((h) => h !== ROUTED && h !== DRAWN);

/** A stop that sits on the doorstep of the start is not somewhere the walk
 *  goes. Written walks name the park they set off from as their first
 *  objective, at nought metres, and routing to it asks for a walk from a place
 *  to itself. */
const AT_THE_START_M = 200;

/** The places the walk is about, in the order it was written to visit them.
 *
 *  This is the part re-cutting must not lose. Routing for length alone would
 *  keep the distance and throw away the reason anybody picked the walk, and
 *  routing only to the furthest stop does the opposite: the shore walk is
 *  eleven kilometres and names a wall three away, so its length is in the
 *  wandering between its stops rather than in how far out it reaches. */
function stopsOf(quest: Quest, start: LatLng): LatLng[] {
  return [...quest.objectives]
    .sort((a, b) => a.atM - b.atM)
    .map((o) => ({ lat: o.lat, lng: o.lng }))
    .filter((p) => distanceM(start, p) > AT_THE_START_M);
}

export function recutQuest(quest: Quest, streets: Street[]): Quest {
  const honesty = withoutRoutingClaim(quest.honesty);
  const unrouted = { ...quest, honesty: [...honesty, DRAWN] };
  if (streets.length === 0) return unrouted;

  const start = quest.start ?? { lat: quest.path[0][1], lng: quest.path[0][0] };
  const graph = buildGraph(streets.map((s) => s.coords), streets.map((s) => s.level));

  const stops = stopsOf(quest, start);
  /* A walk that names nowhere is the only one routed on length alone. */
  const routed = stops.length > 0
    ? routeVia(graph, start, stops, quest.shape, quest.distanceM)
    : routeOfLength(graph, start, quest.distanceM, quest.shape);
  if (!routed) return unrouted;

  /* The written distance is a promise about time, so a route that keeps the
     destination but bears no relation to it is the wrong answer even though it
     is on real streets. */
  const ratio = routed.metres / quest.distanceM;
  if (ratio > TOO_FAR || ratio < TOO_SHORT) return unrouted;

  /* A walk that no longer goes past the places it is named for is not that
     walk, however real the streets under it. This is what a route cut on a
     thin graph looks like: at the zoom a small preview map sits at, the tiles
     carry dual carriageways and nothing else, and the line snaps onto one and
     sails past the Casino. Better the written arc, labelled as drawn. */
  if (!passesAll({ ...quest, path: routed.path })) return unrouted;

  const metres = Math.round(drawnLength(routed.path));

  return {
    ...quest,
    path: routed.path,
    /* Corrected to what the streets actually cost, not left at what the arc
       across the ground claimed. A walk that says 6.2km and draws 7.4km has
       lied about the one number people plan their afternoon around. */
    distanceM: metres,
    durationMin: Math.round(estimateDurationS(metres, {
      surface: quest.surface,
      ascentM: quest.ascentM,
      dwellS: quest.objectives.filter((o) => o.required).length * 240,
    }) / 60),
    objectives: quest.objectives.map((o) => ({
      ...o,
      atM: Math.round(atAlong(routed.path, { lat: o.lat, lng: o.lng })),
    })),
    honesty: [...honesty, ROUTED],
  };
}

/** Whether the line still goes past every place the walk is named for.
 *
 *  Required objectives only. An optional one is something you might notice on
 *  the way, and a route that takes the other side of the park is still the
 *  walk; a required one is the reason the walk exists. */
export function passesAll(quest: Quest): boolean {
  return quest.objectives.filter((o) => o.required).every((o) =>
    Math.min(...quest.path.map(([lng, lat]) => distanceM({ lat, lng }, { lat: o.lat, lng: o.lng })))
      <= PASSES_M);
}
