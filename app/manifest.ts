import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
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
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
