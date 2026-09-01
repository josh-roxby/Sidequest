"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  hexCentre, hexCorners, hexesInRect, hexKey, hexNoise,
  levelForScale, majorityRevealed, sizeForLevel, tileStrength,
} from "@/lib/map/hex";
import { IRELAND, WORLD_HALF_X, WORLD_HALF_Y } from "@/lib/map/ireland";

export interface MapMarker {
  id: string;
  /** World coordinates, metres. */
  x: number;
  y: number;
  kind: "point" | "objective" | "objective-done" | "you" | "note" | "community";
  label?: string;
}

export interface MapCanvasProps {
  markers?: MapMarker[];
  /** World-space polyline for the active trail. */
  trail?: [number, number][];
  /** Hexes holding an available quest, drawn with a rust outline. */
  questTiles?: [number, number][];
  onMarker?: (id: string) => void;
  /** Recentre target, in world metres. */
  home?: { x: number; y: number };
  /** Marker kinds and overlays currently switched off. They keep rendering at
   *  a falling opacity rather than vanishing, so a layer toggle reads as a
   *  fade rather than the canvas blinking. */
  hidden?: string[];
  /** Preview mode: no gestures, no compass, no hit testing. Used where the map
   *  is illustration rather than a thing to drive. */
  interactive?: boolean;
  /** Initial zoom. Previews sit closer in than the full screen map. */
  initialScale?: number;
}

interface Camera { x: number; y: number; scale: number; bearing: number }

/** Low enough to hold the whole island on a phone, high enough to see a
 *  field boundary. Four decimal places of range, which is why the tile layer
 *  has to change resolution rather than just scale. */
const MIN_SCALE = 0.0008;
const MAX_SCALE = 4;
const REVEAL_RADIUS = 900;    // world metres of cleared ground around origin

/** Canvas map with pan, pinch zoom and twist rotation.
 *
 *  Canvas rather than DOM because the tile layer is hundreds of hexes that
 *  redraw on every camera change; as elements that is a layout thrash, as a
 *  canvas it is one paint. It is also the shape MapLibre expects to sit in
 *  later, so the chrome around it survives the swap.
 *
 *  The canvas owns its gestures outright via touch-action: none, so the
 *  browser never competes by scrolling the page or zooming the document
 *  underneath a drag. */
