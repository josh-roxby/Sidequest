import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildGraph, graphSize, lengthOf, nearestNode, outAndBack, overlap, pathOf,
  routeOfLength, shortestPath,
} from "../lib/quest/graph.ts";
import type { Path } from "../lib/quest/route.ts";
import { distanceM } from "../lib/geo.ts";

/** A street grid, because the real input is street lines and a router that
 *  works on a hand-made triangle proves nothing. Nine by nine blocks of about
 *  110m, laid out around Fairview, so the numbers here are the size of the
 *  numbers in the app. */
const ORIGIN = { lat: 53.3600, lng: -6.2400 };
const BLOCK = 0.001;      // roughly 110m in latitude
const N = 9;

function grid(): Path[] {
  const lines: Path[] = [];
  for (let r = 0; r < N; r++) {
    const row: Path = [];
    for (let c = 0; c < N; c++) row.push([ORIGIN.lng + c * BLOCK, ORIGIN.lat + r * BLOCK]);
    lines.push(row);
  }
  for (let c = 0; c < N; c++) {
    const col: Path = [];
    for (let r = 0; r < N; r++) col.push([ORIGIN.lng + c * BLOCK, ORIGIN.lat + r * BLOCK]);
    lines.push(col);
  }
  return lines;
}

const at = (c: number, r: number) => ({ lat: ORIGIN.lat + r * BLOCK, lng: ORIGIN.lng + c * BLOCK });

test("a grid of streets becomes a connected graph", () => {
  const g = buildGraph(grid());
  assert.equal(graphSize(g), N * N, "junctions were not shared between rows and columns");
  // Every corner reaches every other corner.
  const a = nearestNode(g, at(0, 0))!;
  const b = nearestNode(g, at(N - 1, N - 1))!;
  assert.ok(a && b);
  assert.ok(shortestPath(g, a, b), "opposite corners of a grid are not connected");
});

test("tiles cut a street in two and the router still crosses the join", () => {
  /* Vector tiles clip at their boundaries, so one street arrives as two lines
     whose ends nearly coincide. Without welding, every tile edge is a wall. */
  const gap = 0.000008;  // under a metre, the sort of error clipping leaves
  const west: Path = [[ORIGIN.lng, ORIGIN.lat], [ORIGIN.lng + BLOCK, ORIGIN.lat]];
  const east: Path = [
    [ORIGIN.lng + BLOCK + gap, ORIGIN.lat + gap],
    [ORIGIN.lng + 2 * BLOCK, ORIGIN.lat],
  ];
  const g = buildGraph([west, east]);
  const a = nearestNode(g, at(0, 0))!;
  const b = nearestNode(g, at(2, 0))!;
  assert.ok(shortestPath(g, a, b), "the two halves of one street did not join");
});

test("two streets that merely pass close are not joined", () => {
  /* The weld must not invent a crossing. Twenty metres apart is two streets,
     not one, however near they look at a glance. */
  const north: Path = [[ORIGIN.lng, ORIGIN.lat], [ORIGIN.lng + BLOCK, ORIGIN.lat]];
  const south: Path = [
    [ORIGIN.lng, ORIGIN.lat - 0.0002],
    [ORIGIN.lng + BLOCK, ORIGIN.lat - 0.0002],
  ];
  const g = buildGraph([north, south]);
  const a = nearestNode(g, at(0, 0))!;
  const b = nearestNode(g, { lat: ORIGIN.lat - 0.0002, lng: ORIGIN.lng })!;
  assert.ok(a !== b);
  assert.equal(shortestPath(g, a, b), null, "a crossing was invented between two streets");
});

test("the shortest way through a grid is a staircase, not a detour", () => {
  const g = buildGraph(grid());
  const a = nearestNode(g, at(0, 0))!;
  const b = nearestNode(g, at(3, 2))!;
  const ids = shortestPath(g, a, b)!;
  assert.ok(ids);
  // On a grid the shortest walk is the Manhattan distance, whatever order the
  // turns come in.
  const straight = distanceM(at(0, 0), at(3, 0)) + distanceM(at(3, 0), at(3, 2));
  assert.ok(Math.abs(lengthOf(g, ids) - straight) < 5,
    `walked ${Math.round(lengthOf(g, ids))}m where ${Math.round(straight)}m was available`);
});

test("a there and back returns along the way it went out", () => {
  const g = buildGraph(grid());
  const r = outAndBack(g, at(0, 0), at(3, 2), "line")!;
  assert.ok(r, "no route");

  const half = (r.path.length - 1) / 2;
  assert.ok(Number.isInteger(half), "the route is not symmetric");
  for (let i = 0; i <= half; i++) {
    assert.deepEqual(r.path[half + i], r.path[half - i],
      "the return leg is not the outward leg reversed");
  }
  assert.deepEqual(r.path[0], r.path.at(-1), "it does not come home");
});

