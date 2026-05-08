import { distanceM } from "@/lib/geo";
import { midpointWaypoints } from "@/lib/geo";
import type { LatLng } from "@/data/types";

export const OSRM_BASE =
  process.env.OSRM_BASE_URL ?? "https://router.project-osrm.org/route/v1/foot";

export interface RouteResult {
  route: [number, number][];
  distanceM: number;
  routed: boolean;
}

export async function fetchWalkingRoute(
  waypoints: LatLng[],
  signal?: AbortSignal,
): Promise<RouteResult> {
  if (waypoints.length < 2) throw new Error("Need at least two waypoints");
  const path = waypoints.map((p) => `${p.lng},${p.lat}`).join(";");
  const url  = `${OSRM_BASE}/${path}?overview=full&geometries=geojson`;

  try {
    const res  = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const json = await res.json();
    if (json.code !== "Ok" || !json.routes?.length) throw new Error(`OSRM code=${json.code}`);
    const route  = json.routes[0];
    const coords = route.geometry?.coordinates ?? [];
    if (!coords.length) throw new Error("OSRM empty geometry");
    return {
      // OSRM returns [lng, lat]; convert to [lat, lng] for Leaflet.
      route: coords.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]),
      distanceM: route.distance,
      routed: true,
    };
  } catch {
    return straightLineFallback(waypoints);
  }
}

function straightLineFallback(waypoints: LatLng[]): RouteResult {
  let total = 0;
  for (let i = 1; i < waypoints.length; i++) {
    total += distanceM(waypoints[i - 1], waypoints[i]);
  }
  return {
    route: waypoints.map((p) => [p.lat, p.lng] as [number, number]),
    distanceM: total,
    routed: false,
  };
}

export interface RoundTripPlan {
  route: [number, number][];
  returnRoute: [number, number][];
  distanceM: number;
  returnDistanceM: number;
  routed: boolean;
}

export async function planRoundTrip(
  origin: LatLng,
  target: LatLng,
): Promise<RoundTripPlan> {
  const { outward, back: returnVia } = midpointWaypoints(origin, target);
  const straight = distanceM(origin, target);

  let route:        [number, number][] = [[origin.lat, origin.lng], [target.lat, target.lng]];
  let returnRoute:  [number, number][] = [[target.lat, target.lng], [origin.lat, origin.lng]];
  let outDistanceM = straight;
  let returnDistanceM = straight;
  let routed = false;

  try {
    const [out, back] = await Promise.all([
      fetchWalkingRoute([origin, outward, target]),
      fetchWalkingRoute([target, returnVia, origin]),
    ]);
    route        = out.route;
    returnRoute  = back.route;
    outDistanceM = out.distanceM;
    returnDistanceM = back.distanceM;
    // Treat the trip as "routed" only if BOTH legs came back from the
    // router. If either fell back to straight-line, the UI flags it.
    routed = out.routed && back.routed;
  } catch {
    // fetchWalkingRoute already falls back internally; defensive only.
  }

  return { route, returnRoute, distanceM: outDistanceM, returnDistanceM, routed };
}
