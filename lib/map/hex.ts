import {
  cellToBoundary, cellToChildren, cellToLatLng, getResolution,
  gridDisk, latLngToCell,
} from "h3-js";
import { distanceM } from "../geo.ts";
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

/** Stable pseudo-random in 0..1 from a cell id. Used for the scattered
 *  clearings that make unwalked country read as unknown rather than as empty,
 *  and for the occasional green tile. Deterministic, so the same ground looks
 *  the same on every device. */
export function cellNoise(cell: string, seed = 1): number {
  let h = 2166136261 ^ seed;
  for (let i = 0; i < cell.length; i++) {
    h ^= cell.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

/** Has this ground been cleared?
 *
 *  Ground metres, not Mercator metres: the radius means a real distance a
 *  person walked, and H3 lets us ask that question directly. Placeholder until
 *  the fog is written from a live position in slice 7.
 *
 *  Walked ground and nothing else. This used to clear any cell whose noise
 *  came up over 0.62, which meant a bit under two fifths of the country was
 *  permanently cleared for texture, scattered at random. On a canvas of flat
 *  hexes that read as grain; over a real basemap it reads as static, and it
 *  made the frontier of the fog a rash of holes rather than a line you have
 *  pushed back. The noise is still there and still per cell, but it varies
 *  the shade of the fog rather than punching holes in it: see `cellShade`. */
export function cellRevealed(cell: string, centre: LatLng, radiusM: number): boolean {
  const [lat, lng] = cellToLatLng(cell);
  return distanceM({ lat, lng }, centre) < radiusM;
}

/** How dark this cell's fog sits, 0 to 1, stable for the cell.
 *
 *  Cloud is not one flat tone, and a fog of one flat tone over a hex grid
 *  shows every seam. A narrow band is enough: wide enough to break the grid
 *  up, narrow enough that no cell reads as a different thing. */
export function cellShade(cell: string): number {
  return 0.74 + cellNoise(cell, 7) * 0.2;
}

/** A coarse cell is only clear when most of the ground inside it is. A single
 *  cleared field must not clear a forty kilometre tile.
 *
 *  The children are H3's own, so the majority is over the real subdivision
 *  rather than over seven points sampled around a centre. */
export function majorityRevealed(cell: string, centre: LatLng, radiusM: number): boolean {
  const res = getResolution(cell);
  if (res >= RES_FINEST) return cellRevealed(cell, centre, radiusM);
  const kids = cellToChildren(cell, res + 1);
  let hits = 0;
  for (const k of kids) if (cellRevealed(k, centre, radiusM)) hits++;
  return hits * 2 > kids.length;
}

/** The coarsest resolution at which standing ground is lit.
 *
 *  Res 9 cells are about 400m across. Coarser than that and "the cell you are
 *  standing in" is a few kilometres wide, so lighting it would clear half a
 *  county for zooming out, which is both an exploit and a lie about what you
 *  have seen. Zoomed out past this you are reading a region rather than
 *  placing yourself, and the fog is uniform. */
export const RES_ORIENT = 9;

/** What you can see from where you are standing, before you have walked
 *  anywhere.
 *
 *  A fog that starts fully closed tells you nothing about whether a walk is
 *  worth taking, and a walking app that will not show you your own street is
 *  no use for judging one. So the cell you are in is always clear, and the six
 *  touching it are always half lit: enough to read the streets around you and
 *  place yourself, not enough to hand over the map.
 *
 *  This is a floor, not the fog. Ground you have actually walked clears
 *  permanently on top of it when the fog store lands in slice 6. */
export function standingGround(centre: LatLng, res: number): {
  here: string | null;
  near: Set<string>;
} {
  if (res < RES_ORIENT) return { here: null, near: new Set() };
  const here = cellAt(centre, res);
  const near = new Set(gridDisk(here, 1));
  near.delete(here);
  return { here, near };
}

/** How strongly the tile layer draws at this zoom. It fades out rather than
 *  vanishing, so a zoomed out map shows the island rather than a lattice. */
export function tileStrength(scale: number): { stroke: number; fill: number } {
  const fade = (a: number, b: number) =>
    Math.max(0, Math.min(1, (scale - a) / (b - a)));
  return { stroke: fade(0.004, 0.02), fill: fade(0.008, 0.03) };
}
