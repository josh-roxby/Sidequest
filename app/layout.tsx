import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@/styles/map.css";

export const metadata: Metadata = {
  title: "Side Quest",
  description: "Walk a generated loop with a small task at the end.",
};

export const viewport: Viewport = {
  themeColor: "#0b0c0e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
