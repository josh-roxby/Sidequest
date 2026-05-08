interface FlowerMedallionProps {
  size?: number;
  className?: string;
}

/** 80px gradient disc with two layers of lavender petals (5 outer + 5
 *  offset inner) and a gold centre. See design doc §4.6. Variants per
 *  quest type (orange citrus, butterfly, etc.) to be designed. */
export function FlowerMedallion({ size = 80, className }: FlowerMedallionProps) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.32;
  const innerR = size * 0.22;

  const petals = (radius: number, count: number, rotateOffset: number, fill: string) =>
    Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * 360 + rotateOffset;
      return (
        <ellipse
          key={`${rotateOffset}-${i}`}
          cx={cx}
          cy={cy - radius * 0.6}
          rx={radius * 0.45}
          ry={radius * 0.85}
          fill={fill}
          transform={`rotate(${angle} ${cx} ${cy})`}
          opacity={0.9}
        />
      );
    });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="medallion-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="var(--lavender-soft)" />
          <stop offset="100%" stopColor="var(--sage-light)" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={size / 2 - 1} fill="url(#medallion-bg)" stroke="var(--border)" strokeWidth="1" />
      {petals(outerR, 5, 0, "var(--lavender-deep)")}
      {petals(innerR, 5, 36, "var(--lavender)")}
      <circle cx={cx} cy={cy} r={size * 0.09} fill="var(--gold-deep)" />
      <circle cx={cx} cy={cy} r={size * 0.045} fill="var(--gold-soft)" />
    </svg>
  );
}
