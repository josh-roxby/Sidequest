import { Map as MLMap, setWorkerUrl } from "maplibre-gl";
import { BASEMAP_URL, surveyStyle } from "./style";
import { walkableLines, type Street } from "./streets";
import { distanceM } from "../geo";
import type { LatLng } from "../data/types";

/** Reading the streets, on a map of our own rather than the walker's.
 *
 *  The router needs the ways around the walker, and until now it got them off
 *  the preview map on the picker screen. That was always a hack and it failed
 *  in every way a hack can. The preview is created before the walker has been
 *  placed, so it opens zoomed out over the whole island where the tiles carry
 *  no streets at all; it is small, so it holds few tiles; and harvesting from
 *  it meant flying the visible camera around and putting it back. Whether a
 *  walk came out routed depended on the zoom of a decoration.
 *
 *  So this is a second map, off screen, sized and zoomed for one job: a
 *  thousand pixels square at a zoom that still carries minor roads. It is
 *  created once and kept, so the second walk of a session is instant, and the
 *  browser's own HTTP cache means its tiles are the same tiles the visible map
 *  already has.
 *
 *  It draws nothing anybody sees, so it carries no attribution control. The
 *  visible map carries it, which is where the licence condition applies. */

/** Big enough to hold a stroll's ground in one view, small enough that the
 *  tiles behind it are a handful rather than a download. */
const SIZE_PX = 1024;

/** OpenMapTiles stops carrying minor roads below about this. Going wider than
 *  one screenful is done by moving, never by zooming out, because zooming out
 *  is how you end up with a graph of dual carriageways. */
const MIN_ZOOM = 14;

/** Stops per axis. Nine views at a thousand pixels is a lot of ground. */
const STOPS_PER_AXIS = 3;

const POLL_MS = 150;

/** Per stop. Generous, because this is a phone on mobile data fetching tiles
 *  it may not have, and the alternative to waiting is telling the walker we
 *  could not read the streets. */
const PER_STOP_MS = 5000;

/** The whole harvest. The picker's takeover is up for all of it. */
const DEADLINE_MS = 20_000;

/** Enough ways to route on. Reaching this ends the harvest early, which is the
 *  common case in a town and is what keeps the wait short. */
const ENOUGH = 400;

let harvester: MLMap | null = null;
let ready: Promise<MLMap> | null = null;

function create(): Promise<MLMap> {
  const host = document.createElement("div");
  /* Laid out rather than hidden. `display: none` and `visibility: hidden` both
     stop the canvas having a size, and a map with no size requests no tiles.
     Off to the side is the only reliable way to have it render and be unseen. */
  host.style.cssText =
    `position:fixed;left:-${SIZE_PX + 100}px;top:0;`
    + `width:${SIZE_PX}px;height:${SIZE_PX}px;pointer-events:none;opacity:0;`;
  host.setAttribute("aria-hidden", "true");
  document.body.appendChild(host);

  setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs");
  const m = new MLMap({
    container: host,
    style: surveyStyle(),
    center: [-6.2603, 53.3498],
    zoom: MIN_ZOOM,
    interactive: false,
    attributionControl: false,
    /* No bounds clamp. This one is not a camera anybody drives, and a clamp
       here would silently refuse to move to a stop near the coast. */
    maxZoom: 18,
    minZoom: 2,
    fadeDuration: 0,
    trackResize: false,
  });
  harvester = m;
  m.on("error", (e) => { console.error("[harvest]", e.error?.message ?? e); });

  return new Promise<MLMap>((resolve) => {
    if (m.loaded()) { resolve(m); return; }
    m.once("load", () => resolve(m));
    /* A style that never loads must not hang the walk. The map is handed back
       anyway and the poll below finds nothing, which the caller reports. */
    window.setTimeout(() => resolve(m), 8000);
  });
}

const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

/** Every walkable way within `radiusM` of a position.
 *
 *  Returns an empty list rather than throwing. A caller with no streets shows
 *  the walker that the ground could not be read, which is the honest outcome
 *  and much better than a route drawn across gardens. */