export function MapCanvas({
  markers = [], trail = [], questTiles = [], onMarker,
  interactive = true, initialScale = 1, home = { x: 0, y: 0 }, hidden = [],
}: MapCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cam = useRef<Camera>({ x: 0, y: 0, scale: initialScale, bearing: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ dist: number; angle: number; cx: number; cy: number } | null>(null);
  const frame = useRef<number | null>(null);
  const size = useRef({ w: 0, h: 0, dpr: 1 });
  const [bearing, setBearing] = useState(0);

  /** Current opacity per layer, eased toward its target. Held in a ref and
   *  driven by the same animation frame as the camera, so a fade never causes
   *  a React render and the canvas never clears mid-transition. */
  const alpha = useRef<Record<string, number>>({});
  const hiddenKey = hidden.join(",");
  /** Lets draw schedule its own next frame without referencing itself, which
   *  would be a use-before-declaration inside its own callback. */
  const drawRef = useRef<() => void>(() => {});

  /** Screen point to world point, undoing rotation and zoom. */
  const toWorld = useCallback((sx: number, sy: number) => {
    const { w, h } = size.current;
    const c = cam.current;
    const dx = (sx - w / 2) / c.scale;
    const dy = (sy - h / 2) / c.scale;
    const cos = Math.cos(c.bearing);
    const sin = Math.sin(c.bearing);
    return { x: c.x + dx * cos - dy * sin, y: c.y + dx * sin + dy * cos };
  }, []);

  const clamp = useCallback(() => {
    const c = cam.current;
    c.x = Math.max(-WORLD_HALF_X, Math.min(WORLD_HALF_X, c.x));
    c.y = Math.max(-WORLD_HALF_Y, Math.min(WORLD_HALF_Y, c.y));
  }, []);

  const draw = useCallback(() => {
    frame.current = null;
    const hiddenSet = new Set(hiddenKey ? hiddenKey.split(",") : []);
    const a = alpha.current;
    let settling = false;
    for (const layer of ["point", "note", "community", "trail", "quests"]) {
      const target = hiddenSet.has(layer) ? 0 : 1;
      const current = a[layer] ?? target;
      const next = current + (target - current) * 0.22;
      a[layer] = Math.abs(target - next) < 0.01 ? target : next;
      if (a[layer] !== target) settling = true;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { w, h, dpr } = size.current;
    const c = cam.current;

    const css = (n: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(n).trim();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = css("--map-paper");
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(c.scale, c.scale);
    ctx.rotate(-c.bearing);
    ctx.translate(-c.x, -c.y);

    // Resolution follows zoom, so an on-screen hex stays about 64px whatever
    // the camera is doing.
    const level = levelForScale(c.scale);
    const hexSize = sizeForLevel(level);
    const corners = hexCorners(hexSize);

    // World rectangle covering the rotated viewport, padded by the diagonal so
    // nothing pops in at the corners while turning.
    const reach = (Math.hypot(w, h) / c.scale) / 2 + hexSize * 2;
    const minX = c.x - reach, maxX = c.x + reach;
    const minY = c.y - reach, maxY = c.y + reach;
    const questSet = new Set(
      level === 0
        ? questTiles.map(([x, y]) => hexKey({ q: Math.round(x), r: Math.round(y) }))
        : [],
    );

    const fog = css("--map-fog");
    const green = css("--map-green");
    const rule = css("--rule");
    const rust = css("--rust");

    // The island silhouette. A placeholder outline until the real basemap
    // lands, drawn beneath the tiles so zooming out reads as Ireland rather
    // than as an empty grid.
    if (level >= 4) {
      ctx.beginPath();
      IRELAND.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fillStyle = green;
      ctx.globalAlpha = 0.5;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = css("--stone");
      ctx.lineWidth = 1.5 / c.scale;
      ctx.stroke();
    }

    const strength = tileStrength(c.scale);
    const hexes = strength.fill <= 0.02 && strength.stroke <= 0.02
      ? []
      : hexesInRect(minX, minY, maxX, maxY, hexSize);
    for (const hx of hexes) {
      const { x, y } = hexCentre(hx, hexSize);
      const n = hexNoise(hx);
      // At a coarse level the hex is only clear when most of the ground inside
      // it is. A single revealed field must not clear a forty kilometre tile.
      const revealed = majorityRevealed(x, y, hexSize, REVEAL_RADIUS);

      ctx.beginPath();
      ctx.moveTo(x + corners[0][0], y + corners[0][1]);
      for (let i = 1; i < 6; i++) ctx.lineTo(x + corners[i][0], y + corners[i][1]);
      ctx.closePath();

      if (!revealed) {
        ctx.fillStyle = fog;
        ctx.globalAlpha = 0.72 * strength.fill;
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (level === 0 && n > 0.86) {
        ctx.fillStyle = green;
        ctx.globalAlpha = strength.fill;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      if (strength.stroke > 0.02) {
        ctx.strokeStyle = rule;
        ctx.globalAlpha = strength.stroke;
        ctx.lineWidth = 1 / c.scale;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      if (questSet.has(hexKey(hx)) && (a.quests ?? 1) > 0.01) {
        ctx.strokeStyle = rust;
        ctx.globalAlpha = a.quests ?? 1;
        ctx.lineWidth = 2 / c.scale;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    if (trail.length > 1 && (a.trail ?? 1) > 0.01) {
      ctx.globalAlpha = a.trail ?? 1;
      ctx.strokeStyle = css("--map-trail");
      ctx.lineWidth = 3 / c.scale;
      ctx.lineJoin = "miter";
      ctx.lineCap = "butt";
      const half = Math.ceil(trail.length / 2);
      ctx.beginPath();
      trail.slice(0, half + 1).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
      ctx.setLineDash([10 / c.scale, 8 / c.scale]);
      ctx.beginPath();
      trail.slice(half).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    // Markers counter-rotate so they stay upright however the map is turned.
    const ink = css("--ink");
    const field = css("--field");
    const surface = css("--surface");
    for (const m of markers) {
      const layerAlpha = a[m.kind] ?? 1;
      if (layerAlpha <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha = layerAlpha;
      ctx.translate(m.x, m.y);
      ctx.rotate(c.bearing);
      ctx.scale(1 / c.scale, 1 / c.scale);
      // Markers carry the same glyphs as the buttons that filter them. A
      // separate drawing language for the canvas means learning the legend
      // twice, so a note on the map is the note icon in a ring.
      if (m.kind === "you") {
        ctx.fillStyle = rust;
        ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = surface; ctx.lineWidth = 2.5; ctx.stroke();
      } else if (m.kind === "objective-done") {
        ctx.fillStyle = field;
        ctx.fillRect(-5, -5, 10, 10);
      } else if (m.kind === "objective") {
        ctx.strokeStyle = ink; ctx.lineWidth = 2;
        ctx.strokeRect(-5, -5, 10, 10);
      } else {
        const accent = m.kind === "note" ? ink : m.kind === "community" ? rust : field;
        ctx.fillStyle = surface;
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = accent; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.strokeStyle = accent; ctx.fillStyle = accent; ctx.lineWidth = 1.4;
        if (m.kind === "note") glyphNote(ctx);
        else if (m.kind === "community") glyphPeople(ctx);
        else glyphDiamond(ctx);
      }
      ctx.restore();
    }

    ctx.restore();
    ctx.globalAlpha = 1;

    // Keep stepping while anything is mid-fade. Scheduling from inside draw
    // rather than from React means the tween runs at display rate and cannot
    // be interrupted by an unrelated re-render.
    if (settling && frame.current === null) {
      frame.current = requestAnimationFrame(() => drawRef.current());
    }
  }, [markers, trail, questTiles, hiddenKey]);

  useEffect(() => { drawRef.current = draw; }, [draw]);

  const invalidate = useCallback(() => {
    if (frame.current === null) frame.current = requestAnimationFrame(draw);
  }, [draw]);

  // Size to the container at device pixel ratio, capped at 2. Beyond 2 the
  // extra pixels cost real frame time on a phone and nobody can see them.
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ro = new ResizeObserver(() => {
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size.current = { w: r.width, h: r.height, dpr };
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
      invalidate();
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [invalidate]);

  useEffect(() => { invalidate(); }, [invalidate]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = {
        dist: Math.hypot(b.x - a.x, b.y - a.y),
        angle: Math.atan2(b.y - a.y, b.x - a.x),
        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2,
      };
    }
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const c = cam.current;

    if (pointers.current.size === 1) {
      const dx = (e.clientX - prev.x) / c.scale;
      const dy = (e.clientY - prev.y) / c.scale;
      const cos = Math.cos(c.bearing);
      const sin = Math.sin(c.bearing);
      c.x -= dx * cos - dy * sin;
      c.y -= dx * sin + dy * cos;
      clamp();
      invalidate();
      return;
    }

    if (pointers.current.size === 2 && gesture.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const g = gesture.current;

      const anchor = toWorld((a.x + b.x) / 2, (a.y + b.y) / 2);
      c.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, c.scale * (dist / g.dist)));
      c.bearing -= angle - g.angle;
      // Keep the point under the fingers pinned while zooming and turning.
      const after = toWorld((a.x + b.x) / 2, (a.y + b.y) / 2);
      c.x += anchor.x - after.x;
      c.y += anchor.y - after.y;

      gesture.current = { dist, angle, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
      clamp();
      setBearing(c.bearing);
      invalidate();
    }
  }, [invalidate, toWorld, clamp]);

  const endPointer = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) gesture.current = null;
  }, []);

  const onWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    const c = cam.current;
    const anchor = toWorld(e.clientX - (wrapRef.current?.getBoundingClientRect().left ?? 0),
                           e.clientY - (wrapRef.current?.getBoundingClientRect().top ?? 0));
    c.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, c.scale * (e.deltaY > 0 ? 0.92 : 1.08)));
    const after = toWorld(e.clientX - (wrapRef.current?.getBoundingClientRect().left ?? 0),
                          e.clientY - (wrapRef.current?.getBoundingClientRect().top ?? 0));
    c.x += anchor.x - after.x;
    c.y += anchor.y - after.y;
    clamp();
    invalidate();
  }, [invalidate, toWorld, clamp]);

  const onClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onMarker) return;
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const w = toWorld(e.clientX - r.left, e.clientY - r.top);
    const hitR = 22 / cam.current.scale;
    const hit = markers.find((m) => Math.hypot(m.x - w.x, m.y - w.y) < hitR);
    if (hit) onMarker(hit.id);
  }, [markers, onMarker, toWorld]);

  /** Recentre on the walker, easing position and zoom together. Snaps under
   *  reduced motion, for the same reason the compass does. */
  const recentre = useCallback(() => {
    const c = cam.current;
    const from = { x: c.x, y: c.y, scale: c.scale };
    const to = { x: home.x, y: home.y, scale: 1.4 };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      cam.current = { ...c, ...to }; invalidate(); return;
    }
    const start = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / 520);
      const e = 1 - Math.pow(1 - k, 3);
      c.x = from.x + (to.x - from.x) * e;
      c.y = from.y + (to.y - from.y) * e;
      c.scale = from.scale + (to.scale - from.scale) * e;
      invalidate();
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [home.x, home.y, invalidate]);

  /** Ease the bearing back to north. Short, and skipped under reduced motion,
   *  because a slow spin of the whole map is disorienting rather than nice. */
  const resetNorth = useCallback(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = cam.current.bearing;
    if (reduce || Math.abs(from) < 0.001) {
      cam.current.bearing = 0; setBearing(0); invalidate(); return;
    }
    const start = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / 320);
      const eased = 1 - Math.pow(1 - k, 3);
      cam.current.bearing = from * (1 - eased);
      setBearing(cam.current.bearing);
      invalidate();
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [invalidate]);

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden bg-map-paper">
      <canvas
        ref={canvasRef}
        className={interactive ? "gesture block h-full w-full" : "pointer-events-none block h-full w-full"}
        onPointerDown={interactive ? onPointerDown : undefined}
        onPointerMove={interactive ? onPointerMove : undefined}
        onPointerUp={interactive ? endPointer : undefined}
        onPointerCancel={interactive ? endPointer : undefined}
        onPointerLeave={interactive ? endPointer : undefined}
        onWheel={interactive ? onWheel : undefined}
        onClick={interactive ? onClick : undefined}
        onContextMenu={(e) => e.preventDefault()}
      />
      {interactive ? (
      <div className="absolute flex flex-col gap-1.5"
        style={{ right: "var(--gutter)", top: "calc(env(safe-area-inset-top) + var(--gutter))" }}>
      <button
        type="button"
        onClick={resetNorth}
        aria-label={`Reset orientation to north. Currently ${Math.round((-bearing * 180) / Math.PI)} degrees`}
        className="flex h-10 w-10 items-center justify-center border border-rule bg-surface active:bg-field-soft"
        style={{ borderRadius: "var(--r-full)" }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden
          style={{ transform: `rotate(${-bearing}rad)`, transition: "transform 60ms linear" }}>
          <path d="M9 2.5 L11.6 9 L9 7.6 L6.4 9 Z" fill="var(--rust)" />
          <path d="M9 15.5 L6.4 9 L9 10.4 L11.6 9 Z" fill="var(--stone)" />
        </svg>
      </button>
      <button
        type="button"
        onClick={recentre}
        aria-label="Centre on my location"
        className="flex h-10 w-10 items-center justify-center border border-rule bg-surface text-field active:bg-field-soft"
        style={{ borderRadius: "var(--r-full)" }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden fill="none"
          stroke="currentColor" strokeWidth="1.7" strokeLinecap="square">
          <circle cx="8" cy="8" r="2.6" />
          <path d="M8 1.6v2M8 12.4v2M1.6 8h2M12.4 8h2" />
        </svg>
      </button>
      </div>
      ) : null}
    </div>
  );
}

/* Canvas glyphs, drawn in marker space at the same 16px proportions as the
   SVG marks so the two read as one set. */
function glyphNote(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(-4, -5); ctx.lineTo(1.5, -5); ctx.lineTo(4, -2.5);
  ctx.lineTo(4, 5); ctx.lineTo(-4, 5); ctx.closePath();
  ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-2, 0.5); ctx.lineTo(2, 0.5);
  ctx.moveTo(-2, 2.8); ctx.lineTo(0.8, 2.8);
  ctx.stroke();
}

function glyphPeople(ctx: CanvasRenderingContext2D) {
  ctx.beginPath(); ctx.arc(0, -2.6, 1.9, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 2.4, 3.1, Math.PI, 0); ctx.stroke();
  ctx.beginPath(); ctx.arc(-4.6, -0.8, 1.3, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(4.6, -0.8, 1.3, 0, Math.PI * 2); ctx.stroke();
}

function glyphDiamond(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(0, -4.2); ctx.lineTo(4.2, 0); ctx.lineTo(0, 4.2); ctx.lineTo(-4.2, 0);
  ctx.closePath();
  ctx.stroke();
}
