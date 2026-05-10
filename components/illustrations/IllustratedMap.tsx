/** SVG illustrated map — a hand-styled placeholder for the eventual
 *  Mapbox-GL view. Cream paper base, sage forest blobs at the corners,
 *  white roads with subtle halos, soft sage-blue lake in the centre,
 *  dotted moss-green route, and slots for pin markers via children.
 *
 *  Once we wire a real map provider, this component is dropped behind
 *  a feature flag or replaced — the parent layout (controls + bottom
 *  card) stays exactly the same. */

import type { ReactNode } from "react";

interface IllustratedMapProps {
  className?: string;
  /** Render pins / overlays absolutely positioned over the map. */
  children?: ReactNode;
  /** Render the dotted route polyline. Default true. */
  showRoute?: boolean;
}

export function IllustratedMap({
  className,
  children,
  showRoute = true,
}: IllustratedMapProps) {
  return (
    <div className={`relative h-full w-full overflow-hidden bg-map-paper ${className ?? ""}`}>
      <svg
        viewBox="0 0 400 700"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="lake-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D7E2D2" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#C9D9D5" stopOpacity="0.85" />
          </radialGradient>
          <linearGradient id="forest-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#AFC3B0" />
            <stop offset="100%" stopColor="#7D9B80" />
          </linearGradient>
          <filter id="road-blur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="0.6" />
          </filter>
        </defs>

        {/* paper texture noise — extremely subtle */}
        <rect x="0" y="0" width="400" height="700" fill="#F4F1E8" />

        {/* Distant hills */}
        <path
          d="M -40 240 C 80 200 180 230 260 215 C 330 200 400 220 460 200 L 460 280 L -40 280 Z"
          fill="url(#forest-grad)"
          opacity="0.35"
        />

        {/* Forest blobs - top corners */}
        <ellipse cx="40" cy="60" rx="90" ry="70" fill="url(#forest-grad)" opacity="0.65" />
        <ellipse cx="370" cy="40" rx="80" ry="55" fill="url(#forest-grad)" opacity="0.7" />

        {/* Forest blobs - bottom corners */}
        <ellipse cx="30" cy="640" rx="90" ry="70" fill="url(#forest-grad)" opacity="0.6" />
        <ellipse cx="380" cy="660" rx="100" ry="80" fill="url(#forest-grad)" opacity="0.7" />

        {/* Mid-side forest patches */}
        <ellipse cx="385" cy="350" rx="40" ry="80" fill="url(#forest-grad)" opacity="0.45" />
        <ellipse cx="10" cy="380" rx="45" ry="90" fill="url(#forest-grad)" opacity="0.4" />

        {/* Soft sage-blue lake — central */}
        <ellipse cx="220" cy="360" rx="105" ry="70" fill="url(#lake-grad)" />
        <ellipse cx="220" cy="360" rx="95" ry="62" fill="none" stroke="#B8C9C5" strokeWidth="0.8" strokeDasharray="3 4" opacity="0.55" />

        {/* Roads — white with subtle halo */}
        <g filter="url(#road-blur)">
          <path
            d="M -10 510 C 80 480 150 490 220 460 C 290 430 360 440 430 410"
            stroke="#E7E4D8"
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 60 700 C 100 600 150 540 180 480"
            stroke="#E7E4D8"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 300 -10 C 280 60 270 130 290 200 C 310 270 330 320 320 380"
            stroke="#E7E4D8"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
        </g>
        <g>
          <path
            d="M -10 510 C 80 480 150 490 220 460 C 290 430 360 440 430 410"
            stroke="#FFFFFF"
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 60 700 C 100 600 150 540 180 480"
            stroke="#FFFFFF"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 300 -10 C 280 60 270 130 290 200 C 310 270 330 320 320 380"
            stroke="#FFFFFF"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* Tree clusters scattered */}
        <g opacity="0.7" fill="#5E7D61">
          <circle cx="110" cy="200" r="5" />
          <circle cx="125" cy="195" r="4" />
          <circle cx="100" cy="210" r="3.5" />

          <circle cx="320" cy="120" r="4" />
          <circle cx="305" cy="130" r="3.5" />

          <circle cx="80" cy="450" r="4" />
          <circle cx="345" cy="490" r="4" />
          <circle cx="335" cy="500" r="3.5" />

          <circle cx="140" cy="620" r="5" />
          <circle cx="155" cy="630" r="4" />
        </g>

        {/* House/landmark dots */}
        <g fill="#D8BE85" opacity="0.7">
          <rect x="155" y="195" width="6" height="6" rx="1" />
          <rect x="280" y="555" width="6" height="6" rx="1" />
        </g>

        {/* Dotted moss-green route */}
        {showRoute ? (
          <g>
            <path
              d="M 120 580 C 150 540 130 480 170 440 C 210 400 260 380 280 320 C 295 270 270 220 240 180"
              stroke="#5E7D61"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="0 9"
              fill="none"
            />
          </g>
        ) : null}
      </svg>

      {/* Pin overlay slot — positioned by parent */}
      {children}
    </div>
  );
}
