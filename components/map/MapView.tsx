"use client";
import { LngLatBounds, Map as MLMap, setWorkerUrl, type GeoJSONSource } from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  cellAt, cellRing, cellShade, cellsInView, metresPerPixel,
  resForMetresPerPixel, standingGround,
} from "@/lib/map/hex";
import { DEFAULT_CENTRE, IRELAND_BOUNDS } from "@/lib/map/project";
import { getPosition, LocationError, locationMessage } from "@/lib/location";
import { BASEMAP_URL, surveyStyle } from "@/lib/map/style";
import type { LatLng } from "@/lib/data";
import { Mark, type MarkName } from "@/components/primitives/Marks";
import { cn } from "@/lib/cn";
import "maplibre-gl/dist/maplibre-gl.css";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  kind: "point" | "objective" | "objective-done" | "you" | "note" | "community";
  label?: string;
}

export interface MapViewProps {
  markers?: MapMarker[];
  /** The active trail, as [lng, lat] pairs. GeoJSON order. */
  trail?: [number, number][];
  /** Where the available quests start. */
  questTiles?: LatLng[];
  onMarker?: (id: string) => void;
  home?: LatLng;
  /** Marker kinds and overlays currently switched off. */
  hidden?: string[];
  /** Preview mode: no gestures, no controls, no hit testing. */
  interactive?: boolean;
  /** Frame the camera so all of these are on screen. */
  fit?: LatLng[];
  /** Fallback zoom when there is nothing to fit. MapLibre zoom levels. */
  initialZoom?: number;
  /** A real fix, once the walker has asked for one. The page owns where it
   *  goes: the map only reports it. */
  onLocate?: (p: LatLng) => void;
  /** Why a fix did not arrive, in words fit to show someone. */
  onLocateFail?: (message: string) => void;
}

/** How much of the fog is left on the ring around where you are standing.
 *  Half, so the roads and paths under it can be read well enough to judge a
 *  walk without the map being given away. */
const HALF_LIT = 0.5;

/** One cell as a GeoJSON polygon. The ring is cached and already closed, so
 *  this is a wrapper rather than work.
 *
 *  `shade` rides along so the fog layer can vary its opacity per cell without
 *  the style needing to know anything about H3, and `lit` scales it for the
 *  cells next to you. */
const cellFeature = (cell: string, lit = 1) => ({
  type: "Feature" as const,
  properties: { shade: cellShade(cell) * lit },
  geometry: { type: "Polygon" as const, coordinates: [cellRing(cell)] },
});

const GLYPH: Record<MapMarker["kind"], MarkName | null> = {
  you: null, point: "point", objective: "flag", "objective-done": "badge",
  note: "note", community: "friends",
};

/** The map.
 *
 *  MapLibre rather than the canvas that came before it. The canvas drew our own
 *  layers well and was never going to draw ground: tile loading, continuous
 *  zoom across fourteen levels and label placement with collision are the parts
 *  of a map engine that are genuinely hard, and writing them again is months
 *  for no product. What survived from it is every decision it made, which is
 *  the part that mattered. docs/v1-map-build.md slice 1. */
