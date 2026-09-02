import assert from "node:assert/strict";
import { test } from "node:test";
import { project, unproject, mercPerGroundMetre, IRELAND_RECT, DEFAULT_CENTRE } from "../lib/map/project.ts";
import { distanceM } from "../lib/geo.ts";

/** Slice 0's arithmetic. Pure, exact, and catastrophic to get wrong, which is
 *  why docs/audit.md X-07 names this file first. */

test("project round trips to floating point noise", () => {
  for (const p of [
    { lat: 52.9445, lng: -9.0650 },
    { lat: 55.45, lng: -10.7 },
    { lat: 51.35, lng: -5.3 },
    { lat: 0, lng: 0 },
  ]) {
    const back = unproject(project(p));
    assert.ok(Math.abs(back.lat - p.lat) < 1e-9, `lat ${back.lat} vs ${p.lat}`);
    assert.ok(Math.abs(back.lng - p.lng) < 1e-9, `lng ${back.lng} vs ${p.lng}`);
  }
});

test("y increases south, x increases east", () => {
  const north = project({ lat: 55, lng: -8 });
  const south = project({ lat: 52, lng: -8 });
  const west = project({ lat: 53, lng: -10 });
  const east = project({ lat: 53, lng: -6 });
  assert.ok(south.y > north.y, "south should have the larger y");
  assert.ok(east.x > west.x, "east should have the larger x");
});

test("Mercator distance over-reads ground distance by the scale factor", () => {
  // Two points on the same parallel, so the correction is exact.
  const a = { lat: 53.0, lng: -9.0 };
  const b = { lat: 53.0, lng: -8.9 };
  const pa = project(a), pb = project(b);
  const merc = Math.hypot(pb.x - pa.x, pb.y - pa.y);
  const ground = distanceM(a, b);
  const ratio = merc / ground;
  assert.ok(Math.abs(ratio - mercPerGroundMetre(53)) < 0.002,
    `ratio ${ratio} should match ${mercPerGroundMetre(53)}`);
});

test("the island rectangle contains the island and the default centre", () => {
  const c = project(DEFAULT_CENTRE);
  assert.ok(c.x > IRELAND_RECT.minX && c.x < IRELAND_RECT.maxX);
  assert.ok(c.y > IRELAND_RECT.minY && c.y < IRELAND_RECT.maxY);
  assert.ok(IRELAND_RECT.maxX > IRELAND_RECT.minX, "x grows east");
  assert.ok(IRELAND_RECT.maxY > IRELAND_RECT.minY, "y grows south");
});

test("haversine agrees with a known distance", () => {
  // Dublin GPO to Galway's Eyre Square, about 187km as the crow flies.
  const d = distanceM({ lat: 53.3498, lng: -6.2603 }, { lat: 53.2743, lng: -9.0490 });
  assert.ok(d > 185_000 && d < 190_000, `${Math.round(d)}m`);
});
