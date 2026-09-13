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
 *  Paths and tracks first because they are the point. Motorway and trunk are
 *  absent on purpose: they are not walkable and routing someone onto one is
 *  worse than routing them nowhere. Ferries and railways are gone for the same
 *  reason. These are OpenMapTiles `transportation` classes, checked against
 *  the schema. */
const WALKABLE = new Set([
  "path", "track", "footway", "pedestrian", "steps", "cycleway",
  "minor", "service", "residential", "living_street",
  "tertiary", "secondary",
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
export function walkableLines(map: MLMap): Path[] {
  let features;
  try {
    features = map.querySourceFeatures("basemap", { sourceLayer: "transportation" });
  } catch {
    /* No basemap configured, the source not added yet, or the style swapped
       under us. All of them mean the same thing here: no streets to route on. */
    return [];
  }

  const lines: Path[] = [];
  for (const f of features) {
    const props = (f.properties ?? {}) as Record<string, unknown>;
    if (!WALKABLE.has(String(props.class))) continue;
    if (BLOCKED_ACCESS.has(String(props.access))) continue;
    /* A tunnel is walkable often enough, but a bridge or tunnel drawn as if it
       were at ground level is where a route quietly becomes impossible. Only
       the surface network is used. */
    if (props.brunnel === "tunnel") continue;

    const geom = f.geometry;
    if (geom.type === "LineString") {
      lines.push(geom.coordinates as Path);
    } else if (geom.type === "MultiLineString") {
      for (const part of geom.coordinates) lines.push(part as Path);
    }
  }
  return lines;
}
