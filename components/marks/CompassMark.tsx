interface CompassMarkProps {
  size?: number;
  className?: string;
}

/** Geometric compass on a sage disc — placeholder for the painted wreath
 *  logo (see design doc §4.5). Swap with `<Illustration src="/illustrations/logo-compass.svg" fallback={<CompassMark />} />`
 *  when the asset lands. */
export function CompassMark({ size = 36, className }: CompassMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="18" cy="18" r="17" fill="var(--sage-light)" stroke="var(--primary-light)" strokeWidth="1" />
      {/* North-pointing kite */}
      <path
        d="M18 7 L21 18 L18 16 L15 18 Z"
        fill="var(--primary)"
      />
      {/* South-pointing kite */}
      <path
        d="M18 29 L15 18 L18 20 L21 18 Z"
        fill="var(--primary-light)"
        opacity="0.7"
      />
      <circle cx="18" cy="18" r="1.6" fill="var(--gold-deep)" />
      {/* Cardinal ticks */}
      <g stroke="var(--primary)" strokeWidth="1" strokeLinecap="round">
        <line x1="18" y1="3" x2="18" y2="5" />
        <line x1="33" y1="18" x2="31" y2="18" />
        <line x1="18" y1="33" x2="18" y2="31" />
        <line x1="3" y1="18" x2="5" y2="18" />
      </g>
    </svg>
  );
}
