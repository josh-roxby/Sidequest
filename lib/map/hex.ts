import {
  cellToBoundary, cellToChildren, cellToLatLng, getResolution,
  gridDisk, latLngToCell,
} from "h3-js";
import { distanceM } from "../geo.ts";
import type { LatLng } from "../data/index.ts";
import { project } from "./project.ts";

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
 *  nothing and it stays right if the table ever changes. */
const EDGE_M: Record<number, number> = {
  5: 9854, 6: 3725, 7: 1406, 8: 531, 9: 201, 10: 76,
};

export function resForScale(scale: number, lat: number, targetPx = 64): number {
  /* scale is pixels per Mercator metre, and Mercator over-reads the ground by
     the secant of the latitude, so an edge of E ground metres draws
     E * scale / cos(lat) pixels. */
  const stretch = 1 / Math.cos((lat * Math.PI) / 180);
  let best = RES_COARSEST;
  let bestErr = Infinity;
  for (let r = RES_COARSEST; r <= RES_FINEST; r++) {
    const px = EDGE_M[r] * 2 * scale * stretch;
    const err = Math.abs(Math.log(px / targetPx));
    if (err < bestErr) { bestErr = err; best = r; }
  }
  return best;
}

/** The cell containing a place. */
export function cellAt(p: LatLng, res: number): string {
  return latLngToCell(p.lat, p.lng, res);
}

/** Boundaries are projected once and kept. A pan re-uses almost every cell it
 *  had last frame, and projecting six corners each is a logarithm and an
 *  arctangent apiece: cheap once, wasteful sixty times a second. */
const boundaryCache = new Map<string, [number, number][]>();

export function cellBoundary(cell: string): [number, number][] {
  const hit = boundaryCache.get(cell);
  if (hit) return hit;
  const ring = cellToBoundary(cell).map(([lat, lng]) => {
    const { x, y } = project({ lat, lng });
    return [x, y] as [number, number];
  });
  /* Unbounded growth would be a leak on a long walk. Ten thousand cells is far
     more than any view holds and a trivial amount of memory. */
  if (boundaryCache.size > 10_000) boundaryCache.clear();
  boundaryCache.set(cell, ring);
  return ring;
}

/** Cells covering a rectangle of Mercator space.
 *
 *  Grown outward from the centre with `gridDisk` rather than asked for with
 *  `polygonToCells`: the rectangle is rotated by the camera, so the honest
 *  polygon is not axis aligned, and a disk that covers the diagonal is both
 *  simpler and faster than describing the true shape. */
export function cellsInView(
  centre: LatLng, res: number, radiusMerc: number,
): string[] {
  const stretch = 1 / Math.cos((centre.lat * Math.PI) / 180);
  const radiusGround = radiusMerc / stretch;
  const rings = Math.min(60, Math.ceil(radiusGround / (EDGE_M[res] * 1.5)) + 1);
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
 *  the fog is written from a live position in slice 7. */
export function cellRevealed(cell: string, centre: LatLng, radiusM: number): boolean {
  const [lat, lng] = cellToLatLng(cell);
  if (distanceM({ lat, lng }, centre) < radiusM) return true;
  return cellNoise(cell) > 0.62;
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

/** How strongly the tile layer draws at this zoom. It fades out rather than
 *  vanishing, so a zoomed out map shows the island rather than a lattice. */
export function tileStrength(scale: number): { stroke: number; fill: number } {
  const fade = (a: number, b: number) =>
    Math.max(0, Math.min(1, (scale - a) / (b - a)));
  return { stroke: fade(0.004, 0.02), fill: fade(0.008, 0.03) };
}
