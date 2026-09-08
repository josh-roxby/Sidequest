"use client";
import { LngLatBounds, Map as MLMap, setWorkerUrl, type GeoJSONSource } from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  cellAt, cellBoundary, cellsInView, majorityRevealed, metresPerPixel,
  RES_FINEST, resForMetresPerPixel,
} from "@/lib/map/hex";
import { DEFAULT_CENTRE, IRELAND_BOUNDS, unproject } from "@/lib/map/project";
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
}

/** Cleared ground around the opening position, in real metres. Placeholder
 *  until the fog is written from a live position in slice 6. */
const REVEAL_RADIUS_M = 900;

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
      attributionControl: false,
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
    m.on("load", () => {
      /* The detailed ground, if it has been switched on. Added after load so a
         source that fails to reach the network cannot stop the map appearing:
         the coastline and everything the app draws are already there. */
      if (BASEMAP_URL) {
        try {
          m.addSource("basemap", { type: "vector", url: BASEMAP_URL });
        } catch { /* the map is still usable without it */ }
      }
      setReady(true);
    });
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

    const features = [];
    for (const cell of cellsInView(here, res, reachM)) {
      if (majorityRevealed(cell, homeLL, REVEAL_RADIUS_M)) continue;
      const ring = cellBoundary(cell).map(([x, y]) => {
        const p = unproject({ x, y });
        return [p.lng, p.lat];
      });
      features.push({ type: "Feature" as const, properties: {},
        geometry: { type: "Polygon" as const, coordinates: [[...ring, ring[0]]] } });
    }
    (m.getSource("fog") as GeoJSONSource | undefined)
      ?.setData({ type: "FeatureCollection", features });

    const tiles = questTiles.map((q) => {
      const ring = cellBoundary(cellAt(q, RES_FINEST)).map(([x, y]) => {
        const p = unproject({ x, y });
        return [p.lng, p.lat];
      });
      return { type: "Feature" as const, properties: {},
        geometry: { type: "Polygon" as const, coordinates: [[...ring, ring[0]]] } };
    });
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

  const recentre = useCallback(() => {
    map.current?.easeTo({ center: [homeLng, homeLat], zoom: 15, duration: 520 });
  }, [homeLat, homeLng]);

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
            className="flex h-11 w-11 items-center justify-center border border-rule bg-surface text-stone"
            style={{ borderRadius: "var(--r-full)" }}>
            <Mark name="center" size={15} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
