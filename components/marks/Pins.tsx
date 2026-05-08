/* Map pin markers — see design doc §4.3. Teardrop 28×30, white interior,
 * coloured 1.5px stroke and motif. Use the dedicated component per pin
 * type so colour and motif stay in sync. */

interface PinProps {
  size?: number;
  className?: string;
}

function teardrop(width: number, height: number, stroke: string, children: React.ReactNode) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 28 30"
      className=""
      aria-hidden="true"
    >
      <path
        d="M14 1 C7 1 2 6 2 13 C2 20 14 29 14 29 C14 29 26 20 26 13 C26 6 21 1 14 1 Z"
        fill="white"
        stroke={stroke}
        strokeWidth="1.5"
      />
      <g transform="translate(14 13)">{children}</g>
    </svg>
  );
}

export function PinLeaf({ size = 28 }: PinProps) {
  const h = size * (30 / 28);
  return teardrop(
    size,
    h,
    "var(--primary)",
    <path
      d="M-4 2 C-4 -3 0 -6 4 -4 C3 1 -1 4 -4 2 Z M-3 1 L3 -4"
      stroke="var(--primary)"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />,
  );
}

export function PinFlower({ size = 28 }: PinProps) {
  const h = size * (30 / 28);
  return teardrop(
    size,
    h,
    "var(--lavender-deep)",
    <g>
      <circle r="1.4" fill="var(--gold-deep)" />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse
          key={a}
          cx="0"
          cy="-3.2"
          rx="1.6"
          ry="2.6"
          fill="var(--lavender-deep)"
          transform={`rotate(${a})`}
        />
      ))}
    </g>,
  );
}

export function PinDoor({ size = 28 }: PinProps) {
  const h = size * (30 / 28);
  return teardrop(
    size,
    h,
    "var(--gold-deep)",
    <g>
      <rect x="-2.5" y="-4" width="5" height="8" rx="2.5" fill="var(--gold-soft)" />
      <circle cx="1.4" cy="0" r="0.5" fill="var(--gold-deep)" />
    </g>,
  );
}
