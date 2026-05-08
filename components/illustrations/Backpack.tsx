interface BackpackProps {
  size?: number;
  className?: string;
}

/** SVG fallback for the painted backpack used on the Your Journey card.
 *  Two-tone sage with gold buckle and sprig accent. */
export function Backpack({ size = 64, className }: BackpackProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bp-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7D9B80" />
          <stop offset="100%" stopColor="#5E7D61" />
        </linearGradient>
      </defs>
      {/* Strap loop */}
      <path d="M22 14 C24 6 40 6 42 14" fill="none" stroke="#4F6D52" strokeWidth="2" strokeLinecap="round" />
      {/* Body */}
      <rect x="14" y="16" width="36" height="40" rx="10" fill="url(#bp-body)" />
      {/* Front pocket */}
      <rect x="20" y="32" width="24" height="18" rx="6" fill="#AFC3B0" />
      {/* Buckle */}
      <rect x="29" y="38" width="6" height="6" rx="1" fill="#B89A5F" />
      {/* Sprig */}
      <g transform="translate(40 22) rotate(20)" stroke="#4F6D52" strokeWidth="1.4" strokeLinecap="round" fill="none">
        <path d="M0 0 L0 -10" />
        <path d="M0 -3 C-4 -5 -4 -8 -1 -8" />
        <path d="M0 -7 C4 -9 4 -12 1 -12" />
      </g>
    </svg>
  );
}
