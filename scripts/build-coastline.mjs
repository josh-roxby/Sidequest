/** Cuts Ireland out of a public-domain 1km coastline and writes it to
 *  public/geo/ as a small GeoJSON.
 *
 *  Run once, by hand, when the source changes. The output is committed, so the
 *  app never depends on this script or on the package at runtime:
 *
 *      npm i -D @geo-maps/countries-coastline-1km
 *      node scripts/build-coastline.mjs
 *      npm un @geo-maps/countries-coastline-1km
 *
 *  Public domain, from OpenStreetMap coastline data. It is the real shape of
 *  the island at a kilometre, which is right for a map you zoom out of and
 *  invisible on a map you walk. */
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const all = require("@geo-maps/countries-coastline-1km")();

/** The island is two jurisdictions and one coastline, so both are taken and
 *  the border is not drawn. Nobody walking a headland cares which it is. The
 *  source keys on ISO A3, so IRL and GBR. */
const WANT = new Set(["IRL", "GBR"]);
/** Everything west of this is Ireland; it drops Great Britain from the UK
 *  geometry while keeping the north east coast. */
const EAST_LIMIT = -5.0;

const rings = [];
for (const f of all.features) {
  if (!WANT.has(f.properties?.A3)) continue;
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys) {
    for (const ring of poly) {
      const inIreland = ring.filter(([lng, lat]) =>
        lng < EAST_LIMIT && lng > -11.5 && lat > 51.0 && lat < 55.6);
      // A ring is kept whole or not at all: a clipped ring is a torn coast.
      if (inIreland.length > ring.length * 0.9 && ring.length > 20) rings.push([ring]);
    }
  }
}

mkdirSync("public/geo", { recursive: true });
const out = {
  type: "FeatureCollection",
  features: rings.map((coords) => ({
    type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: coords },
  })),
};
const json = JSON.stringify(out);
writeFileSync("public/geo/ireland.geojson", json);
console.log(`${out.features.length} rings, ${(json.length / 1024).toFixed(0)}kB`);
