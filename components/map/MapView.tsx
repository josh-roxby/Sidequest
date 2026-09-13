"use client";
import { LngLatBounds, Map as MLMap, setWorkerUrl, type GeoJSONSource } from "maplibre-gl";
import {
  useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState,
} from "react";
import {
  cellAt, cellRing, metresPerPixel, RES_FINEST, resForMetresPerPixel, visitedAtRes,
} from "@/lib/map/hex";
import { DEFAULT_CENTRE, IRELAND_BOUNDS } from "@/lib/map/project";
import {
  getPosition, LocationError, locationMessage, watchHeading, watchPosition,
  type Fix,
} from "@/lib/location";
import { BASEMAP_URL, surveyStyle } from "@/lib/map/style";
import type { LatLng } from "@/lib/data";
import { Mark, type MarkName } from "@/components/primitives/Marks";
import { AddWheel, type WheelOption } from "@/components/map/AddWheel";
import { cn } from "@/lib/cn";
import "maplibre-gl/dist/maplibre-gl.css";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  kind: "point" | "objective" | "objective-done" | "you" | "note" | "community" | "quest";
  label?: string;
}

/** What a page can ask the map to do. Only the one thing: everything else
 *  flows down as props. */
export interface MapViewHandle {
  /** Start following the walker, skipping the gate. */
  locate: () => void;
}

export interface MapViewProps {
  markers?: MapMarker[];
  /** The active trail, as [lng, lat] pairs. GeoJSON order. */
  trail?: [number, number][];
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
  /** Ground already walked, as H3 cells at `RES_FINEST`. The map lights these
   *  and does not decide what belongs in the set. */
  visited?: string[];
  /** A cell unlocking, so the page can record it. Fires once per cell. */
  onUnlock?: (cell: string) => void;
  /** Why a fix did not arrive, in words fit to show someone. */
  onLocateFail?: (message: string) => void;
  /** Asked before the browser prompt, the first time only. When supplied, the
   *  locate control calls this instead of prompting, and the page calls
   *  `locate` back once the walker has agreed. */
  onAskLocation?: () => boolean;
  /** Lets the page start following once the walker has agreed to the gate it
   *  showed them, without making them press the control a second time. */
  ref?: React.Ref<MapViewHandle>;
  /** A page's own map controls, rendered into the same column as the compass
   *  and the recentre. Pages used to float their own stack at the same gutter
   *  and the two landed on top of each other, which is where the squares
   *  behind the circles came from. */
  controls?: React.ReactNode;
  /** What a long press on open ground can add. Empty or absent switches the
   *  gesture off, which is what a preview map wants. */
  addOptions?: WheelOption[];
  /** The chosen option, and the ground that was held. Not the map centre and
   *  not the walker: the place the thumb was on. */
  onAdd?: (id: string, at: LatLng) => void;
}

/** How long a tile takes to pop when you step into it. Long enough to read as
 *  a reward, short enough that a brisk walk through a row of cells does not
 *  queue up a backlog of flourishes. */
const POP_MS = 620;

/** One cell as a GeoJSON polygon. The ring is cached and already closed, so
 *  this is a wrapper rather than work. */
const cellFeature = (cell: string, properties: Record<string, number> = {}) => ({
  type: "Feature" as const,
  properties,
  geometry: { type: "Polygon" as const, coordinates: [cellRing(cell)] },
});

const collection = (features: ReturnType<typeof cellFeature>[]) =>
  ({ type: "FeatureCollection" as const, features });

