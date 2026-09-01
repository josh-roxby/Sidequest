import { readFileSync } from "node:fs";
import { ImageResponse } from "next/og";
import { APP_MARK } from "@/lib/media";
import { mediaFile } from "@/lib/media.server";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** The app icon and the favicon.
 *
 *  Served straight from the media folder once `app-mark` lands there, so the
 *  icon is a file drop rather than a code change like every other plate. Until
 *  then it falls back to a leaf drawn in CSS: the icon is rendered by Satori at
 *  build time and neither an emoji font nor complex path data is guaranteed to
 *  be available there, but a rotated square with two opposite corners rounded
 *  is a leaf and renders identically everywhere. docs/design-system.md §H. */
export default function Icon() {
  const file = mediaFile(APP_MARK);
  if (file) {
    return new Response(new Uint8Array(readFileSync(file.path)), {
      headers: { "Content-Type": file.type, "Cache-Control": "public, max-age=0, must-revalidate" },
    });
  }

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
