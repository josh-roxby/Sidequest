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

/** Following a walk rather than asking once.
 *
 *  `getPosition` answers "where am I" for a recentre press. This answers
 *  "where am I now", which is what a walk needs: the pin has to keep up, and
 *  tiles unlock from it. Returns a stop function. Readings that fail `usable`
 *  are dropped rather than passed on, because one NaN centre takes the map
 *  down and iOS has shipped that reading more than once.
 *
 *  Errors after the first fix are not fatal. A phone loses its fix under a
 *  bridge and finds it again, and tearing the pin off the map for that is
 *  worse than leaving it where it last was. */
export function watchPosition(
  onFix: (fix: Fix) => void,
  onFail?: (reason: LocationFailure) => void,
): () => void {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    onFail?.("unsupported");
    return () => {};
  }
  const id = navigator.geolocation.watchPosition(
    ({ coords }) => {
      if (!usable(coords)) return;
      onFix({ lat: coords.latitude, lng: coords.longitude, accuracyM: coords.accuracy });
    },
    (err) => {
      onFail?.(err.code === err.PERMISSION_DENIED ? "denied"
        : err.code === err.TIMEOUT ? "timeout" : "unavailable");
    },
    { enableHighAccuracy: true, timeout: 15_000, maximumAge: 5_000 },
  );
  return () => navigator.geolocation.clearWatch(id);
}

interface WebkitOrientationEvent extends DeviceOrientationEvent {
  /** Safari only, and the one worth having: it is true north already, where
   *  `alpha` is relative to wherever the device decided to start. */
  webkitCompassHeading?: number;
}

type OrientationCtor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

/** Which way you are facing, in degrees clockwise from north.
 *
 *  Two things make this less simple than it looks. Safari needs its own
 *  permission, asked from inside a user gesture, and it is a different grant
 *  from the location one, so a walker can hold one and not the other. And only
 *  Safari reports a true north heading directly: everywhere else `alpha` is
 *  measured anticlockwise from the device's own starting orientation, so it is
 *  subtracted from 360 to face the same way round as a compass.
 *
 *  A device with no magnetometer reports nothing at all, which is why the
 *  caller has to cope with never being called. */
export async function watchHeading(
  onHeading: (deg: number) => void,
): Promise<() => void> {
  if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return () => {};
  const ctor = window.DeviceOrientationEvent as OrientationCtor;

  if (typeof ctor.requestPermission === "function") {
    try {
      if ((await ctor.requestPermission()) !== "granted") return () => {};
    } catch {
      // Thrown when not called from a gesture. Nothing to do but go without.
      return () => {};
    }
  }

  const handler = (e: DeviceOrientationEvent) => {
    const ev = e as WebkitOrientationEvent;
    const deg = ev.webkitCompassHeading ?? (e.alpha == null ? null : 360 - e.alpha);
    if (deg == null || !Number.isFinite(deg)) return;
    onHeading(((deg % 360) + 360) % 360);
  };
  window.addEventListener("deviceorientation", handler, true);
  return () => window.removeEventListener("deviceorientation", handler, true);
}
