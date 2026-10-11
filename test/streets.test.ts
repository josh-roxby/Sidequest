import assert from "node:assert/strict";
import { test } from "node:test";
import { walkable } from "../lib/map/streets.ts";

/** Which ways a walker may use, and on which deck.
 *
 *  Shared by the two routes streets take to the router: decoded out of a
 *  fetched tile, and queried off a live map. Two copies of this rule would
 *  drift, and the drift would be a walk that routes in one place and refuses
 *  in another, so it lives in one function and this is the test of it. */

test("roads and paths a walker can use are let through at ground level", () => {
  for (const cls of ["path", "track", "service", "minor", "tertiary", "secondary", "primary"]) {
    assert.equal(walkable({ class: cls }), 0, `${cls} was refused`);
  }
});

test("nobody walks a motorway, and routing them onto one is worse than nowhere", () => {
  for (const cls of ["motorway", "trunk", "rail", "ferry", "aerialway"]) {
    assert.equal(walkable({ class: cls }), null, `${cls} was allowed`);
  }
});

test("a way you are not allowed onto is not a way", () => {
  assert.equal(walkable({ class: "service", access: "private" }), null);
  assert.equal(walkable({ class: "path", access: "no" }), null);
  assert.equal(walkable({ class: "path", access: "yes" }), 0);
});

test("tunnels are left out, bridges are lifted off the ground", () => {
  /* A bridge drawn at ground level joins the road beneath it, and the router
     then sends somebody off a flyover. The level is what keeps them apart. */
  assert.equal(walkable({ class: "minor", brunnel: "tunnel" }), null);
  assert.equal(walkable({ class: "minor", brunnel: "bridge" }), 1);
  assert.equal(walkable({ class: "minor" }), 0);
});

test("the schema's own layer wins where it has one", () => {
  assert.equal(walkable({ class: "primary", layer: 2 }), 2);
  assert.equal(walkable({ class: "primary", layer: -1 }), -1);
  /* Layer zero is the ground, which is also what a bridge tag would override,
     so a bridge explicitly on layer zero stays on the ground. */
  assert.equal(walkable({ class: "primary", layer: 0, brunnel: "bridge" }), 1);
});

test("a tile property that is missing or odd does not throw", () => {
  /* These come out of somebody else's tiles, so every field is whatever the
     extract happened to carry. */
  assert.equal(walkable({}), null);
  assert.equal(walkable({ class: undefined }), null);
  assert.equal(walkable({ class: "minor", layer: "two" }), 0);
  assert.equal(walkable({ class: "minor", layer: Number.NaN }), 0);
});
