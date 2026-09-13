import assert from "node:assert/strict";
import { test } from "node:test";
import { assembleQuest } from "../lib/quest/assemble.ts";
import { drawnLength } from "../lib/quest/route.ts";
import { overlap } from "../lib/quest/graph.ts";
import { POINTS } from "../lib/data/mock/fixtures.ts";
import { TIERS, type Point } from "../lib/data/types.ts";
import { distanceM } from "../lib/geo.ts";

/** A walk you cannot start from where you are standing is not a walk. The
 *  picker used to answer "give me a stroll" with the first stroll in the list,
 *  which from Dublin was a walk in Clare, so these are mostly about the one
 *  property that failure broke: the walk begins under your feet. */

const CLONTARF = { lat: 53.3625, lng: -6.2050 };
const ATLANTIC = { lat: 53.2000, lng: -10.9000 };  // far off the west coast
const ALL_TIERS = TIERS.map((t) => t.id);

test("a walk always starts where the walker is standing", () => {
  for (const tier of ALL_TIERS) {
    const { quest } = assembleQuest({ from: CLONTARF, tier, points: POINTS });
    const first = { lng: quest.path[0][0], lat: quest.path[0][1] };
    assert.ok(distanceM(first, CLONTARF) < 5,
      `${tier} starts ${Math.round(distanceM(first, CLONTARF))}m from the walker`);
    assert.deepEqual(quest.path[0], quest.path.at(-1), `${tier} does not come home`);
  }
});

test("the drawn route is the distance it claims, inside its tier", () => {
  for (const tier of ALL_TIERS) {
    const spec = TIERS.find((t) => t.id === tier)!;
    const { quest } = assembleQuest({ from: CLONTARF, tier, points: POINTS });
    const drawn = drawnLength(quest.path);
    assert.ok(Math.abs(drawn - quest.distanceM) < 30,
      `${tier} draws ${Math.round(drawn)}m against a stated ${quest.distanceM}m`);
    assert.ok(quest.distanceM >= spec.minM && quest.distanceM <= spec.maxM,
      `${tier} is ${quest.distanceM}m, outside ${spec.minM}-${spec.maxM}m`);
  }
});

test("the walk stays near the walker, and never sends them to another county", () => {
  /* The bug this exists for: a stroll started in Dublin opened a walk in
     Clare, 200km away. Nothing on the route may be further from the start than
     the walk is long, because you have to get back. */
  for (const tier of ALL_TIERS) {
    const { quest } = assembleQuest({ from: CLONTARF, tier, points: POINTS });
    for (const [lng, lat] of quest.path) {
      const out = distanceM(CLONTARF, { lat, lng });
      assert.ok(out < quest.distanceM,
        `${tier} goes ${Math.round(out)}m out on a ${quest.distanceM}m walk`);
    }
  }
});

test("it reaches for the nearest point worth reaching", () => {
  const { quest, anchor } = assembleQuest({ from: CLONTARF, tier: "stroll", points: POINTS });
  assert.ok(anchor, "nothing was anchored, in a corpus with points all round Clontarf");

  const spec = TIERS.find((t) => t.id === "stroll")!;
  const reachable = POINTS
    .map((p) => ({ p, d: distanceM(CLONTARF, { lat: p.lat, lng: p.lng }) }))
    .filter((x) => x.d <= spec.reachM && x.d > 120)
    .sort((a, b) => a.d - b.d);
  assert.ok(reachable.length > 0, "the fixture has nothing in reach to test against");
  assert.equal(anchor!.id, reachable[0].p.id, "a nearer point was passed over");

  // And the walk actually goes there.
  const objective = quest.objectives.find((o) => o.pointId === anchor!.id);
  assert.ok(objective, "the anchor point is not an objective on its own walk");
  const off = distanceM({ lat: objective!.lat, lng: objective!.lng },
    { lat: anchor!.lat, lng: anchor!.lng });
  assert.ok(off < 50, `the objective sits ${Math.round(off)}m from its point`);
});

test("empty ground still produces a walk, and says that it has nothing on it", () => {
  /* Out in the Atlantic there is no point within reach of anything. Refusing
     to build a walk there would mean the app only works where the dataset is
     already thick, which is most of the country nowhere. */
  for (const tier of ALL_TIERS) {
    const { quest, anchor } = assembleQuest({ from: ATLANTIC, tier, points: POINTS });
    assert.equal(anchor, null, `${tier} found a point in the middle of the sea`);
    assert.ok(quest.path.length > 3, `${tier} produced no route`);
    assert.ok(Math.abs(drawnLength(quest.path) - quest.distanceM) < 30);
    assert.ok(quest.objectives.every((o) => o.pointId === null));
    // The walker is told, rather than left to wonder where the point went.
    const said = `${quest.title} ${quest.flavour} ${quest.encounters.map((e) => e.label + (e.detail ?? "")).join(" ")}`;
    assert.match(said, /record|nothing|unrecorded/i,
      "a walk with no point on it does not say so anywhere a walker would read");
  }
});

test("the same request in the same place opens the same walk", () => {
  /* The id is how a generated walk is found again after the picker navigates
     away. Two ids for the same request would pile up near-identical walks. */
  const a = assembleQuest({ from: CLONTARF, tier: "stroll", points: POINTS }).quest;
  const b = assembleQuest({ from: CLONTARF, tier: "stroll", points: POINTS }).quest;
  assert.equal(a.id, b.id);
  assert.deepEqual(a.path, b.path);

  const other = assembleQuest({ from: CLONTARF, tier: "trot", points: POINTS }).quest;
  assert.notEqual(a.id, other.id, "a trot and a stroll share an id");
});

