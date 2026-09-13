import assert from "node:assert/strict";
import { test } from "node:test";
import { cellToLatLng, cellToParent, getResolution, isValidCell } from "h3-js";
import {
  cellAt, cellRing, cellsInView, EDGE_M, metresPerPixel,
  RES_COARSEST, RES_FINEST, resForMetresPerPixel, visitedAtRes,
} from "../lib/map/hex.ts";
import { DEFAULT_CENTRE } from "../lib/map/project.ts";
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
  const at = (z: number) => resForMetresPerPixel(metresPerPixel(z, lat));
  assert.equal(at(18), RES_FINEST, "zoomed right in");
  assert.equal(at(7), RES_COARSEST, "whole island");
  // Monotonic: zooming out never picks a finer resolution.
  let prev = RES_FINEST;
  for (let z = 18; z >= 6; z--) {
    const r = at(z);
    assert.ok(r <= prev, `zoom ${z} gave res ${r} after ${prev}`);
    prev = r;
  }
});

test("a cell is drawn at roughly the size it was chosen for", () => {
  const lat = DEFAULT_CENTRE.lat;
  for (let z = 8; z <= 18; z++) {
    const mpp = metresPerPixel(z, lat);
    const res = resForMetresPerPixel(mpp);
    const px = (EDGE_M[res] * 2) / mpp;
    // Never a mess of specks: whatever the zoom, a cell keeps a tappable size.
    assert.ok(px > 24, `zoom ${z} draws cells ${px.toFixed(0)}px across`);
    // The upper bound only binds while a finer resolution is still on the
    // ladder. Past that the fog is simply 76m of ground filling more screen,
    // which is what zooming in means.
    if (res < RES_FINEST) {
      assert.ok(px < 260, `zoom ${z} draws cells ${px.toFixed(0)}px across`);
    }
  }
});

test("a cell ring is closed, in GeoJSON order, and sits round its centre", () => {
  const cell = cellAt(DEFAULT_CENTRE, 9);
  const ring = cellRing(cell);
  // Six corners plus the repeat that closes the polygon.
  assert.equal(ring.length, 7);
  assert.deepEqual(ring[0], ring[6]);
  const [lat, lng] = cellToLatLng(cell);
  for (const [lng2, lat2] of ring) {
    // lng/lat, not lat/lng: getting this pair the wrong way round is the
    // classic way to put Ireland in the Indian Ocean.
    assert.ok(Math.abs(lng2 - lng) < 0.02, `lng ${lng2} nowhere near ${lng}`);
    assert.ok(Math.abs(lat2 - lat) < 0.02, `lat ${lat2} nowhere near ${lat}`);
    // A res 9 cell has an edge of about 200m, so every corner is that far out.
    const d = distanceM({ lat: lat2, lng: lng2 }, { lat, lng });
    assert.ok(d > 100 && d < 400, `corner ${d.toFixed(0)}m from centre`);
  }
});

test("the ring cache returns the same ring, not a new one", () => {
  const cell = cellAt(DEFAULT_CENTRE, 8);
  assert.equal(cellRing(cell), cellRing(cell));
});



test("a view returns cells and they surround the centre", () => {
  const cells = cellsInView(DEFAULT_CENTRE, 9, 3000);
  assert.ok(cells.length > 6, `only ${cells.length} cells`);
  assert.ok(cells.includes(cellAt(DEFAULT_CENTRE, 9)), "the centre cell is missing");
  assert.ok(cells.every(isValidCell));
});

test("walked ground rolls up to the resolution the map is drawing", () => {
  // Neighbouring cells rather than hand picked offsets: a res 10 cell is only
  // about 150m across, so degrees chosen by eye land back in the same one.
  const fine = cellsInView(DEFAULT_CENTRE, RES_FINEST, 200).slice(0, 3);
  assert.equal(new Set(fine).size, 3, "the fixture cells are not distinct");

  // At their own resolution they are themselves.
  assert.deepEqual(new Set(visitedAtRes(fine, RES_FINEST)), new Set(fine));

  // Coarser, each is replaced by its ancestor and duplicates collapse.
  for (const res of [9, 8, 7, 6, RES_COARSEST]) {
    const up = visitedAtRes(fine, res);
    assert.deepEqual(new Set(up), new Set(fine.map((c) => cellToParent(c, res))));
    for (const c of up) assert.equal(getResolution(c), res);
    assert.ok(up.length <= fine.length, "rolling up produced more cells than it was given");
  }

  // Three neighbouring cells are one parcel of ground by the time you are
  // looking at the county, which is the point of rolling up at all.
  assert.equal(visitedAtRes(fine, RES_COARSEST).length, 1);
});

test("rolling up never drops or invents ground", () => {
  const fine = cellsInView(DEFAULT_CENTRE, RES_FINEST, 600);
  assert.ok(fine.length > 10, "not enough cells to be a fair test");
  const up = visitedAtRes(fine, 8);
  // Every walked cell is inside something that is drawn.
  for (const c of fine) {
    assert.ok(up.includes(cellToParent(c, 8)), `${c} was walked and is not drawn`);
  }
  // And nothing is drawn that no walked cell sits inside.
  const parents = new Set(fine.map((c) => cellToParent(c, 8)));
  for (const c of up) assert.ok(parents.has(c), `${c} is drawn and was never walked`);
});

test("ground already coarser than the drawing resolution is left alone", () => {
  const coarse = cellAt(DEFAULT_CENTRE, 7);
  assert.deepEqual(visitedAtRes([coarse], RES_FINEST), [coarse]);
});
