import { readFileSync } from "node:fs";
import { ImageResponse } from "next/og";
import { APP_MARK } from "@/lib/media";
import { mediaFile } from "@/lib/media.server";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS ignores the manifest for the home screen icon and reads this instead.
 *  It also does not apply a mask, so the artwork carries its own padding.
 *  Same folder as everything else: drop `app-mark` in and it is used here. */
export default function AppleIcon() {
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
            width: 96, height: 96,
            background: "#2E4034",
            borderRadius: "4px 76px 4px 76px",
            transform: "rotate(-45deg)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
