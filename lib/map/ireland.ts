import { project } from "./project.ts";

/** Coarse island outline, in Mercator metres.
 *
 *  A silhouette, not data: about thirty points traced by eye so that zooming
 *  out reads as Ireland rather than as an empty grid. It is never used for
 *  anything that needs to be true, and it is replaced wholesale by the real
 *  coastline when the PMTiles basemap lands in slice 1.
 *
 *  Kept in degrees rather than projected metres so that when it is thrown away
 *  the thing replacing it speaks the same language. */
const OUTLINE_DEG: [number, number][] = [
  [-8.15, 55.30], [-7.20, 55.15], [-6.60, 54.95], [-6.75, 54.60], [-6.35, 54.35],
  [-6.70, 54.10], [-6.90, 53.80], [-6.50, 53.55], [-6.05, 53.15], [-6.25, 52.75],
  [-6.50, 52.40], [-7.05, 52.15], [-7.65, 51.90], [-8.15, 51.75], [-8.80, 51.60],
  [-9.20, 51.65], [-9.40, 51.90], [-9.85, 51.95], [-10.30, 52.15], [-9.85, 52.35],
  [-9.65, 52.55], [-10.30, 52.65], [-9.90, 52.85], [-9.55, 53.00], [-10.25, 53.15],
  [-10.75, 53.25], [-10.40, 53.55], [-10.60, 53.85], [-10.20, 54.20], [-9.50, 54.25],
  [-9.35, 54.45], [-9.95, 54.70], [-9.55, 55.05], [-8.70, 55.20],
];

/** The same outline in Mercator metres, computed once at module load. */
export const IRELAND: [number, number][] = OUTLINE_DEG.map(([lng, lat]) => {
  const { x, y } = project({ lat, lng });
  return [x, y];
});
