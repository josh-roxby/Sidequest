import { distanceM } from "../geo.ts";
import { TIERS, type LatLng, type Objective, type Point, type Quest, type QuestShape, type Tier }
  from "../data/types.ts";
import { alongRoute, atAlong, circleRoute, offset, viaRoute, type Path } from "./route.ts";
import { buildGraph, routeOfLength, type Graph } from "./graph.ts";

/** Building a walk from where the walker is standing.
 *
 *  The corpus used to answer "give me a stroll" with the first stroll in the
 *  list, which from Dublin was a walk in Clare. A walk you cannot start from
 *  where you are is not a walk, it is a suggestion to drive somewhere, and this
 *  is a walking app.
 *
 *  So a walk is assembled rather than chosen: take the nearest point worth
 *  reaching inside the tier's radius, route out to it and back, and make the
 *  whole thing the length the tier promises.
 *
 *  What this is not is routing. The line between the start and the point does
 *  not follow streets, because street data is slice 5. What it does guarantee
 *  is that the walk starts under your feet, reaches a real place, comes back,
 *  and is as long as it says. */

/** Pace in metres per minute. A shade over 4.3 km/h, an unhurried adult on the
 *  flat. One constant, because a duration that disagrees with its own distance
 *  is the sort of thing nobody notices until a walker is out in the dark. */
const M_PER_MIN = 72;

/** How long a walker is assumed to stand at a point before moving on. */
const DWELL_MIN = 4;

export interface Assembled {
  quest: Quest;
  /** The point the walk was built around, when there was one in reach. Null
   *  means the walk is real and the ground around it is simply unrecorded. */
  anchor: Point | null;
  /** Whether the line follows real ways. False means it was drawn
   *  geometrically and will cut across blocks, which the walker is told. */
  routed: boolean;
}

/** Points worth aiming at, nearest first, inside the tier's reach. */
function candidates(from: LatLng, points: Point[], reachM: number): { p: Point; d: number }[] {
  return points
    .map((p) => ({ p, d: distanceM(from, { lat: p.lat, lng: p.lng }) }))
    /* Inside the radius, and far enough out to be somewhere to go: a point you
       are already standing on makes a walk with no journey in it. */
    .filter((x) => x.d <= reachM && x.d > 120)
    .sort((a, b) => a.d - b.d);
}

/** The direction with the most room in it.
 *
 *  With nothing to aim at, a walk still has to go somewhere, and going nowhere
 *  in particular is better done deliberately. Of eight bearings this picks the
 *  one whose turning point is furthest from every point already walked past,
 *  which in practice means away from the way you came. Deterministic for a
 *  given position and seed, so the same request draws the same walk. */
function openBearing(from: LatLng, avoid: Point[], outM: number, seed: number): number {
  let best = 0, bestScore = -Infinity;
  for (let i = 0; i < 8; i++) {
    const deg = (i * 45 + seed * 17) % 360;
    const probe = offset(from, outM, deg);
    const nearest = avoid.length
      ? Math.min(...avoid.map((p) => distanceM(probe, { lat: p.lat, lng: p.lng })))
      : outM;
    if (nearest > bestScore) { bestScore = nearest; best = deg; }
  }
  return best;
}

function durationMin(distanceM_: number, stops: number): number {
  return Math.round(distanceM_ / M_PER_MIN) + stops * DWELL_MIN;
}

/** Assemble a walk from a position.
 *
 *  `shape` "either" lets the assembler pick, which it does by preferring a
 *  loop: a loop shows you more ground for the same distance. */
