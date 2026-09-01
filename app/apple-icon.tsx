import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS ignores the manifest for the home screen icon and reads this instead.
 *  It also does not apply a mask, so the artwork carries its own padding. */
export default function AppleIcon() {
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
