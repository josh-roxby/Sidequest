import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorker } from "@/components/shell/ServiceWorker";
import { SettingsEffects } from "@/components/shell/SettingsEffects";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Every number in the app is set in this face. docs/design-system.md §A-2-1.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Side Quest",
  description: "Pick how long you have. Get a walk worth taking.",
  applicationName: "Side Quest",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Side Quest",
    // Transparent so the page's own paper reaches the top edge and the status
    // bar sits on it, rather than on a black or white band.
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false, date: false, address: false, email: false },
};

export const viewport: Viewport = {
  themeColor: "#F4F2EC",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IE" className={`${archivo.variable} ${mono.variable}`}>
      <body>
        {children}
        <ServiceWorker />
        <SettingsEffects />
      </body>
    </html>
  );
}
