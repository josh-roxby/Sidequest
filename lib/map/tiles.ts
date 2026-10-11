import { VectorTile } from "@mapbox/vector-tile";
import Pbf from "pbf";
import { BASEMAP_URL } from "./style.ts";
import { walkable, type Street } from "./streets.ts";
import { distanceM } from "../geo.ts";
import type { LatLng } from "../data/types.ts";
import type { Path } from "../quest/route.ts";

/** The streets, fetched and decoded rather than read off a map.
 *
 *  Every earlier attempt at this asked a MapLibre map what it could see, and
 *  every one of them broke in a way that only showed up on somebody's phone.
 *  The picker's preview map opens before the walker is placed, so it sits at a
 *  zoom with no streets in the tiles. A second map of our own fixes that and
 *  costs a second WebGL context, which a phone will refuse or take back under
 *  memory pressure. And in both cases the answer to "are the streets loaded
 *  yet" is a guess dressed as a flag.
 *
 *  Tiles are just files. Working out which ones cover the ground, fetching
 *  them and reading the transportation layer has no timing in it, no renderer,
 *  no device limits, and it can be tested properly rather than hoped about.
 *  It is also exactly what MapLibre does with them, so the browser's own cache
 *  usually has them already. */

/** OpenFreeMap's planet tiles stop here, and it is also the zoom below which
 *  OpenMapTiles drops minor roads. There is no reason to ask for any other. */
const Z = 14;

/** A ceiling on one harvest. Thirty six tiles is a six by six block, roughly
 *  eight kilometres square at this latitude, and about as much as is decent to
 *  pull down a mobile connection in one go. Nearest tiles are fetched first,
 *  so a capped harvest still holds the ground under the walker. */
const MAX_TILES = 36;

/** At once. Enough to use the connection, few enough not to monopolise it. */
const CONCURRENCY = 6;

interface TileId { z: number; x: number; y: number }

const key = (t: TileId) => `${t.z}/${t.x}/${t.y}`;

/** Decoded tiles, kept for the session. A walker generating a second walk from
 *  the same street corner pays nothing for it. */
const cache = new Map<string, Street[]>();

/** Where the tile template lives, read once from the source's TileJSON.
 *
 *  Cached as a promise so several harvests at once share one request, and
 *  never retried in a loop: a basemap that will not answer is a thing to
 *  report, not to hammer. */
let template: Promise<string | null> | null = null;

async function tileTemplate(): Promise<string | null> {
  template ??= (async () => {
    if (!BASEMAP_URL) return null;
    try {
      const r = await fetch(BASEMAP_URL);
      if (!r.ok) return null;
      const json = await r.json() as { tiles?: unknown };
      const first = Array.isArray(json.tiles) ? json.tiles[0] : null;
      return typeof first === "string" ? first : null;
    } catch {
      return null;
    }
  })();
  return template;
}

/** Slippy map tile covering a position. The standard Web Mercator formulas,
 *  here rather than in `project.ts` because that one is about pixels. */
function tileAt(p: LatLng, z: number): TileId {
  const n = 2 ** z;
  const lat = (p.lat * Math.PI) / 180;
  return {
    z,
    x: Math.floor(((p.lng + 180) / 360) * n),
    y: Math.floor(((1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2) * n),
  };
}

/** The north west corner of a tile, which is where its local coordinates
 *  start. Used to turn a decoded feature back into lng/lat. */
function cornerOf(t: TileId): LatLng {
  const n = 2 ** t.z;
  const lngDeg = (t.x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * t.y) / n)));
  return { lat: (latRad * 180) / Math.PI, lng: lngDeg };
}

const centreOf = (t: TileId): LatLng => {
  const a = cornerOf(t);
  const b = cornerOf({ ...t, x: t.x + 1, y: t.y + 1 });
  return { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
};

/** Every tile touching the box around a position, nearest first. */
function tilesAround(at: LatLng, radiusM: number): TileId[] {
  const dLat = radiusM / 111_320;
  const dLng = radiusM / (111_320 * Math.cos((at.lat * Math.PI) / 180));
  const nw = tileAt({ lat: at.lat + dLat, lng: at.lng - dLng }, Z);
  const se = tileAt({ lat: at.lat - dLat, lng: at.lng + dLng }, Z);

  const out: TileId[] = [];
  for (let x = nw.x; x <= se.x; x++) {
    for (let y = nw.y; y <= se.y; y++) out.push({ z: Z, x, y });
  }
  out.sort((a, b) => distanceM(at, centreOf(a)) - distanceM(at, centreOf(b)));
  return out.slice(0, MAX_TILES);
}

/** The walkable ways in one tile.
 *
 *  `toGeoJSON` does the tile-local to lng/lat conversion itself, which is the
 *  one piece of this worth not reimplementing: the extent is per layer and the
 *  arithmetic is easy to get subtly wrong. */
function decode(buf: ArrayBuffer, t: TileId): Street[] {
  const layer = new VectorTile(new Pbf(buf)).layers.transportation;
  if (!layer) return [];

  const lines: Street[] = [];
  for (let i = 0; i < layer.length; i++) {
    const f = layer.feature(i);
    const level = walkable(f.properties as Record<string, unknown>);
    if (level === null) continue;

    const g = f.toGeoJSON(t.x, t.y, t.z);
    if (g.geometry.type === "LineString") {
      lines.push({ coords: g.geometry.coordinates as Path, level });
    } else if (g.geometry.type === "MultiLineString") {
      for (const part of g.geometry.coordinates) lines.push({ coords: part as Path, level });
    }
  }
  return lines;
}

async function loadTile(url: string, t: TileId): Promise<Street[]> {
  const k = key(t);
  const had = cache.get(k);
  if (had) return had;
  try {
    const r = await fetch(url
      .replace("{z}", String(t.z)).replace("{x}", String(t.x)).replace("{y}", String(t.y)));
    /* A 204 or a 404 is an ordinary answer out at sea or past the coast, not a
       failure: there is simply no tile there. */
    if (!r.ok || r.status === 204) { cache.set(k, []); return []; }
    const lines = decode(await r.arrayBuffer(), t);
    cache.set(k, lines);
    return lines;
  } catch {
    /* Offline, blocked, or a tile that will not parse. The caller is told by
       getting fewer streets, and says so to the walker. */
    return [];
  }
}

/** Every walkable way within `radiusM` of a position.
 *
 *  Answers with an empty list rather than throwing. A caller holding no
 *  streets tells the walker the ground could not be read, which is honest and
 *  much better than a route drawn across gardens. */
export async function streetsAround(at: LatLng, radiusM: number): Promise<Street[]> {
  const url = await tileTemplate();
  if (!url) return [];

  const want = tilesAround(at, radiusM);
  const out: Street[] = [];
  for (let i = 0; i < want.length; i += CONCURRENCY) {
    const batch = await Promise.all(
      want.slice(i, i + CONCURRENCY).map((t) => loadTile(url, t)));
    for (const lines of batch) out.push(...lines);
  }
  return out;
}

/** Pull the tiles for somewhere before anybody asks for a walk there, so the
 *  press does not pay for the network. Safe to call repeatedly: anything
 *  already in hand is free. */
export function prefetchAround(at: LatLng, radiusM: number): void {
  if (typeof window === "undefined") return;
  void streetsAround(at, radiusM).catch(() => { /* warming only */ });
}
