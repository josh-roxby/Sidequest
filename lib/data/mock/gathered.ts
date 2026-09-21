import { distanceM } from "../../geo.ts";
import type { LatLng, Point } from "../types.ts";

/** The gathered county files, fetched only where the walker actually is.
 *
 *  The hand written corpus is imported straight into the bundle, which works
 *  at fifty points and not at eight thousand. Gathered points are data
 *  instead: `scripts/ingest-points.mjs` writes one file per county under
 *  `public/data/points/` with an index of bounding boxes, and this loads a
 *  county only when its box is within reach. Somebody walking in Fairview
 *  downloads Dublin and nothing else. */

interface CountyEntry {
  county: string;
  file: string;
  count: number;
  /** West, south, east, north. */
  bbox: [number, number, number, number];
}

const BASE = "/data/points";

/* Both caches are promises rather than values, so two screens asking at the
   same moment share one request instead of racing two. */
let indexOnce: Promise<CountyEntry[]> | null = null;
const counties = new Map<string, Promise<Point[]>>();

async function index(): Promise<CountyEntry[]> {
  indexOnce ??= fetch(`${BASE}/index.json`)
    .then((r) => (r.ok ? r.json() as Promise<CountyEntry[]> : []))
    .catch(() => {
      /* No gathered data yet is the normal state of this repo, not an error:
         the files are produced elsewhere because this machine cannot reach
         the registers they come from. The app runs on the corpus until they
         land. */
      return [];
    });
  return indexOnce;
}

function load(entry: CountyEntry): Promise<Point[]> {
  const have = counties.get(entry.file);
  if (have) return have;
  const p = fetch(`${BASE}/${entry.file}`)
    .then((r) => (r.ok ? r.json() as Promise<Point[]> : []))
    .catch(() => []);
  counties.set(entry.file, p);
  return p;
}

/** How far a position is from a bounding box, in metres. Zero inside it.
 *
 *  Measured by clamping the position onto the box and taking the distance to
 *  that, which is exact enough at this scale and avoids the corner cases of
 *  comparing degrees of longitude at different latitudes. */
function toBox(p: LatLng, [w, s, e, n]: CountyEntry["bbox"]): number {
  const lat = Math.min(Math.max(p.lat, s), n);
  const lng = Math.min(Math.max(p.lng, w), e);
  return distanceM(p, { lat, lng });
}

export async function gatheredNear(near: LatLng, radiusM: number): Promise<Point[]> {
  /* Fetched on the client and nowhere else. A relative URL has no meaning
     during a server render, and these screens read in an effect anyway. */
  if (typeof window === "undefined") return [];

  const all = await index();
  const wanted = all.filter((c) => toBox(near, c.bbox) <= radiusM);
  if (wanted.length === 0) return [];

  const loaded = await Promise.all(wanted.map(load));
  return loaded.flat().filter((p) => distanceM(near, { lat: p.lat, lng: p.lng }) <= radiusM);
}

/** One list from two sources.
 *
 *  A gathered point can be the same place as a hand placed one: the corpus
 *  put the Casino at Marino in by hand and a Dublin run will find it in the
 *  registers too. Where they collide the gathered one wins, because it is
 *  sourced and surveyed rather than placed from memory. */
export function merge(corpus: Point[], gathered: Point[]): Point[] {
  const out = [...gathered];
  const near = (a: Point, b: Point) =>
    distanceM({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng }) <= 60;
  const alike = (a: Point, b: Point) => {
    const x = a.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const y = b.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    return x.includes(y) || y.includes(x);
  };
  const ids = new Set(gathered.map((p) => p.id));
  for (const p of corpus) {
    if (ids.has(p.id)) continue;
    if (gathered.some((g) => near(g, p) && alike(g, p))) continue;
    out.push(p);
  }
  return out;
}
