import { distanceM } from "../geo.ts";
import { TIERS, type LatLng, type Objective, type Point, type Quest, type QuestShape, type Tier }
  from "../data/types.ts";
import { alongRoute, atAlong, circleRoute, offset, rng, viaRoute, type Path } from "./route.ts";
import { buildGraph, nearestNode, routeOfLength, routeVia, type Graph } from "./graph.ts";

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
    /* Inside the radius, and far enough out to be worth setting off for: a
       point you are already standing on is not somewhere to walk to. */
    .filter((x) => x.d <= reachM && x.d > 120)
    .sort((a, b) => a.d - b.d);
}

/** How much of the walk's length may be spent simply reaching its places.
 *
 *  The chain from the start through every stop and home is a straight-line
 *  floor on the route: real streets are always longer. Leaving a quarter of the
 *  distance in hand is what stops a five point adventure being picked as a
 *  twenty kilometre walk. */
const CHAIN_BUDGET = 0.75;

/** The places this walk will take in, picked at random from what is in reach.
 *
 *  It used to take the nearest point and nothing else, which is deterministic
 *  and therefore the same walk every single time: from a desk in Fairview the
 *  answer was the Casino at Marino, again, forever. Nearest is also the wrong
 *  instinct. The point of the tier is the time you have, not proximity, and a
 *  walker who asks for three hours has said they want to go somewhere.
 *
 *  So the order is shuffled and stops are taken while they fit. The seed is the
 *  caller's, which is how the same opened walk stays the same walk while a
 *  fresh press gets a fresh one. */
function chooseStops(
  near: { p: Point; d: number }[], want: number, from: LatLng, targetM: number,
  next: () => number, avoid: string[] = [], skip = 0,
): Point[] {
  /* Drawn in a random order, but not a flat one. A place with two things
     recorded about it is more worth walking to than a street with one, so
     depth of record is a thumb on the scale: it leans the walk towards the
     Casino and away from Philipsburgh Avenue without ever ruling the avenue
     out. Anything with nothing written about it can still come up, which is
     what keeps a thin corpus usable. */
  const weight = (x: Point) => {
    const depth = (1 + x.lore.length) ** 2;
    /* Somewhere the walker was sent recently is pushed right down the order,
       and the more recently the harder. Not removed: an area with four places
       in it would run out of walks altogether, and being sent somewhere twice
       is a much smaller failure than being told there is nowhere to go. */
    const seen = avoid.indexOf(x.id);
    if (seen < 0) return depth;
    /* Halving per place in the history, so the one offered last press is
       effectively out and the one offered eight presses ago is barely
       penalised. The effect is least-recently-offered-wins with noise on top,
       rather than a flat discount that a handful of candidates quickly
       flattens out again. */
    return depth / 2 ** Math.max(1, 8 - seen);
  };
  const rest = near.map(({ p }) => p);
  const pool: Point[] = [];
  while (rest.length) {
    let total = 0;
    for (const x of rest) total += weight(x);
    let r = next() * total;
    let i = 0;
    for (; i < rest.length - 1; i++) {
      r -= weight(rest[i]);
      if (r <= 0) break;
    }
    pool.push(rest.splice(i, 1)[0]);
  }

  const budget = targetM * CHAIN_BUDGET;
  const taken: Point[] = [];
  /* Passing over the first few gives the caller a different set to try when
     the streets cannot make a walk of the right length out of the first one.
     The order is already the weighted draw, so what comes back is still the
     places worth going to, just not the same ones. */
  for (const p of pool.slice(skip)) {
    if (taken.length >= want) break;
    const trial = order(from, [...taken, p]);
    if (chainLength(from, trial) <= budget) taken.push(p);
  }
  return order(from, taken);
}

/** The straight-line walk through these places and home again. */
function chainLength(from: LatLng, stops: Point[]): number {
  let m = 0;
  let at: LatLng = from;
  for (const p of stops) { m += distanceM(at, { lat: p.lat, lng: p.lng }); at = p; }
  return m + distanceM(at, from);
}

/** Stops in the order a walker would take them.
 *
 *  Nearest neighbour from the start. Not the shortest tour, which is the
 *  travelling salesman and not worth solving for five points, but enough to
 *  stop a walk crossing its own path three times on the way round. */
