import assert from "node:assert/strict";
import { test } from "node:test";
import { arrivedAt, emptyTrack, extend } from "../lib/quest/track.ts";
import { offset } from "../lib/quest/route.ts";

/** How far the walker has walked. The screen used to read this off a fixture
 *  flag nothing ever set, so it said 0 M for the whole walk. These are about
 *  the two ways the honest version goes wrong instead. */

const START = { lat: 53.3640, lng: -6.2380 };

/** A walk north, in even steps. */
function walkNorth(steps: number, stepM: number) {
  let t = extend(emptyTrack, START);
  for (let i = 1; i <= steps; i++) t = extend(t, offset(START, i * stepM, 0));
  return t;
}

test("walking a hundred steps of ten metres is a kilometre", () => {
  const t = walkNorth(100, 10);
  assert.ok(Math.abs(t.metres - 1000) < 15, `measured ${Math.round(t.metres)}m`);
  assert.equal(t.fixes, 101);
});

test("the first fix places the walker and covers no ground", () => {
  const t = extend(emptyTrack, START);
  assert.equal(t.metres, 0);
  assert.deepEqual(t.last, START);
});

test("standing still does not add a kilometre", () => {
  /* A phone at rest wanders by a few metres a second. Summing that wander is
     how somebody on a bench finishes a walk they never took. */
  let t = extend(emptyTrack, START);
  for (let i = 0; i < 300; i++) {
    t = extend(t, offset(START, 3, (i * 47) % 360));
  }
  assert.equal(t.metres, 0, `a stationary phone recorded ${Math.round(t.metres)}m`);
});

test("a wild jump from a vague reading is not credited", () => {
  /* A fix can arrive hundreds of metres out when the phone switches between
     GPS and the network, and one of those adds a leg nobody walked. */
  let t = extend(emptyTrack, START);
  t = extend(t, offset(START, 40, 0));
  const before = t.metres;
  t = extend(t, offset(START, 900, 90), 300);   // 900m away, accurate to 300m
  assert.equal(t.metres, before, "a 300m-accurate leap was counted as walking");
  /* It still moves the walker, so the next real step is measured from where
     they actually are rather than from where they used to be. */
  assert.ok(t.last && Math.abs(t.last.lng - START.lng) > 0.005);
});

test("a long step from a confident reading is real walking", () => {
  /* The opposite case. A phone in a pocket can report half a minute apart,
     and refusing that would lose most of a walk. */
  let t = extend(emptyTrack, START);
  t = extend(t, offset(START, 100, 0), 8);
  assert.ok(Math.abs(t.metres - 100) < 5, `measured ${Math.round(t.metres)}m`);
});

test("a reading that is not a number is ignored rather than fatal", () => {
  /* iOS has shipped NaN coordinates. One of them through this would make
     every subsequent distance NaN and the card would read NaN M. */
  let t = extend(emptyTrack, START);
  t = extend(t, offset(START, 50, 0));
  const good = t.metres;
  t = extend(t, { lat: Number.NaN, lng: -6.2 });
  assert.equal(t.metres, good);
  assert.ok(Number.isFinite(t.metres));
});

test("you arrive by being there", () => {
  const places = [
    { id: "o-1", lat: 53.3700, lng: -6.2300 },
    { id: "o-2", lat: 53.3800, lng: -6.2100 },
  ];
  const atFirst = { lat: 53.3700, lng: -6.2300 };
  assert.deepEqual(arrivedAt(places, atFirst), ["o-1"]);
  /* Across the road from a round tower is having been to the round tower. */
  assert.deepEqual(arrivedAt(places, offset(atFirst, 30, 90)), ["o-1"]);
  /* A street away is not. */
  assert.deepEqual(arrivedAt(places, offset(atFirst, 200, 90)), []);
});
