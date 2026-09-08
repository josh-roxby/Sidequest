import type { LayerSpecification, StyleSpecification } from "maplibre-gl";

/** The survey plate, as a MapLibre style.
 *
 *  Built in code rather than kept as a JSON file so it reads the same design
 *  tokens every other surface does: change `--map-paper` and the map changes
 *  with the app. docs/design-system.md §E.
 *
 *  Three sources, in the order they matter.
 *
 *  `basemap` is the real ground: roads, paths, water, woodland, buildings.
 *  Vector tiles in the OpenMapTiles schema, styled here rather than taken
 *  from the vendor's own stylesheet, so the ground arrives in the app's
 *  palette instead of somebody else's.
 *
 *  `coast` is a 23kB coastline at a kilometre, committed to the repo. It is
 *  the floor: if the basemap is switched off or cannot be reached, there is
 *  still an island under the fog and the app still works on a dead network.
 *
 *  The rest are the overlays the app writes into as the walk moves.
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

/** Where the real ground comes from.
 *
 *  OpenFreeMap by default: OpenStreetMap data, no API key, no account, no
 *  usage meter, which is why it is the one that can be switched on without
 *  asking anybody to sign up for anything. It is donation funded and carries
 *  no availability guarantee, so it is a way to walk the app now rather than
 *  the thing to launch on. Our own PMTiles archive replaces it in slice 1b
 *  and the only line that changes is this one.
 *
 *  The URL, the glyph endpoint and the fontstack below are the ones their own
 *  production style uses, and every `source-layer` named in this file was
 *  checked against the OpenMapTiles schema they generate with. That much is
 *  verified. Whether the tiles arrive is not: the network this was written on
 *  cannot reach the host.
 *
 *  Set `NEXT_PUBLIC_BASEMAP_URL` to point somewhere else, or to `off` to run
 *  on the committed coastline alone. */
const BASEMAP_DEFAULT = "https://tiles.openfreemap.org/planet";
const configured = process.env.NEXT_PUBLIC_BASEMAP_URL?.trim();
export const BASEMAP_URL = configured === "off" ? "" : (configured || BASEMAP_DEFAULT);

/** Glyphs, for the labels the basemap carries. Same host, same terms. */
const GLYPHS = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";

/** OpenStreetMap is ODbL. Attribution is a licence condition, not a courtesy,
 *  so it ships with the source rather than being left to the caller. */
export const BASEMAP_ATTRIBUTION =
  '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a> contributors';

/** Road weights, in the order a walker cares about them.
 *
 *  A walking app is not a driving app: a footpath through a park is the point
 *  and a dual carriageway is an obstacle. So paths and tracks are drawn as
 *  heavily as minor roads and are the only class with their own dash, and the
 *  big roads are present, legible and deliberately quiet. */
function roadLayers(line: string, path: string, rule: string): LayerSpecification[] {
  const w = (z0: number, w0: number, z1: number, w1: number) =>
    ["interpolate", ["exponential", 1.4], ["zoom"], z0, w0, z1, w1] as unknown as number;

  return [
    {
      id: "road-major",
      type: "line",
      source: "basemap",
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary"]]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": line, "line-opacity": 0.42, "line-width": w(10, 1.2, 18, 9) },
    },
    {
      id: "road-mid",
      type: "line",
      source: "basemap",
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", ["secondary", "tertiary"]]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": line, "line-opacity": 0.34, "line-width": w(11, 0.8, 18, 6) },
    },
    {
      id: "road-minor",
      type: "line",
      source: "basemap",
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", ["minor", "service"]]],
      minzoom: 12,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": line, "line-opacity": 0.26, "line-width": w(12, 0.5, 18, 4) },
    },
    {
      /* The reason the app exists. Dashed, because on the ground a path is a
         suggestion and a road is not. */
      id: "road-path",
      type: "line",
      source: "basemap",
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", ["path", "track"]]],
      minzoom: 12,
      layout: { "line-cap": "butt", "line-join": "round" },
      paint: {
        "line-color": path,
        "line-opacity": 0.75,
        "line-width": w(12, 0.9, 18, 3),
        "line-dasharray": [2.5, 1.8],
      },
    },
    {
      /* Surface railways only. A tunnelled line drawn as if it were on the
         ground is a barrier that is not there. */
      id: "rail",
      type: "line",
      source: "basemap",
      "source-layer": "transportation",
      filter: ["all",
        ["==", ["get", "class"], "rail"],
        ["!=", ["get", "brunnel"], "tunnel"],
      ],
      minzoom: 12,
      paint: { "line-color": rule, "line-width": 1.2, "line-dasharray": [3, 2] },
    },
  ];
}

