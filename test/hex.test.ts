import assert from "node:assert/strict";
import { test } from "node:test";
import { cellToChildren, cellToLatLng, getResolution, isValidCell } from "h3-js";
import {
  cellAt, cellNoise, cellRevealed, cellRing, cellsInView, EDGE_M,
  majorityRevealed, metresPerPixel, RES_COARSEST, RES_FINEST, RES_ORIENT,
  resForMetresPerPixel, standingGround,
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
  // A radius that swallows the whole coarse cell clears it.
  assert.equal(majorityRevealed(coarse, DEFAULT_CENTRE, 50_000), true);

  /* Walking further never un-clears ground. This is the invariant the majority
     rule actually owes us, and unlike "30m must not clear a parish" it holds
     wherever you stand: reveal is radius OR noise, so a bigger radius can only
     add. That earlier assertion passed on the noise of one particular cell
     over Corofin and failed the moment the default centre moved to Dublin,
     which made it a test of where we happened to be standing. */
  for (const r of [0, 30, 200, 1_000, 5_000]) {
    if (majorityRevealed(coarse, DEFAULT_CENTRE, r)) {
      assert.equal(majorityRevealed(coarse, DEFAULT_CENTRE, r * 2 + 1), true,
        `a ${r}m radius cleared it and ${r * 2 + 1}m did not`);
    }
  }

  /* And the rule is a majority, not a single child: a radius small enough to
     touch one child only cannot be what carries a cell of seven. */
  const kids = cellToChildren(coarse, 7);
  const byNoiseAlone = kids.filter((k) => cellRevealed(k, DEFAULT_CENTRE, 0)).length;
  const withTinyRadius = kids.filter((k) => cellRevealed(k, DEFAULT_CENTRE, 30)).length;
  assert.ok(withTinyRadius - byNoiseAlone <= 1,
    "a 30m radius reached more than the one child it is standing in");
});

test("a view returns cells and they surround the centre", () => {
  const cells = cellsInView(DEFAULT_CENTRE, 9, 3000);
  assert.ok(cells.length > 6, `only ${cells.length} cells`);
  assert.ok(cells.includes(cellAt(DEFAULT_CENTRE, 9)), "the centre cell is missing");
  assert.ok(cells.every(isValidCell));
});

test("standing ground is the cell you are in plus the six touching it", () => {
  const { here, near } = standingGround(DEFAULT_CENTRE, 10);
  assert.equal(here, cellAt(DEFAULT_CENTRE, 10), "you are not in your own cell");
  assert.equal(near.size, 6, `expected six neighbours, got ${near.size}`);
  assert.ok(!near.has(here!), "your own cell is in its own halo");

  /* Every neighbour touches yours: about one cell across, never two. A res 10
     cell has a 76m edge, so centres sit roughly 130m apart. */
  const [lat, lng] = cellToLatLng(here!);
  for (const n of near) {
    const [nlat, nlng] = cellToLatLng(n);
    const d = distanceM({ lat: nlat, lng: nlng }, { lat, lng });
    assert.ok(d > 80 && d < 220, `neighbour ${Math.round(d)}m away is not adjacent`);
  }
});

test("standing ground goes dark once a cell is too big to stand in", () => {
  /* Zoomed out, "the cell you are in" is kilometres wide. Lighting it would
     clear half a county for pinching out, so past RES_ORIENT there is no
     standing ground at all and the fog is uniform. */
  for (let r = RES_COARSEST; r < RES_ORIENT; r++) {
    const { here, near } = standingGround(DEFAULT_CENTRE, r);
    assert.equal(here, null, `res ${r} lit a cell ${EDGE_M[r]}m across`);
    assert.equal(near.size, 0);
  }
  for (let r = RES_ORIENT; r <= RES_FINEST; r++) {
    assert.ok(standingGround(DEFAULT_CENTRE, r).here, `res ${r} lit nothing`);
  }
});

test("the halo is drawn on the same grid as the fog around it", () => {
  /* The halo cells have to be cells of the drawing resolution, or they sit as
     a second grid over the first, which is the bug that made the tiling look
     irregular the first time round. */
  for (const res of [9, 10]) {
    const { here, near } = standingGround(DEFAULT_CENTRE, res);
    assert.equal(getResolution(here!), res);
    for (const n of near) assert.equal(getResolution(n), res);
  }
});
