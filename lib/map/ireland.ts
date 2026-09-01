/** Coarse island outline and camera bounds, in world metres from an origin
 *  near Ennistymon.
 *
 *  This is a silhouette, not data: about thirty points traced by eye so that
 *  zooming out reads as Ireland rather than as an empty grid. It is never used
 *  for anything that needs to be true, and it is replaced wholesale by the
 *  real coastline when the PMTiles basemap lands. */

/** Half-extents of the camera clamp. Ireland is roughly 460km east to west
 *  and 480km north to south. */
export const WORLD_HALF_X = 250_000;
export const WORLD_HALF_Y = 265_000;

/** Normalised outline, x east and y south, roughly -1..1. */
const OUTLINE: [number, number][] = [
  [0.05, -1.00], [0.36, -0.94], [0.55, -0.86], [0.50, -0.72], [0.63, -0.62],
  [0.52, -0.52], [0.45, -0.40], [0.58, -0.30], [0.62, -0.14], [0.55, 0.02],
  [0.47, 0.16], [0.30, 0.26], [0.10, 0.38], [-0.06, 0.44], [-0.26, 0.48],
  [-0.38, 0.44], [-0.44, 0.32], [-0.58, 0.30], [-0.72, 0.21], [-0.58, 0.12],
  [-0.52, 0.03], [-0.72, -0.01], [-0.60, -0.09], [-0.48, -0.13], [-0.70, -0.19],
  [-0.86, -0.22], [-0.76, -0.33], [-0.82, -0.44], [-0.70, -0.58], [-0.48, -0.58],
  [-0.44, -0.66], [-0.63, -0.74], [-0.52, -0.88], [-0.24, -0.94],
];

export const IRELAND: [number, number][] = OUTLINE.map(
  ([x, y]) => [x * WORLD_HALF_X * 0.92, y * WORLD_HALF_Y * 0.92],
);