test("a point you are standing on is not somewhere to walk to", () => {
  const onTop: Point[] = [{
    ...POINTS[0], id: "p-underfoot", lat: CLONTARF.lat, lng: CLONTARF.lng,
  }];
  const { anchor } = assembleQuest({ from: CLONTARF, tier: "stroll", points: onTop });
  assert.equal(anchor, null, "it built a walk to the spot it started on");
});

test("duration keeps pace with distance", () => {
  for (const tier of ALL_TIERS) {
    const { quest } = assembleQuest({ from: CLONTARF, tier, points: POINTS });
    const kmh = (quest.distanceM / 1000) / (quest.durationMin / 60);
    assert.ok(kmh > 2.5 && kmh < 5.5,
      `${tier} implies ${kmh.toFixed(1)} km/h, which is not a walk`);
  }
});

/* ---- routing on real ways ----------------------------------------------- */

/** A grid of streets round Clontarf, standing in for what the basemap tiles
 *  hand over. About 110m blocks, which is a city block. */
function streetGrid(origin = CLONTARF, n = 22, block = 0.001) {
  const lines: { coords: [number, number][]; level: number }[] = [];
  const lat0 = origin.lat - (n / 2) * block;
  const lng0 = origin.lng - (n / 2) * block;
  for (let r = 0; r <= n; r++) {
    lines.push({ level: 0, coords: Array.from({ length: n + 1 }, (_, c) =>
      [lng0 + c * block, lat0 + r * block] as [number, number]) });
  }
  for (let c = 0; c <= n; c++) {
    lines.push({ level: 0, coords: Array.from({ length: n + 1 }, (_, r) =>
      [lng0 + c * block, lat0 + r * block] as [number, number]) });
  }
  return lines;
}

test("given streets, the walk stays on them", () => {
  const streets = streetGrid();
  const { quest, routed } = assembleQuest({
    from: CLONTARF, tier: "stroll", shape: "loop", points: POINTS, streets,
  });
  assert.ok(routed, "it fell back to geometry when streets were available");

  /* Every vertex of the route is a point on one of the lines it was given. A
     line that cut across a block would not be. */
  const onStreet = new Set(streets.flatMap((s) => s.coords).map(([lng, lat]) =>
    `${lng.toFixed(5)},${lat.toFixed(5)}`));
  for (const [lng, lat] of quest.path) {
    assert.ok(onStreet.has(`${lng.toFixed(5)},${lat.toFixed(5)}`),
      `the route left the street network at ${lng},${lat}`);
  }
});

test("a routed there and back retraces itself, a routed loop does not", () => {
  const streets = streetGrid();
  const line = assembleQuest({
    from: CLONTARF, tier: "stroll", shape: "line", points: POINTS, streets,
  }).quest;
  const loop = assembleQuest({
    from: CLONTARF, tier: "stroll", shape: "loop", points: POINTS, streets,
  }).quest;

  assert.equal(line.shape, "line");
  assert.equal(loop.shape, "loop");
  assert.ok(Math.abs(overlap(line.path) - 0.5) < 0.01,
    "a there and back does not return along the way it went out");
  assert.ok(overlap(loop.path) < 0.3,
    `the loop retraces ${Math.round(overlap(loop.path) * 100)}% of itself`);
});

test("a routed walk is still the distance it claims, inside its tier", () => {
  const streets = streetGrid();
  for (const tier of ALL_TIERS) {
    const spec = TIERS.find((t) => t.id === tier)!;
    const { quest, routed } = assembleQuest({
      from: CLONTARF, tier, shape: "loop", points: POINTS, streets,
    });
    const drawn = drawnLength(quest.path);
    assert.ok(Math.abs(drawn - quest.distanceM) < 30,
      `${tier} draws ${Math.round(drawn)}m against a stated ${quest.distanceM}m`);
    assert.ok(quest.distanceM >= spec.minM && quest.distanceM <= spec.maxM,
      `${tier} is ${quest.distanceM}m, outside ${spec.minM}-${spec.maxM}m (routed: ${routed})`);
  }
});

test("streets that reach nowhere near the walker are ignored, not trusted", () => {
  /* A graph loaded for somewhere else must not drag the walk across the city.
     Falling back to geometry is the right answer, not snapping to a far street. */
  const elsewhere = streetGrid({ lat: 53.30, lng: -6.40 });
  const { quest, routed } = assembleQuest({
    from: CLONTARF, tier: "stroll", points: POINTS, streets: elsewhere,
  });
  assert.equal(routed, false, "it routed onto streets nowhere near the walker");
  const first = { lng: quest.path[0][0], lat: quest.path[0][1] };
  assert.ok(distanceM(first, CLONTARF) < 5, "the walk no longer starts where the walker is");
});

test("an empty street list behaves exactly as no street list", () => {
  const withNone = assembleQuest({ from: CLONTARF, tier: "trot", points: POINTS, streets: [] });
  const without = assembleQuest({ from: CLONTARF, tier: "trot", points: POINTS });
  assert.equal(withNone.routed, false);
  assert.deepEqual(withNone.quest.path, without.quest.path);
});
