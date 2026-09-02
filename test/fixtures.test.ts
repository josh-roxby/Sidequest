import assert from "node:assert/strict";
import { test } from "node:test";
import { QUESTS, POINTS } from "../lib/data/mock/fixtures.ts";
import { distanceM } from "../lib/geo.ts";
import { IRELAND_BOUNDS } from "../lib/map/project.ts";

/** The fixtures are the only geography the app has until the dataset lands, so
 *  they have to be internally consistent. Every check here corresponds to a
 *  real bug that slice 0 uncovered once the coordinates stopped being made up:
 *  a route whose drawn length contradicted the distance printed beside it, and
 *  an objective twenty-four kilometres from the quest that visits it. */

const pathLength = (path: [number, number][]) => {
  let m = 0;
  for (let i = 0; i < path.length - 1; i++) {
    m += distanceM(
      { lat: path[i][1], lng: path[i][0] },
      { lat: path[i + 1][1], lng: path[i + 1][0] },
    );
  }
  return m;
};

const inIreland = (lat: number, lng: number) =>
  lat > IRELAND_BOUNDS.south && lat < IRELAND_BOUNDS.north &&
  lng > IRELAND_BOUNDS.west && lng < IRELAND_BOUNDS.east;

test("every quest path is on the island", () => {
  for (const q of QUESTS) {
    for (const [lng, lat] of q.path) {
      assert.ok(inIreland(lat, lng), `${q.id} strays to ${lat},${lng}`);
    }
  }
});

test("every point is on the island", () => {
  for (const p of POINTS) assert.ok(inIreland(p.lat, p.lng), `${p.id} at ${p.lat},${p.lng}`);
});

test("a quest's drawn route matches the distance printed beside it", () => {
  for (const q of QUESTS) {
    const drawn = pathLength(q.path);
    const off = Math.abs(drawn - q.distanceM) / q.distanceM;
    assert.ok(off < 0.02,
      `${q.id}: route draws ${Math.round(drawn)}m but claims ${q.distanceM}m`);
  }
});

test("a quest starts where it says it starts", () => {
  for (const q of QUESTS) {
    if (!q.start) continue;
    const first = { lat: q.path[0][1], lng: q.path[0][0] };
    assert.ok(distanceM(first, q.start) < 50,
      `${q.id} begins ${Math.round(distanceM(first, q.start))}m from its stated start`);
  }
});

test("every objective lies on its own quest's route", () => {
  for (const q of QUESTS) {
    for (const o of q.objectives) {
      const near = Math.min(...q.path.map(([lng, lat]) =>
        distanceM({ lat: o.lat, lng: o.lng }, { lat, lng })));
      assert.ok(near < 200,
        `${q.id}/${o.id} sits ${Math.round(near)}m off the route it belongs to`);
    }
  }
});

test("a loop returns to its start and a line does not wander off", () => {
  for (const q of QUESTS) {
    const a = { lat: q.path[0][1], lng: q.path[0][0] };
    const z = { lat: q.path.at(-1)![1], lng: q.path.at(-1)![0] };
    const gap = distanceM(a, z);
    if (q.shape === "loop") {
      assert.ok(gap < 150, `${q.id} is a loop but ends ${Math.round(gap)}m from its start`);
    } else {
      assert.ok(gap < 150, `${q.id} goes out and back, so it should also end where it began`);
    }
  }
});

test("an objective's point, where it has one, is where the objective is", () => {
  const byId = new Map(POINTS.map((p) => [p.id, p]));
  for (const q of QUESTS) {
    for (const o of q.objectives) {
      if (!o.pointId) continue;
      const p = byId.get(o.pointId);
      assert.ok(p, `${o.id} points at ${o.pointId}, which does not exist`);
      const off = distanceM({ lat: o.lat, lng: o.lng }, { lat: p!.lat, lng: p!.lng });
      assert.ok(off < 50, `${o.id} is ${Math.round(off)}m from ${o.pointId}`);
    }
  }
});
