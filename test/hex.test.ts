import assert from "node:assert/strict";
import { test } from "node:test";
import { cellToLatLng, getResolution, isValidCell } from "h3-js";
import {
  cellAt, cellBoundary, cellNoise, cellRevealed, cellsInView,
  majorityRevealed, RES_COARSEST, RES_FINEST, resForScale,
} from "../lib/map/hex.ts";
import { DEFAULT_CENTRE, project } from "../lib/map/project.ts";
import { distanceM } from "../lib/geo.ts";

test("a place lands in a valid cell that contains it", () => {
  for (let r = RES_COARSEST; r <= RES_FINEST; r++) {
    const cell = cellAt(DEFAULT_CENTRE, r);
    assert.ok(isValidCell(cell), `res ${r} produced ${cell}`);
    assert.equal(getResolution(cell), r);
    const [lat, lng] = cellToLatLng(cell);
    // The centre of the containing cell is never further than a cell away.
    assert.ok(distanceM({ lat, lng }, DEFAULT_CENTRE) < 20_000);
  }
});

test("resolution follows zoom, finest when close and coarsest when far", () => {
  const lat = DEFAULT_CENTRE.lat;
  assert.equal(resForScale(2, lat), RES_FINEST, "zoomed right in");
  assert.equal(resForScale(0.0008, lat), RES_COARSEST, "whole island");
  // Monotonic: zooming out never picks a finer resolution.
  let prev = RES_FINEST;
  for (const s of [2, 1, 0.5, 0.2, 0.1, 0.04, 0.01, 0.004, 0.0008]) {
    const r = resForScale(s, lat);
    assert.ok(r <= prev, `scale ${s} gave res ${r} after ${prev}`);
    prev = r;
  }
});

test("a cell boundary is a closed ring of six corners round its centre", () => {
  const cell = cellAt(DEFAULT_CENTRE, 9);
  const ring = cellBoundary(cell);
  assert.equal(ring.length, 6);
  const [lat, lng] = cellToLatLng(cell);
  const c = project({ lat, lng });
  for (const [x, y] of ring) {
    const d = Math.hypot(x - c.x, y - c.y);
    assert.ok(d > 100 && d < 1000, `corner ${d.toFixed(0)} Mercator m from centre`);
  }
});

test("the boundary cache returns the same ring, not a new one", () => {
  const cell = cellAt(DEFAULT_CENTRE, 8);
  assert.equal(cellBoundary(cell), cellBoundary(cell));
});

test("ground under your feet is revealed and distant ground mostly is not", () => {
  const here = cellAt(DEFAULT_CENTRE, RES_FINEST);
  assert.ok(cellRevealed(here, DEFAULT_CENTRE, 900));
  // Twenty kilometres away, only the noise clears anything, so most is fog.
  const far = cellsInView({ lat: 52.75, lng: -9.06 }, RES_FINEST, 2000)
    .filter((c) => cellRevealed(c, DEFAULT_CENTRE, 900));
  const all = cellsInView({ lat: 52.75, lng: -9.06 }, RES_FINEST, 2000);
  assert.ok(far.length / all.length < 0.5, `${far.length}/${all.length} cleared`);
});

test("noise is stable for a cell and differs between cells", () => {
  const a = cellAt(DEFAULT_CENTRE, 10);
  const b = cellAt({ lat: 52.75, lng: -9.06 }, 10);
  assert.equal(cellNoise(a), cellNoise(a));
  assert.notEqual(cellNoise(a), cellNoise(b));
  for (const c of [a, b]) {
    assert.ok(cellNoise(c) >= 0 && cellNoise(c) < 1);
  }
});

test("a coarse cell needs most of its ground cleared, not one field", () => {
  const coarse = cellAt(DEFAULT_CENTRE, 6);
  // A radius that clears one fine cell must not clear the parish above it.
  assert.equal(majorityRevealed(coarse, DEFAULT_CENTRE, 30), false);
  // A radius that swallows the whole coarse cell must.
  assert.equal(majorityRevealed(coarse, DEFAULT_CENTRE, 50_000), true);
});

test("a view returns cells and they surround the centre", () => {
  const cells = cellsInView(DEFAULT_CENTRE, 9, 3000);
  assert.ok(cells.length > 6, `only ${cells.length} cells`);
  assert.ok(cells.includes(cellAt(DEFAULT_CENTRE, 9)), "the centre cell is missing");
  assert.ok(cells.every(isValidCell));
});
