import { distanceM } from "../geo.ts";
import type { LatLng } from "../data/types.ts";

/** Drawing a walk on the ground.
 *
 *  These were living in `scripts/build-dublin.mjs`, which was fine while every
 *  route was baked at build time. A walk assembled from where the walker is
 *  standing needs the same maths at runtime, and two copies of it would drift
 *  the first time one was fixed. So they live here, and the build script and
 *  the assembler both call them.
 *
 *  What they are not: street routing. The line goes where the geometry says,
 *  not where the pavement is. Real routing is slice 5 and needs OSM street
 *  data. Until then a route is honest about its length, its start and the
 *  places it passes, and dishonest about the exact line between them. */

/** Metres per degree of latitude. Close enough everywhere, and the longitude
 *  scale is this divided by cos(lat). */
const M_PER_DEG = 111_320;
const rad = (d: number) => (d * Math.PI) / 180;

export type Path = [number, number][];

/** Deterministic noise from a seed string, so the same request draws the same
 *  walk twice. A walk that changes shape when you glance away is not a walk
 *  anybody can trust. */
function rng(seed: string): () => number {
  let h = 2166136261;
  for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
}

export function drawnLength(path: Path): number {
  let d = 0;
  for (let i = 1; i < path.length; i++) {
    d += distanceM({ lng: path[i - 1][0], lat: path[i - 1][1] },
      { lng: path[i][0], lat: path[i][1] });
  }
  return d;
}

const at = (p: LatLng): [number, number] => [+p.lng.toFixed(6), +p.lat.toFixed(6)];

/** A closed loop of `n` points round a centre, radius wobbled so it reads as a
 *  route rather than a circle. */
function ring(centre: LatLng, radiusM: number, seed: string, n = 26): Path {
  const rand = rng(seed);
  const wob = Array.from({ length: n }, () => 0.72 + rand() * 0.56);
  const pts: Path = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const r = radiusM * wob[i];
    pts.push([
      +(centre.lng + (r * Math.sin(t)) / (M_PER_DEG * Math.cos(rad(centre.lat)))).toFixed(6),
      +(centre.lat + (r * Math.cos(t)) / M_PER_DEG).toFixed(6),
    ]);
  }
  return pts;
}

/** A loop of the stated length that begins and ends where you are standing.
 *
 *  The loop is slid so its first point lands on the start, rather than the
 *  start being the centre it is drawn around: a walk begins on its route, not
 *  at the middle of it. Done the other way it left two spokes from the centre
 *  out to the ring and put every route well over its stated distance. */
export function circleRoute(start: LatLng, targetM: number, seed: string): Path {
  let r = targetM / (2 * Math.PI);
  let path: Path = [];
  for (let i = 0; i < 80; i++) {
    const loop = ring(start, r, seed);
    const dLng = start.lng - loop[0][0], dLat = start.lat - loop[0][1];
    path = loop.map(([lng, lat]) =>
      [+(lng + dLng).toFixed(6), +(lat + dLat).toFixed(6)] as [number, number]);
    path[0] = at(start);
    path.push(path[0]);
    const got = drawnLength(path);
    if (Math.abs(got - targetM) < 2) break;
    r *= targetM / got;
  }
  return path;
}

/** A closed route that actually passes through the places it claims to visit.
 *
 *  The route runs start, via, via, start, each leg bowed outward by an
 *  amplitude converged until the total is the stated distance. Consecutive
 *  legs bow to opposite sides, so an out and back is a loop rather than the
 *  same line walked twice.
 *
 *  Returns null rather than throwing when the vias alone are already longer
 *  than the target: at runtime that is an ordinary outcome, and the caller
 *  wants to try a nearer point rather than handle an exception. */
export function viaRoute(
  start: LatLng, vias: LatLng[], targetM: number, perLeg = 9,
): Path | null {
  const pts = [start, ...vias, start];
  const bearing = (a: LatLng, b: LatLng) =>
    Math.atan2((b.lng - a.lng) * Math.cos(rad((a.lat + b.lat) / 2)), b.lat - a.lat);

  const build = (amp: number): Path => {
    const path: Path = [];
    for (let leg = 0; leg < pts.length - 1; leg++) {
      const a = pts[leg], b = pts[leg + 1];
      const side = leg % 2 === 0 ? 1 : -1;
      const th = bearing(a, b) + Math.PI / 2;
      for (let i = 0; i < perLeg; i++) {
        const t = i / perLeg;
        const off = side * amp * Math.sin(Math.PI * t);
        path.push([
          +(a.lng + (b.lng - a.lng) * t
            + (off * Math.sin(th)) / (M_PER_DEG * Math.cos(rad(a.lat)))).toFixed(6),
          +(a.lat + (b.lat - a.lat) * t + (off * Math.cos(th)) / M_PER_DEG).toFixed(6),
        ]);
      }
    }
    path.push(at(start));
    path[0] = at(start);
    return path;
  };

  if (drawnLength(build(0)) > targetM) return null;

  let lo = 0, hi = Math.max(targetM, 400);
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (drawnLength(build(mid)) < targetM) lo = mid; else hi = mid;
  }
  return build((lo + hi) / 2);
}

/** The point on a route at `atM` along it, so a waypoint is never off it. */
export function alongRoute(path: Path, atM: number): LatLng {
  let acc = 0;
  for (let i = 1; i < path.length; i++) {
    const a = { lng: path[i - 1][0], lat: path[i - 1][1] };
    const b = { lng: path[i][0], lat: path[i][1] };
    const seg = distanceM(a, b);
    if (acc + seg >= atM) {
      const f = seg === 0 ? 0 : (atM - acc) / seg;
      return {
        lat: +(a.lat + (b.lat - a.lat) * f).toFixed(6),
        lng: +(a.lng + (b.lng - a.lng) * f).toFixed(6),
      };
    }
    acc += seg;
  }
  return { lat: path[0][1], lng: path[0][0] };
}

/** How far along a route you are when you are nearest to `p`. */
export function atAlong(path: Path, p: LatLng): number {
  let acc = 0, best = 0, bestD = Infinity;
  for (let i = 1; i < path.length; i++) {
    const a = { lng: path[i - 1][0], lat: path[i - 1][1] };
    const b = { lng: path[i][0], lat: path[i][1] };
    const d = distanceM(a, p);
    if (d < bestD) { bestD = d; best = acc; }
    acc += distanceM(a, b);
  }
  return Math.round(best);
}

/** A point `metres` away on a bearing, in degrees clockwise from north. Used to
 *  aim a walk at open ground when there is nothing to aim it at. */
export function offset(from: LatLng, metres: number, bearingDeg: number): LatLng {
  const th = rad(bearingDeg);
  return {
    lat: +(from.lat + (metres * Math.cos(th)) / M_PER_DEG).toFixed(6),
    lng: +(from.lng + (metres * Math.sin(th)) / (M_PER_DEG * Math.cos(rad(from.lat)))).toFixed(6),
  };
}
