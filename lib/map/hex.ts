/** Pointy-top hexagonal tiling in axial coordinates.
 *
 *  Stands in for H3 while the map is a placeholder. The maths is the same
 *  shape as the real thing: a hexagon has one neighbour distance, tiles
 *  without gaps, and counts as an integer. So the fog and territory UI built
 *  against this does not change when H3 lands behind it.
 *  docs/PRD.md §11.5, docs/fog-of-war.md. */

export interface Axial { q: number; r: number }

const SQRT3 = Math.sqrt(3);

/** Centre of a hex in world units, for a given circumradius. */
export function hexCentre(h: Axial, size: number): { x: number; y: number } {
  return { x: size * SQRT3 * (h.q + h.r / 2), y: size * 1.5 * h.r };
}

/** World point to the hex containing it. Rounds in cube space, which is the
 *  only way to round hex coordinates without opening gaps at the seams. */
export function hexAt(x: number, y: number, size: number): Axial {
  const r = (2 / 3) * (y / size);
  const q = (SQRT3 / 3) * (x / size) - r / 2;
  return cubeRound(q, r);
}

function cubeRound(q: number, r: number): Axial {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);
  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return { q: rq, r: rr };
}

export function hexKey(h: Axial): string {
  return `${h.q},${h.r}`;
}

/** Corner offsets for a pointy-top hex, from its centre. */
export function hexCorners(size: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    pts.push([size * Math.cos(a), size * Math.sin(a)]);
  }
  return pts;
}

/** Every hex whose centre falls inside a world rectangle, with a one-ring
 *  margin so tiles clipped by the edge still draw. */
export function hexesInRect(
  minX: number, minY: number, maxX: number, maxY: number, size: number,
): Axial[] {
  const out: Axial[] = [];
  const rMin = Math.floor((2 / 3) * (minY / size)) - 1;
  const rMax = Math.ceil((2 / 3) * (maxY / size)) + 1;
  for (let r = rMin; r <= rMax; r++) {
    const xOffset = (size * SQRT3 * r) / 2;
    const qMin = Math.floor((minX - xOffset) / (size * SQRT3)) - 1;
    const qMax = Math.ceil((maxX - xOffset) / (size * SQRT3)) + 1;
    for (let q = qMin; q <= qMax; q++) out.push({ q, r });
  }
  return out;
}

/** Deterministic pseudo-random in 0..1 from a hex. Decides which tiles read as
 *  revealed in the placeholder, so the map looks identical on every render and
 *  between reloads rather than shimmering as you pan. */
export function hexNoise(h: Axial, seed = 1): number {
  const n = Math.sin(h.q * 127.1 + h.r * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}
