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

/** What to say when it does not work, on the map, where a missing fix is an
 *  inconvenience rather than a dead end. */
export function locationMessage(reason: LocationFailure): string {
  switch (reason) {
    case "denied": return "Location is off for this site, so the map is showing your home area.";
    case "timeout": return "Could not get a fix in time. Open sky helps.";
    case "unsupported": return "This browser will not share a location.";
    default: return "No fix available just now.";
  }
}

/** What to say when a walk cannot be built without it, which is a dead end and
 *  has to be answered rather than noted.
 *
 *  Each of these is a different thing being wrong and a different thing to do
 *  about it, which is the whole reason they are separated. "Denied" is a
 *  browser setting. "Unavailable" is usually the device's own location
 *  services switched off, one level above the browser, and telling someone to
 *  check their site permissions when the problem is in iOS Settings sends them
 *  round in a circle. */
export function locationBlocker(reason: LocationFailure): { title: string; body: string } {
  switch (reason) {
    case "denied":
      return {
        title: "Location is blocked for this site",
        body: "A walk is built from where you are standing, so there is nothing to build without it. Allow location for this page in your browser settings, then try again.",
      };
    case "unavailable":
      return {
        title: "Your device is not giving a position",
        body: "Location services look to be switched off on the device itself, which is a separate setting from this page. Turn them on, then try again. Standing near a window helps if you are indoors.",
      };
    case "timeout":
      return {
        title: "Still looking for you",
        body: "The device did not settle on a position in time. Somewhere with a view of the sky usually takes a few seconds. Try again.",
      };
    default:
      return {
        title: "This browser will not share a location",
        body: "A walk is built from where you are standing, and this browser cannot tell us. Safari or Chrome on a phone will.",
      };
  }
}

/** What the browser already thinks about sharing a location.
 *
 *  Worth knowing before asking, because "granted" and "denied" need different
 *  words in front of the walker and only "prompt" will actually raise the
 *  browser's own dialogue. Not every browser implements it for geolocation,
 *  hence "unknown", which is treated as "prompt" everywhere it matters.
 *
 *  It is only half the answer. A granted permission says the page may ask; it
 *  does not say the device will answer, and on a phone with location services
 *  switched off system wide it answers granted and then fails. That is why
 *  nothing here replaces actually asking for a fix. */
export async function permissionState(): Promise<"granted" | "denied" | "prompt" | "unknown"> {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) return "unknown";
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status.state;
  } catch {
    /* Firefox historically threw on this name, and a browser that will not
       answer the question is the same as one that was never asked. */
    return "unknown";
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
    /* `alpha` on a plain deviceorientation event is measured from wherever the
       device happened to be when it started listening, so it is a rotation
       rather than a heading. Only take it when the event says it is absolute,
       or when Safari has already given us true north. */
    const deg = ev.webkitCompassHeading
      ?? (e.absolute && e.alpha != null ? 360 - e.alpha : null);
    if (deg == null || !Number.isFinite(deg)) return;
    onHeading(((deg % 360) + 360) % 360);
  };

  /* Two events, because the useful one is not the same everywhere. Chrome on
     Android fires `deviceorientationabsolute` and leaves `deviceorientation`
     relative; Safari fires only `deviceorientation` and puts true north on its
     own `webkitCompassHeading`. Listening to both and filtering on absolute
     covers the pair without guessing which browser this is. */
  window.addEventListener("deviceorientationabsolute", handler, true);
  window.addEventListener("deviceorientation", handler, true);
  return () => {
    window.removeEventListener("deviceorientationabsolute", handler, true);
    window.removeEventListener("deviceorientation", handler, true);
  };
}

/* ---- the last place we actually found the walker -------------------------- */

const LAST_FIX = "sq.last-fix";

/** Remembering where the walker was, so the app can open somewhere true.
 *
 *  Geolocation is never fired on a page load, which is the right rule and
 *  leaves the first screen with no idea where anybody is. The old answer was a
 *  hardcoded Clontarf, so the picker told every walker in the country they
 *  were in Clontarf with forty six points around them. A remembered fix is the
 *  honest version of the same shortcut: it is somewhere the walker really was,
 *  and when there is none the screen says so rather than inventing one. */
export function rememberFix(p: LatLng): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(LAST_FIX, JSON.stringify({ lat: p.lat, lng: p.lng }));
  } catch {
    // Storage blocked or full. The app simply opens without a remembered place.
  }
}

export function lastFix(): LatLng | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_FIX);
    if (!raw) return null;
    const v: unknown = JSON.parse(raw);
    if (typeof v !== "object" || v === null) return null;
    const { lat, lng } = v as Record<string, unknown>;
    if (typeof lat !== "number" || typeof lng !== "number") return null;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}
