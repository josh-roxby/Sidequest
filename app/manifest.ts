import type { MetadataRoute } from "next";
import { APP_MARK } from "@/lib/media";
import { mediaFile } from "@/lib/media.server";

/** Android crops the icon to a circle or a squircle, so the maskable variant
 *  keeps its subject inside the centre 60 percent. `/maskable-icon` derives it
 *  from the app mark, so it exists whenever the mark does and can never drift
 *  away from the favicon. It is listed only when the mark is actually in the
 *  media folder: a manifest pointing at an icon that 404s can fail an install
 *  outright, and no entry just means the plain icon gets cropped instead. */

export default function manifest(): MetadataRoute.Manifest {
  const maskable = mediaFile(APP_MARK);

  return {
    name: "Side Quest",
    short_name: "Side Quest",
    description: "Pick how long you have. Get a walk worth taking.",
    // Straight to the hub rather than the landing page: once it is on the home
    // screen the pitch has already worked.
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F4F2EC",
    theme_color: "#F4F2EC",
    categories: ["travel", "lifestyle", "navigation"],
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      maskable
        ? { src: "/maskable-icon", sizes: "512x512", type: "image/png", purpose: "maskable" as const }
        : { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" as const },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
