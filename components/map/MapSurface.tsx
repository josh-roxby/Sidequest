import type { Point, Quest } from "@/lib/data";

interface MapSurfaceProps {
  points?: Point[];
  quest?: Quest | null;
  /** Rectangles of unrevealed ground, normalised. Stands in for H3 hexes
   *  until the real fog lands. */
  fog?: [number, number, number, number][];
  onPoint?: (p: Point) => void;
}

const DEFAULT_FOG: [number, number, number, number][] = [
  [0, 0, 0.46, 0.22], [0.72, 0, 0.28, 0.44], [0, 0.78, 0.34, 0.22], [0.86, 0.62, 0.14, 0.38],
];

/** Placeholder map, built to the real tokens so the chrome around it does not
 *  need reworking when MapLibre lands. Deliberately not a vendor embed: this
 *  phase has no tile build and no map budget. docs/reface-plan.md.
 *
 *  Positions and objectives are SQUARES, not pins. A teardrop pin is the most
 *  generic element in mobile mapping and dropping it is most of what makes
 *  this map read as ours. docs/design-system.md §E. */
export function MapSurface({ points = [], quest, fog = DEFAULT_FOG, onPoint }: MapSurfaceProps) {
  const path = quest?.path ?? [];
  const half = Math.ceil(path.length / 2);

  return (
    <div className="absolute inset-0 overflow-hidden bg-map-paper">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(22,24,26,.055) 1px, transparent 1px)," +
            "linear-gradient(to bottom, rgba(22,24,26,.055) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div aria-hidden className="absolute" style={{ left: "8%", top: "40%", width: "40%", height: "20%", background: "var(--map-green)" }} />
      <div aria-hidden className="absolute" style={{ left: "44%", top: "70%", width: "34%", height: "16%", background: "var(--map-water)" }} />

      {fog.map(([x, y, w, h], i) => (
        <div
          key={i}
          aria-hidden
          className="absolute"
          style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`,
            height: `${h * 100}%`, background: "var(--map-fog)", opacity: 0.62 }}
        />
      ))}

      {path.length > 1 ? (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100"
          preserveAspectRatio="none" aria-hidden>
          <polyline
            points={path.slice(0, half + 1).map(([x, y]) => `${x * 100},${y * 100}`).join(" ")}
            fill="none" stroke="var(--map-trail)" strokeWidth="0.6" vectorEffect="non-scaling-stroke"
            style={{ strokeWidth: 2 }}
          />
          <polyline
            points={path.slice(half).map(([x, y]) => `${x * 100},${y * 100}`).join(" ")}
            fill="none" stroke="var(--map-trail)" strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke" style={{ strokeWidth: 2 }}
          />
        </svg>
      ) : null}

      {quest?.objectives.map((o) => (
        <span
          key={o.id}
          aria-hidden
          className="absolute"
          style={{
            left: `${o.x * 100}%`, top: `${o.y * 100}%`, width: 9, height: 9,
            transform: "translate(-50%,-50%)",
            background: o.required ? "transparent" : "var(--field)",
            boxShadow: o.required ? "inset 0 0 0 2px var(--ink)" : undefined,
          }}
        />
      ))}

      {points.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onPoint?.(p)}
          aria-label={p.name}
          className="absolute flex items-center justify-center"
          style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, width: 32, height: 32,
            transform: "translate(-50%,-50%)" }}
        >
          <span className="block h-2.5 w-2.5 border-2 border-ink bg-surface" />
        </button>
      ))}
    </div>
  );
}
