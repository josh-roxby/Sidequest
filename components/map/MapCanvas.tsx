"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { hexCentre, hexCorners, hexesInRect, hexKey, hexNoise } from "@/lib/map/hex";

export interface MapMarker {
  id: string;
  /** World coordinates, metres. */
  x: number;
  y: number;
  kind: "point" | "objective" | "objective-done" | "you";
  label?: string;
}

export interface MapCanvasProps {
  markers?: MapMarker[];
  /** World-space polyline for the active trail. */
  trail?: [number, number][];
  /** Hexes holding an available quest, drawn with a rust outline. */
  questTiles?: [number, number][];
  onMarker?: (id: string) => void;
}

interface Camera { x: number; y: number; scale: number; bearing: number }

const HEX_SIZE = 90;          // world metres, circumradius
const MIN_SCALE = 0.25;
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
export function MapCanvas({ markers = [], trail = [], questTiles = [], onMarker }: MapCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cam = useRef<Camera>({ x: 0, y: 0, scale: 1, bearing: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ dist: number; angle: number; cx: number; cy: number } | null>(null);
  const frame = useRef<number | null>(null);
  const size = useRef({ w: 0, h: 0, dpr: 1 });
  const [bearing, setBearing] = useState(0);

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

  const draw = useCallback(() => {
    frame.current = null;
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

    // World rectangle covering the rotated viewport, padded by the diagonal so
    // nothing pops in at the corners while turning.
    const reach = (Math.hypot(w, h) / c.scale) / 2 + HEX_SIZE * 2;
    const minX = c.x - reach, maxX = c.x + reach;
    const minY = c.y - reach, maxY = c.y + reach;

    const corners = hexCorners(HEX_SIZE);
    const questSet = new Set(questTiles.map(([x, y]) => hexKey({ q: Math.round(x), r: Math.round(y) })));

    const fog = css("--map-fog");
    const green = css("--map-green");
    const rule = css("--rule");
    const rust = css("--rust");

    const hexes = hexesInRect(minX, minY, maxX, maxY, HEX_SIZE);
    for (const hx of hexes) {
      const { x, y } = hexCentre(hx, HEX_SIZE);
      const n = hexNoise(hx);
      const near = Math.hypot(x, y) < REVEAL_RADIUS;
      const revealed = near || n > 0.62;

      ctx.beginPath();
      ctx.moveTo(x + corners[0][0], y + corners[0][1]);
      for (let i = 1; i < 6; i++) ctx.lineTo(x + corners[i][0], y + corners[i][1]);
      ctx.closePath();

      if (!revealed) {
        ctx.fillStyle = fog;
        ctx.globalAlpha = 0.72;
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (n > 0.86) {
        ctx.fillStyle = green;
        ctx.fill();
      }

      ctx.strokeStyle = rule;
      ctx.lineWidth = 1 / c.scale;
      ctx.stroke();

      if (questSet.has(hexKey(hx))) {
        ctx.strokeStyle = rust;
        ctx.lineWidth = 2 / c.scale;
        ctx.stroke();
      }
    }

    if (trail.length > 1) {
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
    }

    // Markers counter-rotate so they stay upright however the map is turned.
    const ink = css("--ink");
    const field = css("--field");
    const surface = css("--surface");
    for (const m of markers) {
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(c.bearing);
      ctx.scale(1 / c.scale, 1 / c.scale);
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
        ctx.fillStyle = surface;
        ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = field; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = field;
        ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }, [markers, trail, questTiles]);

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
      setBearing(c.bearing);
      invalidate();
    }
  }, [invalidate, toWorld]);

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
    invalidate();
  }, [invalidate, toWorld]);

  const onClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onMarker) return;
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const w = toWorld(e.clientX - r.left, e.clientY - r.top);
    const hitR = 22 / cam.current.scale;
    const hit = markers.find((m) => Math.hypot(m.x - w.x, m.y - w.y) < hitR);
    if (hit) onMarker(hit.id);
  }, [markers, onMarker, toWorld]);

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
        className="gesture block h-full w-full"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onPointerLeave={endPointer}
        onWheel={onWheel}
        onClick={onClick}
        onContextMenu={(e) => e.preventDefault()}
      />
      <button
        type="button"
        onClick={resetNorth}
        aria-label={`Reset orientation to north. Currently ${Math.round((-bearing * 180) / Math.PI)} degrees`}
        className="absolute flex h-10 w-10 items-center justify-center border border-rule bg-surface active:bg-field-soft"
        style={{
          right: "var(--gutter)",
          top: "calc(env(safe-area-inset-top) + var(--gutter))",
          borderRadius: "var(--r-full)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden
          style={{ transform: `rotate(${-bearing}rad)`, transition: "transform 60ms linear" }}>
          <path d="M9 2.5 L11.6 9 L9 7.6 L6.4 9 Z" fill="var(--rust)" />
          <path d="M9 15.5 L6.4 9 L9 10.4 L11.6 9 Z" fill="var(--stone)" />
        </svg>
      </button>
    </div>
  );
}