test("a loop comes home a different way", () => {
  const g = buildGraph(grid());
  const line = outAndBack(g, at(0, 0), at(3, 2), "line")!;
  const loop = outAndBack(g, at(0, 0), at(3, 2), "loop")!;
  assert.ok(loop, "no loop route");

  assert.deepEqual(loop.path[0], loop.path.at(-1), "the loop does not come home");
  assert.ok(overlap(loop.path) < 0.35,
    `the loop retraces ${Math.round(overlap(loop.path) * 100)}% of itself`);
  /* A there and back walks every edge twice, so exactly half its steps are
     repeats. That is the ceiling for any route that returns, and the point of
     the comparison: the loop is meaningfully below it. */
  assert.ok(Math.abs(overlap(line.path) - 0.5) < 0.01,
    `a there and back scored ${overlap(line.path).toFixed(2)}, not the 0.5 it must`);
  assert.ok(overlap(loop.path) < overlap(line.path) - 0.2,
    "the loop is barely less repetitive than walking out and back");
});

test("a loop down a dead end still gets home", () => {
  /* One street out and nothing else. A loop is impossible, and the right answer
     is to walk back rather than to refuse to produce a walk. */
  const spur: Path = [
    [ORIGIN.lng, ORIGIN.lat],
    [ORIGIN.lng, ORIGIN.lat + BLOCK],
    [ORIGIN.lng, ORIGIN.lat + 2 * BLOCK],
  ];
  const g = buildGraph([spur]);
  const r = outAndBack(g, at(0, 0), at(0, 2), "loop")!;
  assert.ok(r, "a dead end produced no walk at all");
  assert.deepEqual(r.path[0], r.path.at(-1));
  assert.ok(r.metres > 0);
});

test("a route stays on the streets it was given", () => {
  const g = buildGraph(grid());
  const r = outAndBack(g, at(0, 0), at(4, 3), "loop")!;
  for (const [lng, lat] of r.path) {
    /* Every point is a junction of the grid, so both coordinates land on the
       block spacing. A route that cut a corner would not. */
    const c = (lng - ORIGIN.lng) / BLOCK;
    const rr = (lat - ORIGIN.lat) / BLOCK;
    assert.ok(Math.abs(c - Math.round(c)) < 0.02 && Math.abs(rr - Math.round(rr)) < 0.02,
      `the route left the street network at ${lng},${lat}`);
  }
});

test("somewhere with no streets near it gets no route rather than a wrong one", () => {
  const g = buildGraph(grid());
  assert.equal(nearestNode(g, { lat: 53.9, lng: -6.9 }), null);
  assert.equal(outAndBack(g, { lat: 53.9, lng: -6.9 }, at(2, 2), "loop"), null);
});

test("the reported length is the length of the line it returns", () => {
  const g = buildGraph(grid());
  const r = outAndBack(g, at(1, 1), at(5, 4), "loop")!;
  let drawn = 0;
  for (let i = 1; i < r.path.length; i++) {
    drawn += distanceM(
      { lng: r.path[i - 1][0], lat: r.path[i - 1][1] },
      { lng: r.path[i][0], lat: r.path[i][1] },
    );
  }
  assert.ok(Math.abs(drawn - r.metres) < 2,
    `claims ${Math.round(r.metres)}m and draws ${Math.round(drawn)}m`);
});

test("pathOf gives back lng,lat in GeoJSON order", () => {
  const g = buildGraph(grid());
  const id = nearestNode(g, at(2, 3))!;
  const [[lng, lat]] = pathOf(g, [id]);
  assert.ok(Math.abs(lat - at(2, 3).lat) < 1e-5, "latitude is not in the second slot");
  assert.ok(Math.abs(lng - at(2, 3).lng) < 1e-5, "longitude is not in the first slot");
});

/* ---- what vector tiles actually hand over -------------------------------- */

/** The grid above shares a vertex at every junction, which is how a hand made
 *  fixture looks and is not how a vector tile looks. A tile stores each way
 *  separately and simplification drops every vertex on a straight run, so a
 *  straight street arrives as its two endpoints and the streets crossing it in
 *  between leave no trace at all. These are the tests for that. */
function crossingGrid(): Path[] {
  const lines: Path[] = [];
  for (let r = 0; r < N; r++) {
    // Two points only, exactly as a tile simplifies a straight road.
    lines.push([[ORIGIN.lng, ORIGIN.lat + r * BLOCK],
      [ORIGIN.lng + (N - 1) * BLOCK, ORIGIN.lat + r * BLOCK]]);
  }
  for (let c = 0; c < N; c++) {
    lines.push([[ORIGIN.lng + c * BLOCK, ORIGIN.lat],
      [ORIGIN.lng + c * BLOCK, ORIGIN.lat + (N - 1) * BLOCK]]);
  }
  return lines;
}