function order(from: LatLng, stops: Point[]): Point[] {
  const left = [...stops];
  const out: Point[] = [];
  let at: LatLng = from;
  while (left.length) {
    let best = 0;
    for (let i = 1; i < left.length; i++) {
      if (distanceM(at, { lat: left[i].lat, lng: left[i].lng })
        < distanceM(at, { lat: left[best].lat, lng: left[best].lng })) best = i;
    }
    const [p] = left.splice(best, 1);
    out.push(p);
    at = p;
  }
  return out;
}

/** What to call a walk that takes in several places. */
function titleOf(stops: Point[]): string {
  if (stops.length === 0) return "A walk from your door";
  if (stops.length === 1) return stops[0].name;
  if (stops.length === 2) return `${stops[0].name} and ${stops[1].name}`;
  return `${stops[0].name} and ${stops.length - 1} more`;
}

function flavourOf(stops: Point[], routed: boolean): string {
  const how = routed
    ? "on the streets and paths as the map has them"
    : "from where you are standing";
  if (stops.length === 0) {
    return routed
      ? "Routed on real ways from where you are standing. Nothing of ours is logged along it, so what you find is yours."
      : "Nothing we know of is within reach, so this one is yours to find. The distance is right and the way back is the other half.";
  }
  if (stops.length === 1) return `Out to ${stops[0].name} and back, ${how}.`;
  const names = stops.map((p) => p.name);
  return `Round by ${names.slice(0, -1).join(", ")} and ${names.at(-1)}, ${how}.`;
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
  from, tier, shape = "either", points, seed = "", streets, avoid = [],
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
  /** Places this walker was sent to recently, most recent first. Leaned away
   *  from rather than ruled out, so a thin area still has walks in it. */
  avoid?: string[];
}): Assembled {
  const spec = TIERS.find((t) => t.id === tier)!;
  /* Midway through the tier's band. Picking the floor makes every walk feel
     short-changed and picking the ceiling makes every one feel long. */
  const targetM = Math.round((spec.minM + spec.maxM) / 2);
  const wanted: QuestShape = shape === "either" ? "loop" : shape;
  const key = `${seed}|${tier}|${wanted}|${from.lat.toFixed(4)},${from.lng.toFixed(4)}`;

  const next = rng(key);
  const graph: Graph | null = streets && streets.length > 0
    ? buildGraph(streets.map((s) => s.coords), streets.map((s) => s.level))
    : null;

  /* Somewhere the streets cannot reach is not somewhere to send a walker.
     Filtering here rather than discovering it during routing is what stops one
     unreachable place, picked at random, costing the whole walk its streets and
     dropping the line back to an arc across the ground. Without a graph
     everything is a candidate, which is the same answer as before. */
  const near = candidates(from, points, spec.reachM)
    .filter(({ p }) => !graph || nearestNode(graph, { lat: p.lat, lng: p.lng }) !== null);
  const attempts = [0, 1, 2, 3].map((skip) =>
    chooseStops(near, spec.stops, from, targetM, next, avoid, skip));
  const stops = attempts[0];

  const objectivesFor = (path: Path, on: Point[]) => on.map((p, i) => ({
    id: `o-${i + 1}`,
    pointId: p.id,
    label: p.name,
    required: true,
    reached: false,
    atM: atAlong(path, { lat: p.lat, lng: p.lng }),
    lat: p.lat,
    lng: p.lng,
  }));

  const encountersFor = (on: Point[], routedLine: boolean) => [
    ...on.map((p) => ({ kind: "point" as const, label: p.name, detail: p.blurb })),
    ...(on.length === 0
      ? [{ kind: "terrain" as const, label: "Unrecorded ground", detail: "We have nothing logged along this one" }]
      : []),
    {
      kind: "terrain" as const,
      label: routedLine ? "Streets and paths as the map has them" : "Streets and paths as you find them",
    },
  ];

  /* With a street graph the walk is routed on real ways and the distance comes
     out of the route rather than being imposed on it.
     
     Two ways to route it. With places to take in, the walk calls at each of
     them and the way home is stretched to the length the tier promises. With
     nothing recorded in reach, length leads instead: the turn is whatever is
     half a walk away on foot. Both come back inside the tier's band or not at
     all, because a four hundred metre "stroll" is worse than an honest
     straight line. */
  if (graph) {
    /* Every way of asking the streets for a walk, in order of how much of the
       original idea it keeps.
       
       The walk was failing here and falling out to a drawn arc, which is what
       a walker saw as a curvy line that ignores the roads. One set of places
       is one shape of walk, and the streets will not always make the promised
       length out of it: a stop down a cul de sac, or two that sit either side
       of a river with no crossing between them. Giving up on the first no was
       the mistake.
       
       So: the chosen places, then the same places minus the far ones, then a
       different draw from the same pool, and finally, rather than nothing at
       all, a walk of the right length with no particular place on it. The last
       of those almost always works on a connected graph, and a real walk past
       nothing named beats an arc across the gardens. */
    const tries: Point[][] = [];
    for (const set of attempts) {
      for (let take = set.length; take >= 1; take--) tries.push(set.slice(0, take));
    }
    tries.push([]);   // length alone, the one that rarely fails

    /* Bounded, because each of these is a pair of Dijkstras on a graph that
       can hold twenty thousand nodes, and a walker is standing there. */
    const BUDGET = 8;
    const seen = new Set<string>();
    let spent = 0;

    for (const some of tries) {
      const key2 = some.map((x) => x.id).join(",");
      if (seen.has(key2)) continue;
      seen.add(key2);
      if (spent++ >= BUDGET) break;
      /* One shape for both, because only the walk with nothing to aim at has a
         turning point worth naming. */
      const r: { path: Path; metres: number; turn?: LatLng } | null = some.length > 0
        ? routeVia(graph, from, some.map((x) => ({ lat: x.lat, lng: x.lng })), wanted, targetM)
        : routeOfLength(graph, from, targetM, wanted);
      if (!r) continue;
      if (r.metres < spec.minM || r.metres > spec.maxM) continue;

      /* A place counts as on the walk if the route passes close enough to
         stand at it. Routed walks turn where the streets allow, which is not
         always the doorstep, and a stop the line never reaches is a promise
         the walk does not keep. */
      const missed = some.some((x) =>
        nearestOnPath(r.path, { lat: x.lat, lng: x.lng }) >= 150);
      if (missed) continue;

      const shapeLine = wanted === "loop"
        ? "A loop: it comes home a different way"
        : "There and back along the same way";

      return {
        anchor: some[0] ?? null,
        routed: true,
        quest: buildQuest({
          key, from, tier, shape: wanted, targetM: r.metres, path: r.path,
          title: titleOf(some),
          flavour: flavourOf(some, true),
          townland: some[0]?.townland,
          objectives: some.length > 0 ? objectivesFor(r.path, some) : [{
            id: "o-1", pointId: null, label: "The turn for home", required: false,
            reached: false, atM: Math.round(r.metres / 2),
            ...(r.turn ?? alongRoute(r.path, r.metres / 2)),
          }],
          encounters: encountersFor(some, true),
          honesty: [
            "Built from where you are standing",
            "Routed on real streets and paths",
            shapeLine,
          ],
          stops: some.length,
        }),
      };
    }
  }

  /* No graph, or a route that would not keep its promises. Drawn geometrically
     instead, which cuts across blocks and says so. Stops are dropped one at a
     time from the far end until the chain fits the distance: a walk to three
     of the four places is still a walk, and refusing to draw one is not. */
  for (let take = stops.length; take > 0; take--) {
    const some = stops.slice(0, take);
    const path = viaRoute(from, some.map((p) => ({ lat: p.lat, lng: p.lng })), targetM);
    if (!path) continue;
    return {
      anchor: some[0],
      routed: false,
      quest: buildQuest({
        key, from, tier, shape: wanted, targetM, path,
        title: titleOf(some),
        flavour: flavourOf(some, false),
        townland: some[0]?.townland,
        objectives: some.map((p, i) => ({
          id: `o-${i + 1}`, pointId: p.id, label: p.name, required: true, reached: false,
          atM: atAlong(path, { lat: p.lat, lng: p.lng }), lat: p.lat, lng: p.lng,
        })),
        encounters: [
          ...some.map((p) => ({ kind: "point" as const, label: p.name, detail: p.blurb })),
          { kind: "terrain" as const, label: "Streets and paths as you find them" },
        ],
        stops: some.length,
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
      flavour: flavourOf([], false),
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
  /** Where the walk is, named. Taken from the places it calls at, because a
   *  generated walk has no townland of its own and a history row reading
   *  "Townland of " with nothing after it is worse than no line at all. */
  townland?: string;
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
    townland: a.townland ?? "",
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
