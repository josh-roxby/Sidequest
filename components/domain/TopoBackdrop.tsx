/** Slow-drifting contour lines behind the landing page.
 *
 *  Three layers at different scales and speeds, which is what produces the
 *  parallax: the near rings travel further per cycle than the far ones, so the
 *  field reads as depth rather than as one sheet sliding about.
 *
 *  Contours are concentric transforms of a single blob rather than separate
 *  path data, which keeps the file small and makes the rings nest the way real
 *  contours do. Rendered as SVG rather than canvas because it never changes:
 *  the whole thing is one composited layer the GPU can animate without a
 *  repaint, and it costs nothing on a phone.
 *
 *  Everything here is decorative. It carries aria-hidden and it stops entirely
 *  under prefers-reduced-motion via the global guard. */

const BLOB =
  "M0,-100 C46,-100 84,-70 92,-28 C100,14 76,58 36,80 C-4,102 -54,94 -80,60 " +
  "C-106,26 -104,-24 -78,-58 C-52,-92 -20,-100 0,-100 Z";

function Rings({ count, step }: { count: number; step: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <path key={i} d={BLOB} transform={`scale(${1 - i * step})`} />
      ))}
    </>
  );
}

interface LayerProps {
  cx: number; cy: number; scale: number; opacity: number;
  dx: number; dy: number; seconds: number; count: number; step: number;
}

function Layer({ cx, cy, scale, opacity, dx, dy, seconds, count, step }: LayerProps) {
  return (
    <g
      transform={`translate(${cx} ${cy}) scale(${scale})`}
      style={{
        opacity,
        ["--dx" as string]: `${dx}px`,
        ["--dy" as string]: `${dy}px`,
        animation: `sq-drift ${seconds}s ease-in-out infinite alternate`,
      }}
    >
      <Rings count={count} step={step} />
    </g>
  );
}

export function TopoBackdrop() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 400 800"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke="var(--ink)"
      strokeWidth="1"
      vectorEffect="non-scaling-stroke"
    >
      <Layer cx={90} cy={150} scale={1.9} opacity={0.07} dx={-26} dy={14} seconds={34} count={7} step={0.13} />
      <Layer cx={330} cy={430} scale={1.5} opacity={0.10} dx={20} dy={-18} seconds={26} count={6} step={0.15} />
      <Layer cx={140} cy={690} scale={2.3} opacity={0.06} dx={-14} dy={-22} seconds={42} count={8} step={0.11} />
      <Layer cx={300} cy={90} scale={0.9} opacity={0.13} dx={12} dy={20} seconds={20} count={5} step={0.18} />
    </svg>
  );
}