export async function harvestStreets(at: LatLng, radiusM: number): Promise<Street[]> {
  if (typeof window === "undefined" || !BASEMAP_URL) return [];

  const started = performance.now();
  ready ??= create();
  const m = await ready;

  const rad = (at.lat * Math.PI) / 180;
  const mPerPx = (156_543.034 * Math.cos(rad)) / 2 ** MIN_ZOOM;
  const span = SIZE_PX * mPerPx;

  const dLat = radiusM / 111_320;
  const dLng = radiusM / (111_320 * Math.cos(rad));
  const stops = Math.min(STOPS_PER_AXIS, Math.max(1, Math.ceil((2 * radiusM) / span)));
  const spread = (n: number, half: number) => n === 1 ? [0]
    : Array.from({ length: n }, (_, i) => -half + (2 * half * i) / (n - 1));

  const where: LatLng[] = [];
  for (const oy of spread(stops, dLat)) {
    for (const ox of spread(stops, dLng)) {
      where.push({ lat: at.lat + oy, lng: at.lng + ox });
    }
  }
  /* Nearest first, so a harvest cut short by the deadline still holds the
     ground under the walker rather than a corner of it. */
  where.sort((a, b) => distanceM(at, a) - distanceM(at, b));

  const found = new Map<string, Street>();
  const collect = () => {
    for (const line of walkableLines(m)) {
      /* Tiles clip a street at their edge, so one road arrives in pieces and
         every piece is wanted. Only an identical piece, read twice across two
         stops, is dropped. */
      const a = line.coords[0], b = line.coords[line.coords.length - 1];
      found.set(`${line.level}:${line.coords.length}:${a}:${b}`, line);
    }
  };

  for (const stop of where) {
    if (performance.now() - started > DEADLINE_MS || found.size >= ENOUGH) break;
    m.jumpTo({ center: [stop.lng, stop.lat], zoom: MIN_ZOOM });

    /* Polled, not waited on. Every readiness signal MapLibre offers answers a
       different question: `idle` fires before a cold map has asked for
       anything, and `isStyleLoaded` stays false while an unrelated resource is
       pending. Whether there are ways to read yet is the only thing that
       matters, so it is asked until the answer stops changing. */
    const from = performance.now();
    let quiet = 0;
    for (;;) {
      const before = found.size;
      collect();
      quiet = found.size === before ? quiet + 1 : 0;
      if (quiet >= 3 && found.size > 0) break;
      if (performance.now() - from > PER_STOP_MS) break;
      if (performance.now() - started > DEADLINE_MS) break;
      await sleep(POLL_MS);
    }
  }

  return [...found.values()];
}

/** Start the harvester going before anybody presses anything.
 *
 *  The cold cost is real: a second MapLibre instance means a worker to spin
 *  up, a style to fetch and a first round of tiles, and paying all of that
 *  after the press is what made the first walk of a session fail while the
 *  second and third succeeded. It is the same tiles the visible map is
 *  already fetching, so warming up costs the network nothing it was not
 *  spending anyway.
 *
 *  Safe to call repeatedly and safe to ignore: it starts work and returns.
 *  Somewhere to aim it is optional, but a remembered place means the tiles
 *  waiting when the walker presses are the right ones. */
export function prewarmHarvester(at?: LatLng): void {
  if (typeof window === "undefined" || !BASEMAP_URL) return;
  const first = ready === null;
  ready ??= create();
  if (!at) return;
  void ready.then((m) => {
    /* Only steer it on the way up. Once it is warm, moving it here would
       fight a harvest that might be running. */
    if (first) m.jumpTo({ center: [at.lng, at.lat], zoom: MIN_ZOOM });
  });
}

/** For a screen leaving for good. Not called on every navigation: keeping the
 *  map is the whole reason the second walk of a session is quick. */
export function releaseHarvester(): void {
  harvester?.remove();
  harvester = null;
  ready = null;
}