export function assembleQuest({
  from, tier, shape = "either", points, seed = "", streets,
}: {
  from: LatLng;
  tier: Tier;
  shape?: QuestShape | "either";
  points: Point[];
  seed?: string;
  /** Walkable ways from the basemap tiles, when the map has any loaded. Given
   *  these the route follows real streets and paths; without them it is drawn
   *  geometrically and says so. */
  streets?: { coords: Path; level: number }[];
}): Assembled {
  const spec = TIERS.find((t) => t.id === tier)!;
  /* Midway through the tier's band. Picking the floor makes every walk feel
     short-changed and picking the ceiling makes every one feel long. */
  const targetM = Math.round((spec.minM + spec.maxM) / 2);
  const wanted: QuestShape = shape === "either" ? "loop" : shape;
  const key = `${seed}|${tier}|${wanted}|${from.lat.toFixed(4)},${from.lng.toFixed(4)}`;

  const near = candidates(from, points, spec.reachM);
  const graph: Graph | null = streets && streets.length > 0
    ? buildGraph(streets.map((s) => s.coords), streets.map((s) => s.level))
    : null;

  /* With a street graph the walk is routed on real ways, and the distance comes
     out of the route rather than being imposed on it. So the point to aim at is
     the one whose round trip lands nearest the tier's target while staying
     inside the tier's band: picking the nearest point regardless would hand
     someone a four hundred metre "stroll".
     
     Without a graph it falls back to the nearest point the geometry can reach
     at the stated distance, which is what this did before and is still better
     than nothing. */
  if (graph) {
    /* Length leads. The turning point is whatever is half a walk away on foot,
       preferring one near something worth reaching, so the walk comes out the
       length the tier promises instead of however far the nearest point
       happens to be. */
    const r = routeOfLength(graph, from, targetM, wanted,
      near.map(({ p }) => ({ lat: p.lat, lng: p.lng })));


    if (r && r.metres >= spec.minM && r.metres <= spec.maxM) {
      /* A point counts as on the walk if the route passes close enough to
         stand at it. Routed walks turn where the streets allow, which is not
         always the doorstep. */
      const onRoute = near
        .map(({ p }) => ({ p, d: nearestOnPath(r.path, { lat: p.lat, lng: p.lng }) }))
        .filter((x) => x.d < 120)
        .sort((a, b) => a.d - b.d)[0]?.p ?? null;

      const shapeLine = wanted === "loop"
        ? "A loop: it comes home a different way"
        : "There and back along the same way";

      return {
        anchor: onRoute,
        routed: true,
        quest: buildQuest({
          key, from, tier, shape: wanted, targetM: r.metres, path: r.path,
          title: onRoute ? onRoute.name : "A walk from your door",
          flavour: onRoute
            ? `Out to ${onRoute.name} and back, on the streets and paths as the map has them.`
            : "Routed on real ways from where you are standing. Nothing of ours is logged along it, so what you find is yours.",
          objectives: onRoute
            ? [{
                id: "o-1", pointId: onRoute.id, label: onRoute.name, required: true,
                reached: false, atM: atAlong(r.path, { lat: onRoute.lat, lng: onRoute.lng }),
                lat: onRoute.lat, lng: onRoute.lng,
              }]
            : [{
                id: "o-1", pointId: null, label: "The turn for home", required: false,
                reached: false, atM: Math.round(r.metres / 2), ...r.turn,
              }],
          encounters: [
            ...(onRoute
              ? [{ kind: "point" as const, label: onRoute.name, detail: onRoute.blurb }]
              : [{ kind: "terrain" as const, label: "Unrecorded ground", detail: "We have nothing logged along this one" }]),
            { kind: "terrain", label: "Streets and paths as the map has them" },
          ],
          honesty: [
            "Built from where you are standing",
            "Routed on real streets and paths",
            shapeLine,
          ],
          stops: onRoute ? 1 : 0,
        }),
      };
    }
  }

  /* Nearest first, but a point is only usable if the route out to it and back
     fits inside the distance the tier promises. A point at the very edge of the
     reach can be too far to get to and home again, so the next one down is
     tried rather than stretching the walk past its tier. */
  for (const { p } of near) {
    const anchor = { lat: p.lat, lng: p.lng };
    const path = viaRoute(from, [anchor], targetM);
    if (!path) continue;
    return {
      anchor: p,
      routed: false,
      quest: buildQuest({
        key, from, tier, shape: wanted, targetM, path,
        title: p.name,
        flavour: `Out to ${p.name} and back, from where you are standing.`,
        objectives: [{
          id: "o-1", pointId: p.id, label: p.name, required: true, reached: false,
          atM: atAlong(path, anchor), lat: p.lat, lng: p.lng,
        }],
        encounters: [
          { kind: "point", label: p.name, detail: p.blurb },
          { kind: "terrain", label: "Streets and paths as you find them" },
        ],
        stops: 1,
      }),
    };
  }

  /* Nothing in reach. Still a walk: aim at open ground, go out and come back.
     Refusing to generate here would mean the app only works where the dataset
     is already thick, which is most of the country nowhere. */
  const deg = openBearing(from, points, targetM / 3, key.length);
  const turn = offset(from, targetM / 3, deg);
  const path = viaRoute(from, [turn], targetM) ?? circleRoute(from, targetM, key);
  return {
    anchor: null,
    routed: false,
    quest: buildQuest({
      key, from, tier, shape: wanted, targetM, path,
      title: "Ground we have not recorded",
      flavour: "Nothing we know of is within reach, so this one is yours to find. The distance is right and the way back is the other half.",
      objectives: [{
        id: "o-1", pointId: null, label: "The turn for home", required: false,
        reached: false, atM: Math.round(targetM / 2),
        ...alongRoute(path, targetM / 2),
      }],
      encounters: [
        { kind: "terrain", label: "Unrecorded ground", detail: "We have nothing logged along this one" },
        { kind: "view", label: "Whatever you find" },
      ],
      stops: 0,
    }),
  };
}

function buildQuest(a: {
  key: string; from: LatLng; tier: Tier; shape: QuestShape; targetM: number;
  path: Path; title: string; flavour: string; objectives: Objective[];
  encounters: Quest["encounters"]; stops: number; honesty?: string[];
}): Quest {
  return {
    /* Stamped with the position it was built from, so the same walker asking
       the same question twice in the same place opens the same walk rather
       than piling up near-identical ones. */
    id: `q-gen-${hash(a.key)}`,
    tier: a.tier,
    shape: a.shape,
    surface: "made",
    ascentM: 0,
    title: a.title,
    flavour: a.flavour,
    distanceM: Math.round(a.targetM),
    durationMin: durationMin(a.targetM, a.stops),
    startsAwayM: 0,
    townland: "",
    start: a.from,
    startName: "Where you are",
    honesty: a.honesty ?? [
      "Built from where you are standing",
      /* Said plainly, because the difference decides whether the line on the
         map can be followed or only read. A walker who does not know which
         kind of line they have will trust the wrong one. */
      "Drawn straight, not routed: the map had no streets loaded here, so follow the places rather than the line",
    ],
    encounters: a.encounters,
    objectives: a.objectives,
    path: a.path,
  };
}

function hash(s: string): string {
  let h = 2166136261;
  for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

/** How close a path comes to a place. */
function nearestOnPath(path: Path, p: LatLng): number {
  let best = Infinity;
  for (const [lng, lat] of path) best = Math.min(best, distanceM(p, { lat, lng }));
  return best;
}
