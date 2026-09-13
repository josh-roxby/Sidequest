import {
  cellToBoundary, cellToParent, getResolution, gridDisk, latLngToCell,
} from "h3-js";
import type { LatLng } from "../data/index.ts";

/** Territory tiles, on real H3.
 *
 *  This replaces an axial hex grid that was a stand-in for H3 while the app
 *  had no real coordinates. H3 rather than our own grid because it is what
 *  `docs/fog-of-war.md` specified, because Postgres has an extension that
 *  speaks the same cell ids, and because a cell index that two people can
 *  compare has to be a standard rather than something we invented.
 *
 *  Resolutions, edge length on the ground:
 *
 *  | res | edge  | note                         |
 *  |-----|-------|------------------------------|
 *  | 10  | 76m   | the finest fog cell          |
 *  | 9   | 201m  |                              |
 *  | 8   | 531m  |                              |
 *  | 7   | 1.4km |                              |
 *  | 6   | 3.7km |                              |
 *  | 5   | 9.9km | the whole island in a screen |
 */

/** A single field. Fine enough that walking a boreen clears ground rather than
 *  a parish, coarse enough that a county is not a million rows. */
export const RES_FINEST = 10;
/** Any coarser and the island is a dozen cells, which reads as nothing. */
export const RES_COARSEST = 5;

/** Pick the resolution whose cells land near `targetPx` across on screen.
 *
 *  H3 resolutions step by about 2.65 in edge length rather than doubling, so
 *  this walks the table instead of taking a logarithm. Six comparisons is
 *  nothing and it stays right if the table ever changes.
 *
 *  Takes ground metres per pixel rather than a zoom or a scale, because that
 *  is the only form of the question with no projection assumption hiding in
 *  it. `metresPerPixel` below turns a MapLibre zoom into one. */
export const EDGE_M: Record<number, number> = {
  5: 9854, 6: 3725, 7: 1406, 8: 531, 9: 201, 10: 76,
};

export function resForMetresPerPixel(mPerPx: number, targetPx = 72): number {
  let best = RES_COARSEST;
  let bestErr = Infinity;
  for (let r = RES_COARSEST; r <= RES_FINEST; r++) {
    /* An edge is half a cell's width, so a cell draws about twice its edge. */
    const px = (EDGE_M[r] * 2) / mPerPx;
    const err = Math.abs(Math.log(px / targetPx));
    if (err < bestErr) { bestErr = err; best = r; }
  }
  return best;
}

/** Ground metres per screen pixel at a MapLibre zoom.
 *
 *  MapLibre cuts the world into 512px tiles, not the 256 the older slippy-map
 *  formula assumes, which is a factor of two and the difference between a fog
 *  cell being a field and being a parish. */
export function metresPerPixel(zoom: number, lat: number): number {
  return (78271.51696 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
}

/** The cell containing a place. */
export function cellAt(p: LatLng, res: number): string {
  return latLngToCell(p.lat, p.lng, res);
}

/** Rings are built once and kept. A pan re-uses almost every cell it had last
 *  frame, and rebuilding seven corners apiece is wasteful sixty times a
 *  second.
 *
 *  In lng/lat and closed, which is GeoJSON order and what MapLibre wants. It
 *  used to be handed back in Mercator and converted straight back to lng/lat
 *  by the only caller, which was a logarithm and an arctangent per corner to
 *  arrive where it started. The map projects; this does not need to. */
const ringCache = new Map<string, [number, number][]>();

export function cellRing(cell: string): [number, number][] {
  const hit = ringCache.get(cell);
  if (hit) return hit;
  const ring = cellToBoundary(cell).map(([lat, lng]) => [lng, lat] as [number, number]);
  ring.push(ring[0]);
  /* Unbounded growth would be a leak on a long walk. Ten thousand cells is far
     more than any view holds and a trivial amount of memory. */
  if (ringCache.size > 10_000) ringCache.clear();
  ringCache.set(cell, ring);
  return ring;
}

/** Cells covering a rectangle of Mercator space.
 *
 *  Grown outward from the centre with `gridDisk` rather than asked for with
 *  `polygonToCells`: the viewport is rotated by the camera, so the honest
 *  polygon is not axis aligned, and a disk that covers the diagonal is both
 *  simpler and faster than describing the true shape. The radius is ground
 *  metres. */
export function cellsInView(centre: LatLng, res: number, radiusM: number): string[] {
  const rings = Math.min(60, Math.ceil(radiusM / (EDGE_M[res] * 1.5)) + 1);
  return gridDisk(cellAt(centre, res), rings);
}

/** Where you have walked, at the resolution the map is drawing.
 *
 *  Visited ground is stored once, at `RES_FINEST`, because that is the truth:
 *  a cell you walked through is about 76m of ground and stays that size
 *  whatever the camera is doing. Drawing it is a different question. Zoomed
 *  out, a thousand 76m hexes is a thousand specks, so each is rolled up to its
 *  ancestor at the drawing resolution and de-duplicated. A coarse cell counts
 *  as walked if any of the ground inside it was, which is the honest reading
 *  of a footprint: you were there.
 *
 *  This replaced a fog of war. The fog hid unwalked country, and hiding the
 *  country is the wrong trade for a walking app, because you cannot judge
 *  whether a walk is worth taking through cloud. Nothing is hidden now and the
 *  ground you have covered is lit instead. docs/v1-map-build.md. */
export function visitedAtRes(visited: Iterable<string>, res: number): string[] {
  const out = new Set<string>();
  for (const cell of visited) {
    const r = getResolution(cell);
    out.add(r <= res ? cell : cellToParent(cell, res));
  }
  return [...out];
}
