import type { Map as MLMap } from "maplibre-gl";
import type { Path } from "../quest/route.ts";

/** Pulling the walkable ways out of the basemap tiles.
 *
 *  The only file that knows both MapLibre and the router, and it is deliberately
 *  thin: everything that can be reasoned about lives in `lib/quest/graph.ts`
 *  where it can be tested without a map. This part cannot be tested on the
 *  machine it was written on, because every tile host is blocked from it, so
 *  the less of it there is the better.
 *
 *  It fails by returning nothing. A caller that gets an empty list draws the
 *  route geometrically, which is what the app did before this existed. */

/** Classes a walker can use.
 *
 *  These are OpenMapTiles `transportation` classes and nothing else. An earlier
 *  version of this list also held "footway", "pedestrian", "steps", "cycleway",
 *  "residential" and "living_street", which are `subclass` values and can never
 *  appear here: they were dead entries that quietly matched nothing.
 *
 *  `primary` is in, which matters more than it looks. Clontarf Road, Fairview
 *  and the Malahide Road are all primary, and leaving them out cut the graph
 *  into pieces in exactly the streets this app is being walked on. They are
 *  roads with pavements and people walk them. Motorway and trunk stay out,
 *  because nobody walks those and routing someone onto one is worse than
 *  routing them nowhere. */
const WALKABLE = new Set([
  "path", "track", "service", "minor", "tertiary", "secondary", "primary",
]);

/** Under class `path`, these are the subclasses worth preferring. Kept for the
 *  cost model rather than the filter: every one of them is already walkable by
 *  virtue of its class. */
export const FOOT_SUBCLASS = new Set([
  "footway", "pedestrian", "steps", "path", "cycleway",
]);

/** Ways the walker cannot get onto even if the class is walkable. */
const BLOCKED_ACCESS = new Set(["no", "private"]);

/** Every walkable line the map currently holds, as polylines in lng/lat.
 *
 *  Source features rather than rendered ones: `queryRenderedFeatures` returns
 *  only what is painted inside the viewport, which would end the graph at the
 *  edge of the screen and route walks along it. `querySourceFeatures` reaches
 *  everything in the tiles that are loaded, which is a good deal more ground
 *  than is on screen. */
export interface Street {
  coords: Path;
  /** Which deck this way is on. Ways only cross where their levels match, so a
   *  bridge does not join the road beneath it. */
  level: number;
}

export function walkableLines(map: MLMap): Street[] {
  let features;
  try {
    features = map.querySourceFeatures("basemap", { sourceLayer: "transportation" });
  } catch {
    /* No basemap configured, the source not added yet, or the style swapped
       under us. All of them mean the same thing here: no streets to route on. */
    return [];
  }

  const lines: Street[] = [];
  for (const f of features) {
    const props = (f.properties ?? {}) as Record<string, unknown>;
    if (!WALKABLE.has(String(props.class))) continue;
    if (BLOCKED_ACCESS.has(String(props.access))) continue;
    /* A tunnel is walkable often enough, but a bridge or tunnel drawn as if it
       were at ground level is where a route quietly becomes impossible. Only
       the surface network is used. */
    if (props.brunnel === "tunnel") continue;

    /* `layer` is the schema's own answer to what crosses what. A bridge with no
       layer is still above the ground, so it is nudged up; everything else sits
       at zero and crosses everything else at zero. */
    const layer = Number(props.layer);
    const level = Number.isFinite(layer) && layer !== 0
      ? layer
      : props.brunnel === "bridge" ? 1 : 0;

    const geom = f.geometry;
    if (geom.type === "LineString") {
      lines.push({ coords: geom.coordinates as Path, level });
    } else if (geom.type === "MultiLineString") {
      for (const part of geom.coordinates) lines.push({ coords: part as Path, level });
    }
  }
  return lines;
}
