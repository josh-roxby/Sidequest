/** Slow-scrolling countryside strip along the foot of Home.
 *
 *  Two layers travelling at different speeds, which is what makes it read as
 *  distance rather than as a picture sliding. Each layer holds its artwork
 *  twice and translates by exactly -50%, so the reset frame is pixel-identical
 *  to the start frame and the loop has no seam. That is also why the artwork
 *  itself has to tile: the right edge butts against the left edge every cycle.
 *
 *  ARTWORK, when it lands:
 *    public/plates/hills-far.png    1620 × 540, seamless L/R, transparent
 *    public/plates/hills-near.png   1620 × 540, seamless L/R, transparent
 *  Ratio is 3:1. Rendered around 180px tall, so 540 keeps it crisp at 3× DPR.
 *  No sky: the paper shows through, so the band survives a palette change.
 *
 *  Until those files exist this draws its own ridge lines, so the layout is
 *  never waiting on art. */

function Ridge({ y, amp, seed }: { y: number; amp: number; seed: number }) {
  // One period across 540 units, repeated twice, so the path itself tiles.
  const pts: string[] = [];
  for (let x = 0; x <= 1080; x += 20) {
    const t = (x / 540) * Math.PI * 2;
    const h = Math.sin(t + seed) * amp + Math.sin(t * 2.3 + seed * 1.7) * amp * 0.4;
    pts.push(`${x},${(y - h).toFixed(1)}`);
  }
  return (
    <>
      <polyline points={pts.join(" ")} fill="none" stroke="currentColor" strokeWidth="1.2" />
      <polygon points={`${pts.join(" ")} 1080,180 0,180`} fill="currentColor" opacity="0.07" />
    </>
  );
}

function Layer({ seconds, opacity, children }: {
  seconds: number; opacity: number; children: React.ReactNode;
}) {
  return (
    <div
      className="absolute inset-0 flex w-max"
      style={{ opacity, animation: `sq-marquee ${seconds}s linear infinite` }}
    >
      {children}
      {children}
    </div>
  );
}

export function HillsBand() {
  const svg = (
    <svg viewBox="0 0 1080 180" preserveAspectRatio="none" aria-hidden
      className="h-full text-stone" style={{ width: "200vw" }}>
      <Ridge y={96} amp={26} seed={0.4} />
    </svg>
  );
  const near = (
    <svg viewBox="0 0 1080 180" preserveAspectRatio="none" aria-hidden
      className="h-full text-field" style={{ width: "200vw" }}>
      <Ridge y={148} amp={16} seed={2.1} />
    </svg>
  );

  return (
    <div aria-hidden className="relative h-full w-full overflow-hidden">
      <Layer seconds={140} opacity={0.55}>{svg}</Layer>
      <Layer seconds={80} opacity={0.5}>{near}</Layer>
    </div>
  );
}
