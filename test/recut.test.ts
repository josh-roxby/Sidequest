import assert from "node:assert/strict";
import { test } from "node:test";
import { recutQuest, passesAll, ROUTED, DRAWN } from "../lib/quest/recut.ts";
import { drawnLength } from "../lib/quest/route.ts";
import { DUBLIN_QUESTS } from "../lib/data/mock/dublin.ts";
import { distanceM } from "../lib/geo.ts";
import { TIERS, type Quest } from "../lib/data/types.ts";
import { overlap } from "../lib/quest/graph.ts";

/** Re-cutting a written walk onto real streets. The corpus was drawn before
 *  there was a router, so every route in it is an arc across the ground; these
 *  are about redrawing one without losing the walk it was. */


/** Streets as a tile hands them over: two points per line, no vertex at any
 *  junction, laid over the ground the corpus uses. */
function grid(centre: { lat: number; lng: number }, n = 60, block = 0.0009) {
  const lat0 = centre.lat - (n / 2) * block;
  const lng0 = centre.lng - (n / 2) * block * 1.6;
  const lines: { coords: [number, number][]; level: number }[] = [];
  for (let r = 0; r <= n; r++) {
    lines.push({ level: 0, coords: [
      [lng0, lat0 + r * block], [lng0 + n * block * 1.6, lat0 + r * block]] });
  }
  for (let c = 0; c <= n; c++) {
    lines.push({ level: 0, coords: [
      [lng0 + c * block * 1.6, lat0], [lng0 + c * block * 1.6, lat0 + n * block]] });
  }
  return lines;
}

const started = (q: Quest) => q.start ?? { lat: q.path[0][1], lng: q.path[0][0] };

test("a written walk comes back drawn on the streets", () => {
  const q = DUBLIN_QUESTS.find((x) => x.id === "q-marino-fairview")!;
  const out = recutQuest(q, grid(started(q)));

  assert.ok(out.honesty.includes(ROUTED), `not routed: ${JSON.stringify(out.honesty)}`);
  assert.ok(out.path.length > q.path.length / 2, "the routed line is barely a line");

  /* Every vertex sits on one of the lines it was given, which is the whole
     complaint: the written route cut across the blocks between them. */
  const centre = started(q);
  const block = 0.0009;
  const lat0 = centre.lat - 30 * block, lng0 = centre.lng - 30 * block * 1.6;
  for (const [lng, lat] of out.path) {
    const onRow = Math.abs((lat - lat0) / block - Math.round((lat - lat0) / block));
    const onCol = Math.abs((lng - lng0) / (block * 1.6) - Math.round((lng - lng0) / (block * 1.6)));
    assert.ok(onRow < 0.02 || onCol < 0.02, `left the streets at ${lng},${lat}`);
  }
});

test("re-cutting keeps the place the walk is named after", () => {
  /* The one that matters. Routing for length alone would keep the distance and
     throw away the reason anybody picked this walk. */
  for (const q of DUBLIN_QUESTS) {
    const out = recutQuest(q, grid(started(q)));
    if (!out.honesty.includes(ROUTED)) continue;

    const required = q.objectives.filter((o) => o.required && o.pointId);
    for (const o of required) {
      const closest = Math.min(...out.path.map(([lng, lat]) =>
        distanceM({ lat, lng }, { lat: o.lat, lng: o.lng })));
      assert.ok(closest < 200,
        `${q.id} re-cut to a route passing ${Math.round(closest)}m from ${o.label}`);
    }
  }
});

test("the distance it claims is the distance it draws, after re-cutting", () => {
  /* A walk that says 6.2km and draws 7.4km has lied about the one number
     people plan their afternoon around. */
  for (const q of DUBLIN_QUESTS) {
    const out = recutQuest(q, grid(started(q)));
    assert.ok(Math.abs(drawnLength(out.path) - out.distanceM) < 30,
      `${q.id} draws ${Math.round(drawnLength(out.path))}m against a stated ${out.distanceM}m`);
    const kmh = (out.distanceM / 1000) / (out.durationMin / 60);
    assert.ok(kmh > 2 && kmh < 5.5, `${q.id} implies ${kmh.toFixed(1)} km/h`);
  }
});

test("the walk still starts where it always started", () => {
  for (const q of DUBLIN_QUESTS) {
    const out = recutQuest(q, grid(started(q)));
    const first = { lng: out.path[0][0], lat: out.path[0][1] };
    assert.ok(distanceM(first, started(q)) < 200,
      `${q.id} now begins ${Math.round(distanceM(first, started(q)))}m from its start`);
  }
});