const GLYPH: Record<MapMarker["kind"], MarkName | null> = {
  you: null, point: "point", objective: "flag", "objective-done": "badge",
  note: "note", community: "friends", quest: "quest",
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
  markers = [], trail = [], visited = [], onMarker, onUnlock, onAskLocation, ref,
  controls, addOptions = [], onAdd,
  home = DEFAULT_CENTRE, hidden = [], interactive = true, fit, initialZoom = 13,
  onLocate, onLocateFail,
}: MapViewProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  /* Whether the camera is still the walker's. A drag hands it back to them:
     someone who has panned off to look at a headland does not want the map
     yanked back under their thumb on the next fix. The locate control takes
     it again. */
  const following = useRef(false);

  const [ready, setReady] = useState(false);
  const [bearing, setBearing] = useState(0);
  /** Screen positions for the DOM markers, refreshed as the camera moves. */
  const [screen, setScreen] = useState<Record<string, { x: number; y: number }>>({});
  /** Radius of the accuracy ring in screen pixels, kept in step with zoom. */
  const [accuracyPx, setAccuracyPx] = useState(0);
  /** The browser's own estimate of how wrong the fix might be, in metres.
   *  Held apart from the fix itself so the camera painter depends on one
   *  number rather than on every new reading. */
  const [accuracyM, setAccuracyM] = useState(0);

  const { lat: homeLat, lng: homeLng } = home;
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
    m.on("dragstart", () => { following.current = false; });
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

  /* ---- walked ground, repainted when the camera settles ---------------- */
  const visitedKey = visited.join(",");
  const paintVisited = useCallback(() => {
    const m = map.current;
    if (!m) return;
    /* At the resolution the camera is drawing, so the lit ground is one grid
       with the cell that pops on top of it rather than a second grid of a
       different size, which is what made the tiling look irregular before. */
    const res = resForMetresPerPixel(metresPerPixel(m.getZoom(), m.getCenter().lat));
    (m.getSource("visited") as GeoJSONSource | undefined)
      ?.setData(collection(visitedAtRes(visited, res).map((c) => cellFeature(c))));
    // visitedKey is the honest dependency: the same cells in a new array are
    // not a reason to rebuild every polygon.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitedKey]);

  /* ---- a tile popping when you step into it ---------------------------- */
  const popping = useRef<number | null>(null);
  const pop = useCallback((cell: string) => {
    const m = map.current;
    if (!m) return;
    const src = () => m.getSource("tile-pop") as GeoJSONSource | undefined;
    if (popping.current) cancelAnimationFrame(popping.current);

    /* Drawn on its own source for the length of the flourish rather than
       animated inside the visited set, so one cell changing does not mean
       rewriting every polygon on screen sixty times a second.

       There is no scale transform to reach for here: MapLibre draws a polygon
       where its coordinates say, so the pop is carried by opacity and by the
       edge thickening and settling. */
    const t0 = performance.now();
    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / POP_MS);
      // Out and back: bright in the first third, settling through the rest.
      const swell = t < 0.34 ? t / 0.34 : 1 - (t - 0.34) / 0.66;
      src()?.setData(collection([cellFeature(cell, {
        fill: 0.42 + swell * 0.48,
        line: 0.5 + swell * 0.5,
        width: 1 + swell * 2.6,
      })]));
      if (t < 1) {
        popping.current = requestAnimationFrame(frame);
        return;
      }
      popping.current = null;
      src()?.setData(collection([]));
    };
    popping.current = requestAnimationFrame(frame);
  }, []);

  useEffect(() => () => {
    if (popping.current) cancelAnimationFrame(popping.current);
  }, []);

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
    /* The accuracy ring is in metres on the ground, so it has to be re-sized
       every time the camera changes rather than being a fixed number of
       pixels. A phone indoors reports hundreds of metres, and drawing that as
       a small dot would be claiming a precision we do not have. */
    setAccuracyPx(accuracyM
      ? accuracyM / metresPerPixel(m.getZoom(), m.getCenter().lat)
      : 0);
  }, [markers, accuracyM]);

  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    place();
    paintVisited();
    m.on("move", place);
    m.on("moveend", paintVisited);
    return () => { m.off("move", place); m.off("moveend", paintVisited); };
  }, [ready, place, paintVisited]);

  /* ---- press and hold to add ------------------------------------------- */
  /** Where the thumb went down, once the hold has been held long enough. */
  const [wheel, setWheel] = useState<{ x: number; y: number; at: LatLng } | null>(null);
  const hold = useRef<{ id: number; x: number; y: number; timer: number } | null>(null);

  const cancelHold = useCallback(() => {
    if (hold.current) clearTimeout(hold.current.timer);
    hold.current = null;
  }, []);

  /* The map is pinned while the wheel is open. Without this the same drag that
     chooses an option also pans the ground under it, so the pin would land
     somewhere the walker never pointed at. */
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (wheel) {
      m.dragPan.disable();
      m.dragRotate.disable();
      m.touchZoomRotate.disable();
    } else {
      m.dragPan.enable();
      m.dragRotate.enable();
      m.touchZoomRotate.enable();
    }
  }, [wheel]);

  useEffect(() => () => cancelHold(), [cancelHold]);

  const HOLD_MS = 500;
  /** How far the thumb may wander and still count as a hold rather than a pan.
   *  Nobody holds a phone perfectly still, and a stricter number makes the
   *  gesture feel broken rather than precise. */
  const HOLD_SLOP = 12;

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const m = map.current;
    if (!m || !onAdd || addOptions.length === 0 || wheel) return;
    /* A second finger means a pinch, which is a zoom and never an add. */
    if (!e.isPrimary) { cancelHold(); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cancelHold();
    hold.current = {
      id: e.pointerId, x, y,
      timer: window.setTimeout(() => {
        const ll = m.unproject([x, y]);
        setWheel({ x, y, at: { lat: ll.lat, lng: ll.lng } });
        hold.current = null;
      }, HOLD_MS),
    };
  }, [addOptions.length, cancelHold, onAdd, wheel]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const h = hold.current;
    if (!h || e.pointerId !== h.id) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (Math.hypot(e.clientX - rect.left - h.x, e.clientY - rect.top - h.y) > HOLD_SLOP) {
      cancelHold();
    }
  }, [cancelHold]);

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

  /* ---- following a live position --------------------------------------- */
  const [fix, setFix] = useState<Fix | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const stopWatch = useRef<(() => void) | null>(null);
  const stopHeading = useRef<(() => void) | null>(null);
  const lastCell = useRef<string | null>(null);

  useEffect(() => () => { stopWatch.current?.(); stopHeading.current?.(); }, []);

  /* The one place the browser's location prompt is allowed to fire: a press,
     never a page load. docs/ux-loops.md §B-2.

     A refusal is not an error state, it is the map staying where it was, so
     the button says so and moves on. */
  const locate = useCallback(async () => {
    if (locating) return;
    setLocating(true);
    try {
      const first = await getPosition();
      setFix(first);
      setAccuracyM(first.accuracyM);
      onLocate?.({ lat: first.lat, lng: first.lng });
      following.current = true;
      map.current?.easeTo({ center: [first.lng, first.lat], zoom: 16, duration: 620 });

      /* Heading is a separate grant from location on Safari, and a device with
         no magnetometer never answers at all, so the pin has to be right
         without it. Asked here because it must come from inside the gesture. */
      if (!stopHeading.current) stopHeading.current = await watchHeading(setHeading);

      if (!stopWatch.current) {
        stopWatch.current = watchPosition(
          (next) => {
            setFix(next);
            setAccuracyM(next.accuracyM);
            onLocate?.({ lat: next.lat, lng: next.lng });
            if (following.current) {
              map.current?.easeTo({ center: [next.lng, next.lat], duration: 450 });
            }
            /* Unlocking is the walker's business, not the camera's, so it is
               keyed off the fix and always at RES_FINEST: ground you walked is
               76m of ground whatever the map happens to be drawing. */
            const cell = cellAt({ lat: next.lat, lng: next.lng }, RES_FINEST);
            if (cell !== lastCell.current) {
              lastCell.current = cell;
              if (!visited.includes(cell)) {
                pop(cell);
                onUnlock?.(cell);
              }
            }
          },
          (reason) => {
            /* A phone loses its fix under a bridge and finds it again. Once
               there has been one good reading, that is weather rather than
               failure, and putting a notice on screen for it teaches people to
               ignore notices. Only a permission being taken away is worth
               saying out loud. */
            if (reason === "denied") {
              following.current = false;
              onLocateFail?.(locationMessage(reason));
            }
          },
        );
      }
    } catch (err) {
      map.current?.easeTo({ center: [homeLng, homeLat], zoom: 15, duration: 520 });
      if (err instanceof LocationError) onLocateFail?.(locationMessage(err.reason));
    } finally {
      setLocating(false);
    }
    // visited is read inside the watch callback, which is created once; the
    // page owns the set and re-supplies it, so reading a stale array here only
    // ever risks a second pop on a cell already lit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeLat, homeLng, locating, onLocate, onLocateFail, onUnlock, pop]);

  /* The page gets first refusal. On the first press it shows what the location
     is for, and bumps `locateSignal` once the walker has agreed, so the
     browser's own prompt is never the first thing anyone sees. */
  const recentre = useCallback(() => {
    if (onAskLocation?.() === false) return;
    void locate();
  }, [locate, onAskLocation]);

  useImperativeHandle(ref, () => ({ locate: () => void locate() }), [locate]);


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
      data-markers={markers.length}
      /* Walked cells currently lit, so a test can tell an empty set from a
         broken one without reaching into MapLibre. */
      data-visited={visited.length}>
      {/* Sized rather than inset. MapLibre's own stylesheet sets
          `.maplibregl-map { position: relative }` on whatever container it is
          given, which beats an `absolute inset-0` and collapses the element to
          nothing: a zero height container means the map never finishes
          loading, and a map that never loads looks exactly like a map with no
          data on it. */}
      <div
        ref={wrap}
        className="gesture h-full w-full"
        /* On the map surface itself rather than the wrapper, so a press that
           starts on a marker or a control is that control's business. */
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={cancelHold}
        onPointerCancel={cancelHold}
        onPointerLeave={cancelHold}
      />

      {/* How well the phone knows where it is, and which way you are facing.
          Both sit under the markers so the dot is never obscured by its own
          uncertainty. The ring is only drawn once there is a real reading: a
          ring around a default position would be claiming a fix we do not
          have. */}
      {fix && screen.you ? (
        <>
          {accuracyPx > 14 ? (
            <div
              aria-hidden
              className="pointer-events-none absolute z-20 border border-rust/40 bg-rust/10"
              style={{
                left: screen.you.x, top: screen.you.y,
                width: accuracyPx * 2, height: accuracyPx * 2,
                transform: "translate(-50%, -50%)",
                borderRadius: "var(--r-full)",
              }}
            />
          ) : null}
          {heading != null ? (
            /* A cone rather than an arrow, because a phone compass is worth
               about this much confidence. Rotated against the map's own
               bearing so it points at the ground, not at the screen. */
            <div
              aria-hidden
              className="pointer-events-none absolute z-20"
              style={{
                left: screen.you.x, top: screen.you.y,
                width: 0, height: 0,
                borderLeft: "9px solid transparent",
                borderRight: "9px solid transparent",
                borderBottom: "20px solid var(--rust)",
                opacity: 0.55,
                transform: `translate(-50%, -100%) rotate(${heading - bearing}deg)`,
                transformOrigin: "50% 100%",
              }}
            />
          ) : null}
        </>
      ) : null}

      {/* Markers are DOM rather than symbol layers: they carry the app's own
          glyphs, they are the same components the buttons that filter them use,
          and there are never more than a few dozen. */}
      {markers.map((mk) => {
        const at = screen[mk.id];
        if (!at) return null;
        if (mk.kind === "note" && hiddenSet.has("note")) return null;
        if (mk.kind === "community" && hiddenSet.has("community")) return null;
        if (mk.kind === "point" && hiddenSet.has("point")) return null;
        // The quests toggle used to hide a tinted cell. It hides the marker
        // that replaced it, so the control still does what its label says.
        if (mk.kind === "quest" && hiddenSet.has("quests")) return null;
        const glyph = GLYPH[mk.kind];
        return (
          <button
            key={mk.id}
            type="button"
            aria-label={mk.label ?? mk.kind}
            onClick={() => onMarker?.(mk.id)}
            disabled={!onMarker}
            className={cn(
              /* The walker outranks everything else on the map. A dot hidden
                 behind a point marker is the one thing that must never happen:
                 it is the only mark on screen that answers "where am I". */
              mk.kind === "you" ? "absolute z-30" : "absolute z-10",
              "flex items-center justify-center border",
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
          {controls}
        </div>
      ) : null}

      {wheel ? (
        <AddWheel
          at={{ x: wheel.x, y: wheel.y }}
          options={addOptions}
          onPick={(id) => { const at = wheel.at; setWheel(null); onAdd?.(id, at); }}
          onCancel={() => setWheel(null)}
        />
      ) : null}
    </div>
  );
}
