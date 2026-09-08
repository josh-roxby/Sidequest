/** Copies MapLibre's worker bundle into public/ so the browser can fetch it.
 *
 *  MapLibre parses GeoJSON and vector tiles in a web worker. It builds that
 *  worker from a URL resolved at bundle time, and under this bundler the URL
 *  came out as the page itself: the worker then loaded an HTML document as a
 *  script, did nothing, and every GeoJSON source hung forever waiting for a
 *  reply. The map showed a background colour and no data, with no error
 *  anywhere, which is a miserable thing to debug.
 *
 *  So the worker is served as a plain static file and pointed at explicitly.
 *  Copied from node_modules on every build rather than committed, so it can
 *  never drift from the installed version. */
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const dist = dirname(require.resolve("maplibre-gl/dist/maplibre-gl.css"));
const out = "public/vendor/maplibre";

mkdirSync(out, { recursive: true });
// The worker imports the shared chunk beside it, so both have to travel.
for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(join(dist, f), join(out, f));
}
console.log(`maplibre worker copied to ${out}`);
