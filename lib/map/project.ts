import type { LatLng } from "../data/index.ts";

/** Web Mercator, the projection the whole app works in.
 *
 *  Chosen because it is what vector tiles are cut in, so when MapLibre lands
 *  in slice 1 the camera maths does not change. It is also conformal, which
 *  means a hexagon stays a hexagon and a circle stays a circle at any given
 *  place, and that is worth more to us than equal area.
 *
 *  **y increases south.** Tile schemes do it that way and so does a canvas, so
 *  following the convention removes a sign flip from every draw call rather
 *  than adding one. Standard Mercator has y increasing north; ours does not.
 *
 *  docs/v1-map-build.md slice 0. */

/** WGS84 semi-major axis. Web Mercator treats the earth as a sphere of this
 *  radius, which is why it is not the ellipsoid's mean. */
const R = 6378137;
/** Mercator y goes to infinity at the poles, so it is cut here, giving the
 *  square world every tile scheme assumes. */
const MAX_LAT = 85.051129;

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export interface Point2 { x: number; y: number }

/** Longitude and latitude to Mercator metres, y south. */
export function project({ lat, lng }: LatLng): Point2 {
  const clamped = Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));
  return {
    x: R * rad(lng),
    y: -R * Math.log(Math.tan(Math.PI / 4 + rad(clamped) / 2)),
  };
}

/** Mercator metres back to longitude and latitude. */
export function unproject({ x, y }: Point2): LatLng {
  return {
    lng: deg(x / R),
    lat: deg(2 * Math.atan(Math.exp(-y / R)) - Math.PI / 2),
  };
}

/** How many Mercator metres make one metre on the ground at this latitude.
 *
 *  Mercator stretches as it leaves the equator, and it stretches a lot by the
 *  time it reaches Ireland: at 53°N a metre on the ground is about 1.66
 *  Mercator metres. Anything that means a real distance has to divide by this,
 *  and anything that just needs to be drawn does not.
 *
 *  For a true distance between two places use `distanceM` in lib/geo.ts, which
 *  is haversine and does not care about projections at all. */
export function mercPerGroundMetre(lat: number): number {
  return 1 / Math.cos(rad(Math.max(-MAX_LAT, Math.min(MAX_LAT, lat))));
}

/** Ireland, north to south and west to east, with a little room. Used to clamp
 *  the camera so the map cannot be panned into the Atlantic. */
export const IRELAND_BOUNDS = {
  north: 55.45,
  south: 51.35,
  west: -10.70,
  east: -5.30,
};

/** The same bounds in Mercator metres, computed once. North west is the
 *  minimum corner because y increases south. */
export const IRELAND_RECT = (() => {
  const nw = project({ lat: IRELAND_BOUNDS.north, lng: IRELAND_BOUNDS.west });
  const se = project({ lat: IRELAND_BOUNDS.south, lng: IRELAND_BOUNDS.east });
  return { minX: nw.x, minY: nw.y, maxX: se.x, maxY: se.y };
})();

/** Where the app opens before it knows better. Corofin, Co. Clare, which sits
 *  among the fixture points: Inchiquin on its doorstep, Dysert five kilometres
 *  south, Toonagh and Cahercalla to the south east. Replaced by the walker's
 *  own position the moment they grant it. */
export const DEFAULT_CENTRE: LatLng = { lat: 52.9445, lng: -9.0650 };