test("a loop still comes home", () => {
  for (const q of DUBLIN_QUESTS) {
    const out = recutQuest(q, grid(started(q)));
    const a = { lng: out.path[0][0], lat: out.path[0][1] };
    const z = { lng: out.path.at(-1)![0], lat: out.path.at(-1)![1] };
    assert.ok(distanceM(a, z) < 5, `${q.id} does not end where it began`);
  }
});

test("with no streets the written line stands, and says that it is drawn", () => {
  const q = DUBLIN_QUESTS[0];
  const out = recutQuest(q, []);
  assert.deepEqual(out.path, q.path, "it changed a route it had no streets to route on");
  assert.equal(out.distanceM, q.distanceM);
  assert.ok(out.honesty.includes(DRAWN),
    "a walker is left to guess whether the line can be followed");
});

test("streets nowhere near the walk are refused rather than followed", () => {
  const q = DUBLIN_QUESTS[0];
  const out = recutQuest(q, grid({ lat: 53.30, lng: -6.60 }));
  assert.deepEqual(out.path, q.path, "it dragged the walk across the county");
  assert.ok(out.honesty.includes(DRAWN));
});

test("re-cutting twice does not stack up claims about the line", () => {
  const q = DUBLIN_QUESTS.find((x) => x.id === "q-marino-fairview")!;
  const once = recutQuest(q, grid(started(q)));
  const twice = recutQuest(once, grid(started(q)));
  const claims = (x: Quest) => x.honesty.filter((h) => h === ROUTED || h === DRAWN);
  assert.equal(claims(once).length, 1);
  assert.equal(claims(twice).length, 1, `honesty reads ${JSON.stringify(twice.honesty)}`);
});

test("a re-cut walk still passes everything it says it passes", () => {
  const q = DUBLIN_QUESTS.find((x) => x.id === "q-marino-fairview")!;
  const out = recutQuest(q, grid(started(q)));
  if (out.honesty.includes(ROUTED)) {
    assert.ok(passesAll(out) || out.objectives.length > 1,
      "the route no longer goes near its own stops");
  }
});

test("a re-cut walk keeps the length its card promises", () => {
  /* Shortest paths between the places a walk names are shorter than the walk.
     Routing every leg the short way once turned a 2.9km stroll round Santry
     into 1.6km, which is not that walk and not the tier it is filed under. */
  const errs: number[] = [];
  let inBand = 0;
  for (const q of DUBLIN_QUESTS) {
    const out = recutQuest(q, grid(started(q)));
    errs.push(Math.abs(out.distanceM / q.distanceM - 1));
    const spec = TIERS.find((t) => t.id === q.tier)!;
    if (out.distanceM >= spec.minM && out.distanceM <= spec.maxM) inBand++;
  }
  errs.sort((a, b) => a - b);
  const median = errs[Math.floor(errs.length / 2)];
  assert.ok(median < 0.1, `half the corpus is more than ${(median * 100).toFixed(0)}% off its stated length`);
  assert.ok(inBand >= DUBLIN_QUESTS.length - 4,
    `${DUBLIN_QUESTS.length - inBand} walks left the tier they are filed under`);
});

test("a re-cut loop comes home a different way", () => {
  /* Otherwise it is a there and back wearing a loop's chip. */
  for (const q of DUBLIN_QUESTS.filter((x) => x.shape === "loop")) {
    const out = recutQuest(q, grid(started(q)));
    if (!out.honesty.includes(ROUTED)) continue;
    assert.ok(overlap(out.path) < 0.5,
      `${q.id} retraces ${Math.round(overlap(out.path) * 100)}% of itself`);
  }
});

test("every written walk in the corpus can be re-cut", () => {
  /* The whole point of the exercise: no walk should still be showing an arc
     across the ground once there are streets to draw it on. */
  const drawn = DUBLIN_QUESTS.filter((q) =>
    !recutQuest(q, grid(started(q))).honesty.includes(ROUTED));
  assert.deepEqual(drawn.map((q) => q.id), [],
    "these walks could not be routed onto a street grid laid over them");
});

test("a walk is only re-cut if the new line still passes what it is named for", () => {
  /* The guard against a route cut on a thin graph. At the zoom a small preview
     map sits at, the tiles carry dual carriageways and nothing else, and a
     route will happily snap onto one and sail past the Casino at Marino while
     still measuring the right length. The written arc, labelled as drawn, is
     the better answer. */
  for (const q of DUBLIN_QUESTS) {
    const out = recutQuest(q, grid(started(q)));
    if (!out.honesty.includes(ROUTED)) continue;
    assert.ok(passesAll(out), `${q.id} was re-cut onto a line that misses its own point`);
  }
});
