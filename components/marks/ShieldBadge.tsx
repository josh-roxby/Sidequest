type ShieldMotif = "leaf" | "compass" | "flower" | "tree" | "star" | "door";
type ShieldTone = "sage" | "gold" | "moss" | "lavender";

interface ShieldBadgeProps {
  motif: ShieldMotif;
  tone?: ShieldTone;
  size?: number;
  /** Render in a "locked" state (low-saturation, hint of dashed stroke). */
  locked?: boolean;
  className?: string;
}

const tonePalette: Record<ShieldTone, { bg: string; stroke: string; ink: string }> = {
  sage:     { bg: "var(--sage-light)",     stroke: "var(--primary-light)", ink: "var(--primary)" },
  gold:     { bg: "var(--gold-faint)",     stroke: "var(--gold-soft)",     ink: "var(--gold-deep)" },
  moss:     { bg: "var(--sage)",           stroke: "var(--primary)",       ink: "var(--primary-dark)" },
  lavender: { bg: "var(--lavender-soft)",  stroke: "var(--lavender)",      ink: "var(--lavender-deep)" },
};

/** 60×70 shield outline with a centred motif. See design doc §4.4. */
export function ShieldBadge({
  motif,
  tone = "sage",
  size = 60,
  locked = false,
  className,
}: ShieldBadgeProps) {
  const w = size;
  const h = size * (70 / 60);
  const palette = tonePalette[tone];
  const lockOpacity = locked ? 0.4 : 1;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 60 70"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M30 2 L54 10 L54 36 C54 52 42 64 30 68 C18 64 6 52 6 36 L6 10 Z"
        fill={palette.bg}
        stroke={palette.stroke}
        strokeWidth="1.5"
        strokeDasharray={locked ? "3 3" : undefined}
        opacity={lockOpacity}
      />
      <g
        transform="translate(30 35)"
        stroke={palette.ink}
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={lockOpacity}
      >
        {motif === "leaf" && (
          <path d="M-10 8 C-10 -4 0 -12 10 -8 C8 4 -2 12 -10 8 Z M-8 6 L8 -8" />
        )}
        {motif === "compass" && (
          <>
            <circle r="10" />
            <path d="M0 -8 L4 0 L0 2 L-4 0 Z" fill={palette.ink} />
            <path d="M0 8 L-4 0 L0 -2 L4 0 Z" fill={palette.ink} opacity="0.6" />
          </>
        )}
        {motif === "flower" && (
          <>
            <circle r="2.5" fill={palette.ink} />
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse
                key={a}
                cx="0"
                cy="-6"
                rx="3"
                ry="5"
                fill={palette.ink}
                transform={`rotate(${a})`}
                opacity="0.85"
              />
            ))}
          </>
        )}
        {motif === "tree" && (
          <>
            <path d="M0 10 L0 -2" />
            <path d="M-8 -2 C-8 -10 8 -10 8 -2 C12 0 12 6 0 6 C-12 6 -12 0 -8 -2 Z" fill={palette.bg} />
          </>
        )}
        {motif === "star" && (
          <path d="M0 -10 L3 -3 L10 -3 L4 1 L6 8 L0 4 L-6 8 L-4 1 L-10 -3 L-3 -3 Z" fill={palette.ink} />
        )}
        {motif === "door" && (
          <>
            <rect x="-6" y="-10" width="12" height="20" rx="6" />
            <circle cx="3" cy="0" r="0.8" fill={palette.ink} />
          </>
        )}
      </g>
    </svg>
  );
}
