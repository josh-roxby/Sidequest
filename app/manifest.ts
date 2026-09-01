import type { MetadataRoute } from "next";
import { mediaFile } from "@/lib/media.server";

/** Android crops the icon to a circle or a squircle, so the maskable variant
 *  keeps its subject inside the centre 60 percent. It is listed only once its
 *  file is actually in the media folder: a manifest that points at a missing
 *  icon can fail an install outright, and no entry just means the plain icon
 *  gets cropped instead. */
const MASKABLE = "app-mark-maskable";

export default function manifest(): MetadataRoute.Manifest {
  const maskable = mediaFile(MASKABLE);

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
        ? { src: maskable.url, sizes: "512x512", type: maskable.type, purpose: "maskable" as const }
        : { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" as const },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
