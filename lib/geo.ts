import type { LatLng } from "@/data/types";

export const KM_PER_DEG_LAT = 111.32;
const EARTH_RADIUS_KM = 6371;

export function randomPointInRadius(center: LatLng, radiusKm: number): LatLng {
  const angle    = Math.random() * 2 * Math.PI;
  const distance = radiusKm * Math.sqrt(Math.random());
  const offsetLat = distance * Math.sin(angle) * (1 / KM_PER_DEG_LAT);
  const offsetLng =
    distance * Math.cos(angle) *
    (1 / (KM_PER_DEG_LAT * Math.cos((center.lat * Math.PI) / 180)));
  return {
    lat: center.lat + offsetLat,
    lng: center.lng + offsetLng,
  };
}

export function distanceM(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * 1000 * Math.asin(Math.sqrt(x));
}

export function midpointWaypoints(
  a: LatLng,
  b: LatLng,
): { outward: LatLng; back: LatLng } {
  const M_PER_DEG_LAT = KM_PER_DEG_LAT * 1000;
  const midLat = (a.lat + b.lat) / 2;
  const midLng = (a.lng + b.lng) / 2;
  const cosLat = Math.cos((midLat * Math.PI) / 180);
  const M_PER_DEG_LNG = M_PER_DEG_LAT * cosLat;

  const dN = (b.lat - a.lat) * M_PER_DEG_LAT;
  const dE = (b.lng - a.lng) * M_PER_DEG_LNG;
  const length = Math.hypot(dN, dE);

  if (length === 0) {
    return {
      outward: { lat: midLat, lng: midLng },
      back:    { lat: midLat, lng: midLng },
    };
  }

  // Unit perpendicular (rotate origin→target 90° CCW).
  const pN = -dE / length;
  const pE =  dN / length;

  // Scale offset with direct distance: 25%, clamped to 100..400m.
  const offsetM = Math.max(100, Math.min(400, length * 0.25));
  const offsetLat = (offsetM * pN) / M_PER_DEG_LAT;
  const offsetLng = (offsetM * pE) / M_PER_DEG_LNG;

  return {
    outward: { lat: midLat + offsetLat, lng: midLng + offsetLng },
    back:    { lat: midLat - offsetLat, lng: midLng - offsetLng },
  };
}

export function formatLatLng(p: LatLng): string {
  return `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
}

export function formatDistance(distanceM: number): string {
  if (distanceM < 1000) return `${Math.round(distanceM)} m`;
  return `${(distanceM / 1000).toFixed(distanceM < 10_000 ? 2 : 1)} km`;
}
