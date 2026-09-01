import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** Placeholder mark: a leaf in the field survey palette.
 *
 *  Drawn with CSS rather than an emoji or an SVG path, because the icon is
 *  rendered by Satori at build time and neither an emoji font nor complex path
 *  data is guaranteed to be available there. A rotated square with two opposite
 *  corners rounded is a leaf, and it renders identically everywhere.
 *
 *  Swap for real artwork when the plate set lands. docs/design-system.md §H. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex",
          alignItems: "center", justifyContent: "center",
          background: "#F4F2EC",
        }}
      >
        <div
          style={{
            width: 250, height: 250,
            background: "#2E4034",
            borderRadius: "8px 200px 8px 200px",
            transform: "rotate(-45deg)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