test("streets that cross without sharing a vertex still make a junction", () => {
  const g = buildGraph(crossingGrid());
  const a = nearestNode(g, at(0, 0))!;
  const b = nearestNode(g, at(4, 5))!;
  assert.ok(a && b, "the corners are not on the network");
  const ids = shortestPath(g, a, b);
  assert.ok(ids, "a grid of crossing streets did not connect, so nothing can route on tiles");

  // And it went the short way, which means it turned at a crossing.
  const straight = distanceM(at(0, 0), at(4, 0)) + distanceM(at(4, 0), at(4, 5));
  assert.ok(Math.abs(lengthOf(g, ids!) - straight) < 20,
    `walked ${Math.round(lengthOf(g, ids!))}m where ${Math.round(straight)}m was available`);
});

test("a bridge does not join the road beneath it", () => {
  /* Two lines that cross on the map and not on the ground. Joining them routes
     a walker off a flyover, so the level has to be respected. */
  const road: Path = [[ORIGIN.lng, ORIGIN.lat], [ORIGIN.lng + 4 * BLOCK, ORIGIN.lat]];
  const bridge: Path = [
    [ORIGIN.lng + 2 * BLOCK, ORIGIN.lat - 2 * BLOCK],
    [ORIGIN.lng + 2 * BLOCK, ORIGIN.lat + 2 * BLOCK],
  ];
  const joined = buildGraph([road, bridge], [0, 0]);
  const apart = buildGraph([road, bridge], [0, 1]);

  const aj = nearestNode(joined, at(0, 0))!;
  const bj = nearestNode(joined, { lat: ORIGIN.lat + 2 * BLOCK, lng: ORIGIN.lng + 2 * BLOCK })!;
  assert.ok(shortestPath(joined, aj, bj), "two ground level streets that cross did not join");

  const aa = nearestNode(apart, at(0, 0))!;
  const ba = nearestNode(apart, { lat: ORIGIN.lat + 2 * BLOCK, lng: ORIGIN.lng + 2 * BLOCK })!;
  assert.equal(shortestPath(apart, aa, ba), null, "the router walked off a bridge");
});

test("lines that pass near without crossing are not joined", () => {
  /* A cut must be a real intersection, not a near miss: splitting on those
     would invent crossings all over a dense street network. */
  const east: Path = [[ORIGIN.lng, ORIGIN.lat], [ORIGIN.lng + 2 * BLOCK, ORIGIN.lat]];
  const stub: Path = [
    [ORIGIN.lng + BLOCK, ORIGIN.lat + 0.0003],
    [ORIGIN.lng + BLOCK, ORIGIN.lat + 2 * BLOCK],
  ];
  const g = buildGraph([east, stub]);
  const a = nearestNode(g, at(0, 0))!;
  const b = nearestNode(g, { lat: ORIGIN.lat + 2 * BLOCK, lng: ORIGIN.lng + BLOCK })!;
  assert.equal(shortestPath(g, a, b), null, "a crossing was invented where the lines do not meet");
});

test("a full walk routes on tile shaped streets, and does not go as the crow flies", () => {
  /* The one that matters. Everything above tests a piece; this is the whole
     question the walker asked: given what a tile actually hands over, does a
     walk of the length they chose come back drawn on the streets. It used to
     come back null, and a null here is the straight line on the map. */
  const g = buildGraph(crossingGrid());
  const from = at(1, 1);

  for (const shape of ["loop", "line"] as const) {
    const r = routeOfLength(g, from, 1600, shape);
    assert.ok(r, `${shape}: no route on a grid of tile shaped streets`);
    assert.ok(Math.abs(r!.metres - 1600) < 1600 * 0.35,
      `${shape} came out ${Math.round(r!.metres)}m against 1600m asked for`);

    /* Drawn on the streets, which is the complaint being answered: every
       vertex sits on a line the graph was built from, so the route turns
       corners rather than cutting across the blocks between them. */
    for (const [lng, lat] of r!.path) {
      const onRow = Math.abs((lat - ORIGIN.lat) / BLOCK - Math.round((lat - ORIGIN.lat) / BLOCK));
      const onCol = Math.abs((lng - ORIGIN.lng) / BLOCK - Math.round((lng - ORIGIN.lng) / BLOCK));
      assert.ok(onRow < 0.02 || onCol < 0.02,
        `${shape} left the street network at ${lng},${lat}`);
    }
  }
});

test("a routed walk turns corners rather than running straight", () => {
  /* A route with two vertices is a straight line whatever it claims, so the
     shape of the answer is checked as well as its length. */
  const g = buildGraph(crossingGrid());
  const r = routeOfLength(g, at(1, 1), 1600, "loop");
  assert.ok(r && r.path.length > 6,
    `the loop came back as ${r?.path.length ?? 0} points, which is not a walk round streets`);
  assert.ok(overlap(r!.path) < 0.5, "the loop retraces itself rather than coming home another way");
});
