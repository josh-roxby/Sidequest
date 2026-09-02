import { readFileSync } from "node:fs";
import { ImageResponse } from "next/og";
import { APP_MARK } from "@/lib/media";
import { mediaFile } from "@/lib/media.server";

/** Downscaled at build rather than served at full size. The master is a 1024px
 *  engraving of several hundred kilobytes and this is a favicon: a browser
 *  fetches it on every cold load and an installer fetches it once, and neither
 *  wants the stipple at native resolution. Sharp ships with Next, so this costs
 *  no dependency. If it is unavailable for any reason the original is served
 *  rather than nothing. */
async function mark(px: number): Promise<Response | null> {
  const file = mediaFile(APP_MARK);
  if (!file) return null;
  const raw = readFileSync(file.path);
  const headers = { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" };
  try {
    const sharp = (await import("sharp")).default;
    const out = await sharp(raw).resize(px, px, { fit: "cover" }).png({ compressionLevel: 9 }).toBuffer();
    return new Response(new Uint8Array(out), { headers });
  } catch {
    return new Response(new Uint8Array(raw), { headers: { ...headers, "Content-Type": file.type } });
  }
}

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS ignores the manifest for the home screen icon and reads this instead.
 *  It also does not apply a mask, so the artwork carries its own padding.
 *  Same folder as everything else: drop `app-mark` in and it is used here. */
export default async function AppleIcon() {
  const real = await mark(size.width);
  if (real) return real;

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
