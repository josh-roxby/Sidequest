import type { LatLng } from "./data/types";

/** Asking the browser where you are.
 *
 *  One shot and by request only. The prompt is never fired on a page load:
 *  a walker who opens the map and is immediately asked for their location by
 *  something they have not chosen to use will say no, and the browser
 *  remembers a no. So this is called from a press and nowhere else.
 *  docs/ux-loops.md §B-2. */

export type LocationFailure =
  | "unsupported"   // no geolocation in this browser at all
  | "denied"        // the walker said no, or has said no before
  | "unavailable"   // the device tried and could not get a fix
  | "timeout";

export class LocationError extends Error {
  constructor(readonly reason: LocationFailure) {
    super(reason);
    this.name = "LocationError";
  }
}

/** iOS has shipped, more than once, a fix whose coordinates are NaN. It
 *  arrives through the success path looking like any other reading, and a NaN
 *  centre takes the whole map down rather than failing visibly. So a reading
 *  is only a reading once the numbers are numbers and are on the planet. */
function usable(c: GeolocationCoordinates): boolean {
  return Number.isFinite(c.latitude) && Number.isFinite(c.longitude)
    && Math.abs(c.latitude) <= 90 && Math.abs(c.longitude) <= 180;
}

export interface Fix extends LatLng {
  /** Metres. The browser's own estimate, which on a phone indoors is often
   *  hundreds and is worth showing before trusting a position. */
  accuracyM: number;
}

export function getPosition(timeoutMs = 10_000): Promise<Fix> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new LocationError("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!usable(coords)) {
          reject(new LocationError("unavailable"));
          return;
        }
        resolve({ lat: coords.latitude, lng: coords.longitude, accuracyM: coords.accuracy });
      },
      (err) => {
        const reason: LocationFailure =
          err.code === err.PERMISSION_DENIED ? "denied"
            : err.code === err.TIMEOUT ? "timeout"
              : "unavailable";
        reject(new LocationError(reason));
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30_000 },
    );
  });
}

/** What to say when it does not work. Never blames the walker and never asks
 *  them to go into browser settings, which nobody does. */
export function locationMessage(reason: LocationFailure): string {
  switch (reason) {
    case "denied": return "Location is off for this site, so the map is showing your home area.";
    case "timeout": return "Could not get a fix in time. Open sky helps.";
    case "unsupported": return "This browser will not share a location.";
    default: return "No fix available just now.";
  }
}
