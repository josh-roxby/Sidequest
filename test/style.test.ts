import assert from "node:assert/strict";
import { test } from "node:test";
import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";
import { surveyStyle, BASEMAP_URL, DATA_SOURCES } from "../lib/map/style.ts";

/** The style is built in code, which means a typo in a filter or a paint
 *  property is a blank map at runtime rather than a compile error: MapLibre
 *  reports a bad layer by dropping it and carrying on. So it is validated
 *  against the style spec here, where a mistake is a red test instead of an
 *  empty rectangle nobody notices until they are standing in a field.
 *
 *  This cannot tell us the tiles exist, or that a `source-layer` matches what
 *  a given vendor serves. Those names come from the OpenMapTiles schema and
 *  are checked against it by hand. Everything expressible in the style is
 *  checked here. */

test("the survey style is a valid MapLibre style", () => {
  const errors = validateStyleMin(surveyStyle());
  assert.deepEqual(errors.map((e) => `${e.message}`), [],
    errors.map((e) => e.message).join("\n"));
});

test("every layer binds to a source that exists", () => {
  const style = surveyStyle();
  const sources = new Set(Object.keys(style.sources));
  for (const layer of style.layers) {
    if (layer.type === "background") continue;
    assert.ok(sources.has(layer.source),
      `layer ${layer.id} draws from ${layer.source}, which is not declared`);
  }
});

test("the overlays the app writes into are all declared", () => {
  const style = surveyStyle();
  for (const id of DATA_SOURCES) {
    assert.ok(id in style.sources, `nothing to setData into for ${id}`);
  }
});

test("the coastline floor survives a basemap being configured", () => {
  /* A configured basemap is not a reached one. The land fill is what stops an
     unreachable tile host showing as an empty sea, so it is drawn either way. */
  const style = surveyStyle();
  assert.ok(style.layers.some((l) => l.id === "land"),
    "the coastline fill is gone, so a dead network is a blank map");
  assert.ok("coast" in style.sources);
});

test("the ground layers are present exactly when a basemap is configured", () => {
  const ids = new Set(surveyStyle().layers.map((l) => l.id));
  for (const id of ["road-path", "road-major", "water", "landcover"]) {
    assert.equal(ids.has(id), Boolean(BASEMAP_URL),
      `${id} does not match whether a basemap is configured`);
  }
});
