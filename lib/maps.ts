import type { LatLng } from "@/lib/data";

/** A walking directions link that opens the platform's own maps app.
 *
 *  Deliberately a plain URL rather than an embedded map or a routing call.
 *  Getting someone to the start of a walk is a solved problem that every phone
 *  already has an app for, it costs nothing, needs no key, and it hands the
 *  walker turn-by-turn we have no intention of building. docs/PRD.md §3, C1.
 *
 *  Apple Maps on Apple hardware, Google Maps everywhere else. Both accept a
 *  plain https URL, so neither needs a custom scheme, an app check, or a
 *  fallback when the app is not installed: the browser handles it. */
export function directionsUrl(to: LatLng, label?: string): string {
  const { lat, lng } = to;
  if (isApple()) {
    // dirflg=w is walking. `q` names the pin so it does not read as decimals.
    const q = label ? `&q=${encodeURIComponent(label)}` : "";
    return `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=w${q}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
}

/** iPhone, iPad and Mac. iPadOS reports itself as a Mac, which is why the
 *  touch check is there: a Mac with a touch screen does not exist, so a
 *  "Macintosh" with touch points is an iPad. */
function isApple(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return true;
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
}
