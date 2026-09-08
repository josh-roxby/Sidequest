import type { StyleSpecification } from "maplibre-gl";

/** The survey plate, as a MapLibre style.
 *
 *  Built in code rather than kept as a JSON file so it reads the same design
 *  tokens every other surface does: change `--map-paper` and the map changes
 *  with the app. docs/design-system.md §E.
 *
 *  Two sources, and only one of them is ours to worry about. `coast` is a 23kB
 *  GeoJSON of the real coastline at a kilometre, committed to the repo, so the
 *  map is never empty and never needs the network. `basemap` is the detailed
 *  ground and is only added when a tile URL is configured, so nothing
 *  third-party runs unless it has been switched on deliberately.
 *  docs/v1-map-build.md slice 1. */

const token = (name: string, fallback: string) => {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};

/** The sources the app writes into as the camera and the walk move. */
export const DATA_SOURCES = ["fog", "quest-tiles", "trail-done", "trail-todo"] as const;

const EMPTY = {
  type: "geojson" as const,
  data: { type: "FeatureCollection" as const, features: [] },
};

/** Where the detailed ground comes from, when it comes from anywhere.
 *
 *  Unset by default. Point it at our own PMTiles archive when slice 1 finishes
 *  the Planetiler build, or at any vector source that speaks the OpenMapTiles
 *  schema in the meantime. A style URL and a tile URL are both accepted. */
export const BASEMAP_URL = process.env.NEXT_PUBLIC_BASEMAP_URL ?? "";

export function surveyStyle(): StyleSpecification {
  const paper = token("--map-paper", "#EDEBE3");
  const water = token("--map-water", "#CFD8D6");
  const rule = token("--rule", "#D6D2C6");
  const stone = token("--stone", "#6E6F69");

  return {
    version: 8,
    // No glyphs or sprite: nothing in this style draws text or icons yet, and
    // pointing at a font server would be a network dependency for nothing.
    // Labels arrive with the basemap in slice 2.
    sources: {
      coast: { type: "geojson", data: "/geo/ireland.geojson" },
      /* Declared empty so every layer has something to bind to on the first
         frame. The app writes into them with setData as things move. */
      ...Object.fromEntries(DATA_SOURCES.map((id) => [id, EMPTY])),
    },
    layers: [
      /* Sea underneath, land painted on top of it. The other way round, with
         paper under a translucent land fill, the coast was a scribble across
         two identical tones and told you nothing. This way an estuary reads as
         an estuary from the first frame, and inland the land fill covers the
         whole screen so there is no edge to notice. */
      { id: "sea", type: "background", paint: { "background-color": water } },
      {
        id: "land",
        type: "fill",
        source: "coast",
        paint: { "fill-color": paper },
      },
      {
        /* The source carries a vertex about every kilometre, so this is the
           right shore to a kilometre: true enough to navigate a bay by, not
           true enough to walk a headland by. The detailed ground in slice 2
           replaces it. */
        id: "coastline",
        type: "line",
        source: "coast",
        paint: { "line-color": stone, "line-width": 1.1, "line-opacity": 0.45 },
      },
      /* Placeholders the app fills in. Declared here so their draw order is a
         property of the style rather than of whichever effect happened to run
         first. */
      { id: "fog", type: "fill", source: "fog", paint: { "fill-color": rule, "fill-opacity": 0.55 } },
      { id: "fog-edge", type: "line", source: "fog", paint: { "line-color": rule, "line-width": 1, "line-opacity": 0.5 } },
      { id: "quest-tiles", type: "line", source: "quest-tiles", paint: { "line-color": token("--rust", "#A8563B"), "line-width": 2 } },
      { id: "trail-done", type: "line", source: "trail-done",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": token("--map-trail", "#2E4034"), "line-width": 3 } },
      { id: "trail-todo", type: "line", source: "trail-todo",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": token("--map-trail", "#2E4034"), "line-width": 3, "line-dasharray": [2, 2] } },
    ],
  };
}

