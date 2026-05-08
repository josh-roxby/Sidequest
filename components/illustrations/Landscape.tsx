interface LandscapeProps {
  className?: string;
}

/** SVG fallback for the painted hero landscape. Cream sky, distant
 *  hills in primary/light-green, foreground sage hill, single tree.
 *  Replace via <Illustration src="/illustrations/landscape-home.png" fallback={<Landscape />} />. */
export function Landscape({ className }: LandscapeProps) {
  return (
    <svg
      viewBox="0 0 720 340"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F4ECD9" />
          <stop offset="100%" stopColor="#EAF0E5" />
        </linearGradient>
        <linearGradient id="hill-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#AFC3B0" />
          <stop offset="100%" stopColor="#7D9B80" />
        </linearGradient>
        <linearGradient id="hill-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7D9B80" />
          <stop offset="100%" stopColor="#5E7D61" />
        </linearGradient>
      </defs>

      <rect width="720" height="340" fill="url(#sky)" />

      {/* Distant hills */}
      <path
        d="M0 220 C90 180 180 200 280 180 C400 155 520 200 720 175 L720 340 L0 340 Z"
        fill="url(#hill-far)"
        opacity="0.7"
      />
      <path
        d="M0 245 C120 210 240 235 360 215 C500 195 620 235 720 215 L720 340 L0 340 Z"
        fill="url(#hill-far)"
      />

      {/* Foreground hill */}
      <path
        d="M0 280 C150 250 290 285 430 270 C570 255 660 285 720 270 L720 340 L0 340 Z"
        fill="url(#hill-near)"
      />

      {/* Tree silhouette */}
      <g transform="translate(560 230)">
        <rect x="-3" y="0" width="6" height="40" fill="#4F6D52" />
        <ellipse cx="0" cy="-10" rx="34" ry="38" fill="#5E7D61" />
        <ellipse cx="-18" cy="0" rx="22" ry="26" fill="#4F6D52" opacity="0.85" />
        <ellipse cx="20" cy="-2" rx="22" ry="26" fill="#7D9B80" opacity="0.85" />
      </g>

      {/* Path */}
      <path
        d="M120 340 C220 300 320 305 420 290 C500 278 560 270 620 252"
        fill="none"
        stroke="#F8F7F2"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Sun */}
      <circle cx="540" cy="80" r="32" fill="#F4ECD9" />
      <circle cx="540" cy="80" r="20" fill="#FBF7E8" />
    </svg>
  );
}