export function surveyStyle(): StyleSpecification {
  const paper = token("--map-paper", "#EDEBE3");
  const water = token("--map-water", "#CFD8D6");
  const green = token("--map-green", "#DEE4D7");
  const fog = token("--map-fog", "#C9C6BC");
  const rule = token("--rule", "#D6D2C6");
  const stone = token("--stone", "#6E6F69");
  const ink = token("--ink", "#22231F");
  const rust = token("--rust", "#A8563B");

  const hasBasemap = Boolean(BASEMAP_URL);

  /* The floor, and it is drawn whether or not there is a basemap.
     
     Configuring a basemap is not the same as reaching one: the host can be
     down, the phone can be on a dead network, and a style that drops its
     fallback the moment a URL is set answers that with a blank blue rectangle.
     So the land fill always paints, and the basemap's own water and landcover
     draw over it when they arrive.

     The outline is the one part that does come off, because the real shoreline
     arrives with the tiles and a second one a kilometre out beside it reads as
     a mistake rather than as a fallback. */
  const coastLayers: LayerSpecification[] = [
    { id: "land", type: "fill", source: "coast", paint: { "fill-color": paper } },
    ...(hasBasemap ? [] : [{
      id: "coastline",
      type: "line" as const,
      source: "coast",
      paint: { "line-color": stone, "line-width": 1.1, "line-opacity": 0.45 },
    }]),
  ];

  const groundLayers: LayerSpecification[] = hasBasemap ? [
    {
      id: "landcover",
      type: "fill",
      source: "basemap",
      "source-layer": "landcover",
      paint: {
        "fill-color": [
          "match", ["get", "class"],
          "wood", green,
          "grass", green,
          "farmland", paper,
          "sand", token("--map-sand", "#E8E2D2"),
          "wetland", water,
          green,
        ],
        "fill-opacity": ["match", ["get", "class"], "wood", 0.85, "grass", 0.6, 0.4],
      },
    },
    {
      /* Parks are where people walk, so they are named ground rather than
         another shade of landcover. */
      id: "park",
      type: "fill",
      source: "basemap",
      "source-layer": "park",
      paint: { "fill-color": green, "fill-opacity": 0.7 },
    },
    {
      id: "water",
      type: "fill",
      source: "basemap",
      "source-layer": "water",
      filter: ["!=", ["get", "brunnel"], "tunnel"],
      paint: { "fill-color": water },
    },
    {
      id: "waterway",
      type: "line",
      source: "basemap",
      "source-layer": "waterway",
      minzoom: 11,
      paint: { "line-color": water, "line-width": ["interpolate", ["linear"], ["zoom"], 11, 0.6, 18, 3] },
    },
    {
      id: "building",
      type: "fill",
      source: "basemap",
      "source-layer": "building",
      minzoom: 14,
      paint: { "fill-color": rule, "fill-opacity": 0.55 },
    },
    ...roadLayers(stone, rust, rule),
  ] : [];

  return {
    version: 8,
    ...(hasBasemap ? { glyphs: GLYPHS } : {}),
    sources: {
      ...(hasBasemap ? {
        basemap: {
          type: "vector" as const,
          url: BASEMAP_URL,
          attribution: BASEMAP_ATTRIBUTION,
        },
      } : {}),
      coast: { type: "geojson", data: "/geo/ireland.geojson" },
      /* Declared empty so every layer has something to bind to on the first
         frame. The app writes into them with setData as things move. */
      ...Object.fromEntries(DATA_SOURCES.map((id) => [id, EMPTY])),
    },
    layers: [
      /* Sea underneath, land painted on top of it. The other way round, with
         paper under a translucent land fill, the coast was a scribble across
         two identical tones and told you nothing. */
      { id: "sea", type: "background", paint: { "background-color": water } },
      ...coastLayers,
      ...groundLayers,

      /* The fog sits above the ground and below everything the walk draws, so
         you can see that there is something under the cloud without being able
         to read it. One fill and one edge: the fill is the mass, the edge is
         the frontier, and only the frontier is drawn hard. */
      {
        /* Not paper. Fog painted in the ground's own colour is invisible over
           ground, which is fine over a detailed basemap and leaves the map
           looking entirely cleared the moment the tiles are not there. This
           tone is a shade off the paper in every case, so unwalked ground
           reads as unwalked whether or not there is anything under it.

           Opaque enough to hide what is written on the ground, sheer enough
           that you can see there is something there to go and find. */
        id: "fog",
        type: "fill",
        source: "fog",
        paint: { "fill-color": fog, "fill-opacity": ["coalesce", ["get", "shade"], 0.82] },
      },
      {
        /* Drawn in the fill's own colour so neighbouring cells merge into one
           mass and only the frontier shows an edge. A contrasting stroke here
           turned the fog into a honeycomb of separate tiles. */
        id: "fog-edge",
        type: "line",
        source: "fog",
        layout: { "line-join": "round" },
        paint: { "line-color": fog, "line-width": 1.5, "line-opacity": ["coalesce", ["get", "shade"], 0.82] },
      },
      {
        /* The cell a quest starts in, at the resolution the fog is drawn at so
           the two grids are the same grid. */
        id: "quest-tiles",
        type: "fill",
        source: "quest-tiles",
        paint: { "fill-color": rust, "fill-opacity": 0.14 },
      },
      {
        id: "quest-tiles-edge",
        type: "line",
        source: "quest-tiles",
        layout: { "line-join": "round" },
        paint: { "line-color": rust, "line-width": 1.2, "line-opacity": 0.55 },
      },
      { id: "trail-done", type: "line", source: "trail-done",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": token("--map-trail", "#2E4034"), "line-width": 3 } },
      { id: "trail-todo", type: "line", source: "trail-todo",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": token("--map-trail", "#2E4034"), "line-width": 3, "line-dasharray": [2, 2] } },

      ...(hasBasemap ? [
        {
          /* Placenames last, above the fog, because knowing where you are
             looking is orientation rather than detail. */
          id: "place-label",
          type: "symbol" as const,
          source: "basemap",
          "source-layer": "place",
          filter: ["in", ["get", "class"], ["literal", ["city", "town", "village", "suburb"]]],
          layout: {
            "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
            "text-font": ["Noto Sans Regular"],
            "text-size": ["interpolate", ["linear"], ["zoom"], 10, 10, 16, 13],
            "text-transform": "uppercase" as const,
            "text-letter-spacing": 0.08,
            "text-max-width": 7,
          },
          paint: {
            "text-color": ink,
            "text-opacity": 0.7,
            "text-halo-color": paper,
            "text-halo-width": 1.4,
          },
        } as LayerSpecification,
      ] : []),
    ],
  };
}