export function MapView({
  markers = [], trail = [], questTiles = [], onMarker,
  home = DEFAULT_CENTRE, hidden = [], interactive = true, fit, initialZoom = 13,
  onLocate, onLocateFail,
}: MapViewProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const [ready, setReady] = useState(false);
  const [bearing, setBearing] = useState(0);
  /** Screen positions for the DOM markers, refreshed as the camera moves. */
  const [screen, setScreen] = useState<Record<string, { x: number; y: number }>>({});

  const { lat: homeLat, lng: homeLng } = home;
  const homeLL = useMemo(() => ({ lat: homeLat, lng: homeLng }), [homeLat, homeLng]);
  const hiddenKey = hidden.join(",");

  /* ---- create once ---------------------------------------------------- */
  useEffect(() => {
    if (!wrap.current || map.current) return;
    /* Before the first map. See scripts/copy-maplibre-worker.mjs for why this
       is not left to the bundler: it resolved the worker to the page itself,
       and every GeoJSON source then hung forever with no error. */
    setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs");
    const m = new MLMap({
      container: wrap.current,
      style: surveyStyle(),
      center: [homeLng, homeLat],
      zoom: initialZoom,
      /* OpenStreetMap is ODbL and attribution is a condition of using it. The
         control is compact so it stays out of the way of the thumb corner. */
      attributionControl: BASEMAP_URL ? { compact: true } : false,
      interactive,
      // The island and nothing else, matching the camera clamp the canvas had.
      maxBounds: [
        [IRELAND_BOUNDS.west, IRELAND_BOUNDS.south],
        [IRELAND_BOUNDS.east, IRELAND_BOUNDS.north],
      ],
      maxZoom: 18,
      minZoom: 6,
    });
    map.current = m;
    /* MapLibre reports a missing source, a bad style or a tile that will not
       load through this rather than by throwing, so without it a broken map is
       a silent blank rectangle. */
    m.on("error", (e) => {
      console.error("[map]", e.error?.message ?? e);
    });
    /* The basemap is declared in the style rather than added here, so its
       layers sit in the draw order the style defines instead of on top of
       everything the app draws. A source that cannot be reached leaves its
       layers empty; the fog, the trail and the markers are unaffected. */
    m.on("load", () => setReady(true));
    return () => { m.remove(); map.current = null; };
    // Created once. Everything below reacts to prop changes on the live map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- fog, recomputed when the camera settles ------------------------- */
  const paintFog = useCallback(() => {
    const m = map.current;
    if (!m) return;
    const c = m.getCenter();
    const here = { lat: c.lat, lng: c.lng };
    const mPerPx = metresPerPixel(m.getZoom(), here.lat);
    const res = resForMetresPerPixel(mPerPx);
    /* Half the viewport diagonal, in ground metres, so a rotated camera never
       shows an unfogged corner. */
    const box = m.getContainer().getBoundingClientRect();
    const reachM = (Math.hypot(box.width, box.height) / 2) * mPerPx;

    /* Three states, not two. The cell you are standing in is clear, the six
       touching it are half lit so the streets under them can be read, and
       everything else is closed. Walked ground subtracts from this on top when
       the fog store lands in slice 6; until then this floor is all there is,
       and it is honest about that rather than drawing a circle of ground
       nobody has walked. */
    const { here: standing, near } = standingGround(homeLL, res);

    const features = [];
    for (const cell of cellsInView(here, res, reachM)) {
      if (cell === standing) continue;
      features.push(cellFeature(cell, near.has(cell) ? HALF_LIT : 1));
    }
    (m.getSource("fog") as GeoJSONSource | undefined)
      ?.setData({ type: "FeatureCollection", features });

    /* At the same resolution as the fog, deliberately. Drawn at a fixed one it
       was a second hex grid of a different size laid over the first, which is
       what made the tiling look irregular: two grids, not one. A quest start
       marks the cell it is standing in, whatever size that cell currently is,
       so it reads as ground rather than as a floating shape. Two starts in one
       cell collapse into one tile, which is correct. */
    const seen = new Set<string>();
    const tiles = [];
    for (const q of questTiles) {
      const cell = cellAt(q, res);
      if (seen.has(cell)) continue;
      seen.add(cell);
      tiles.push(cellFeature(cell));
    }
    (m.getSource("quest-tiles") as GeoJSONSource | undefined)
      ?.setData({ type: "FeatureCollection", features: tiles });
  }, [homeLL, questTiles]);

  /* ---- the trail ------------------------------------------------------- */
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const half = Math.ceil(trail.length / 2);
    const line = (coords: [number, number][]) => ({
      type: "FeatureCollection" as const,
      features: coords.length > 1
        ? [{ type: "Feature" as const, properties: {},
             geometry: { type: "LineString" as const, coordinates: coords } }]
        : [],
    });
    (m.getSource("trail-done") as GeoJSONSource | undefined)?.setData(line(trail.slice(0, half + 1)));
    (m.getSource("trail-todo") as GeoJSONSource | undefined)?.setData(line(trail.slice(half)));
  }, [trail, ready]);

  /* ---- marker positions ------------------------------------------------ */
  const place = useCallback(() => {
    const m = map.current;
    if (!m) return;
    const next: Record<string, { x: number; y: number }> = {};
    for (const mk of markers) {
      const p = m.project([mk.lng, mk.lat]);
      next[mk.id] = { x: p.x, y: p.y };
    }
    setScreen(next);
    setBearing(m.getBearing());
  }, [markers]);

  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    place();
    paintFog();
    m.on("move", place);
    m.on("moveend", paintFog);
    return () => { m.off("move", place); m.off("moveend", paintFog); };
  }, [ready, place, paintFog]);

  /* ---- framing --------------------------------------------------------- */
  const fitKey = fit ? fit.map((f) => `${f.lat},${f.lng}`).join("|") : "";
  useEffect(() => {
    const m = map.current;
    if (!m || !ready || !fit || fit.length === 0) return;
    const b = new LngLatBounds();
    for (const f of fit) b.extend([f.lng, f.lat]);
    m.fitBounds(b, { padding: 56, duration: 0, maxZoom: 16 });
    // fitKey is the honest dependency: the same places in a new array is not a
    // reason to move the camera out from under someone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, ready]);

  /* The one place the browser's location prompt is allowed to fire: a press,
     never a page load. A refusal is not an error state, it is the map staying
     where it was, so the button reports it and moves on. */
  const [locating, setLocating] = useState(false);
  const recentre = useCallback(async () => {
    if (locating) return;
    setLocating(true);
    try {
      const fix = await getPosition();
      map.current?.easeTo({ center: [fix.lng, fix.lat], zoom: 15.5, duration: 620 });
      onLocate?.({ lat: fix.lat, lng: fix.lng });
    } catch (err) {
      map.current?.easeTo({ center: [homeLng, homeLat], zoom: 15, duration: 520 });
      if (err instanceof LocationError) onLocateFail?.(locationMessage(err.reason));
    } finally {
      setLocating(false);
    }
  }, [homeLat, homeLng, locating, onLocate, onLocateFail]);

  const north = useCallback(() => {
    map.current?.easeTo({ bearing: 0, duration: 400 });
  }, []);

  const hiddenSet = useMemo(() => new Set(hiddenKey ? hiddenKey.split(",") : []), [hiddenKey]);

  return (
    /* The map gets a container of its own. MapLibre appends its canvas to
       whatever element it is given, and React's children are already in the
       DOM by then, so sharing one element puts the canvas on top of every
       marker and control. */
    <div className="absolute inset-0 h-full w-full"
      /* Reflected so the map's state is inspectable from the outside: a blank
         rectangle and a loaded map look identical in a screenshot. */
      data-map={ready ? "ready" : "loading"}
      data-markers={markers.length}>
      {/* Sized rather than inset. MapLibre's own stylesheet sets
          `.maplibregl-map { position: relative }` on whatever container it is
          given, which beats an `absolute inset-0` and collapses the element to
          nothing: a zero height container means the map never finishes
          loading, and a map that never loads looks exactly like a map with no
          data on it. */}
      <div ref={wrap} className="gesture h-full w-full" />

      {/* Markers are DOM rather than symbol layers: they carry the app's own
          glyphs, they are the same components the buttons that filter them use,
          and there are never more than a few dozen. */}
      {markers.map((mk) => {
        const at = screen[mk.id];
        if (!at) return null;
        if (mk.kind === "note" && hiddenSet.has("note")) return null;
        if (mk.kind === "community" && hiddenSet.has("community")) return null;
        if (mk.kind === "point" && hiddenSet.has("point")) return null;
        const glyph = GLYPH[mk.kind];
        return (
          <button
            key={mk.id}
            type="button"
            aria-label={mk.label ?? mk.kind}
            onClick={() => onMarker?.(mk.id)}
            disabled={!onMarker}
            className={cn(
              "absolute z-10 flex items-center justify-center border",
              mk.kind === "you"
                ? "h-3.5 w-3.5 border-surface bg-rust"
                : "h-7 w-7 bg-surface",
              mk.kind === "community" ? "border-rust text-rust" : "border-field text-field",
            )}
            style={{
              left: at.x, top: at.y, transform: "translate(-50%, -50%)",
              borderRadius: "var(--r-full)",
            }}
          >
            {glyph ? <Mark name={glyph} size={13} /> : null}
          </button>
        );
      })}


      {interactive ? (
        <div className="absolute z-10 flex flex-col gap-1.5"
          style={{ right: "var(--gutter)", top: "calc(env(safe-area-inset-top) + var(--gutter))" }}>
          <button type="button" onClick={north} aria-label="Reset orientation to north"
            className="flex h-11 w-11 items-center justify-center border border-rule bg-surface text-stone"
            style={{ borderRadius: "var(--r-full)", transform: `rotate(${-bearing}deg)` }}>
            <Mark name="compass" size={17} />
          </button>
          <button type="button" onClick={recentre} aria-label="Centre on my location"
            aria-busy={locating} data-locating={locating}
            className="flex h-11 w-11 items-center justify-center border border-rule bg-surface text-stone disabled:opacity-60"
            disabled={locating}
            style={{ borderRadius: "var(--r-full)" }}>
            <Mark name="center" size={15} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
