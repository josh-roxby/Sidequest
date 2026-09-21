import assert from "node:assert/strict";
import { test } from "node:test";
import { merge } from "../lib/data/mock/gathered.ts";
import type { Point } from "../lib/data/types.ts";

/** Two sources of places, one list. The corpus is hand placed and covers
 *  Dublin 3 and 9; the gathered files are surveyed and cover the country.
 *  Where they describe the same place, only one of them should reach a
 *  screen. */

const p = (over: Partial<Point>): Point => ({
  id: "p-x", name: "X", category: "Ringfort", group: "fort", townland: "",
  tags: [], blurb: "", visited: false, lat: 53.3640, lng: -6.2380, lore: [],
  ...over,
});

test("a gathered place beats the hand placed one it duplicates", () => {
  /* The corpus put the Casino at Marino in from memory, good to about a
     hundred metres. A Dublin run finds it in the registers with a surveyed
     position and sourced lore, and that is the one to keep. */
  const corpus = [p({ id: "p-casino-marino", name: "Casino at Marino", lat: 53.3692, lng: -6.2286 })];
  const gathered = [p({ id: "p-dublin-casino-marino", name: "The Casino at Marino", lat: 53.3691, lng: -6.2288 })];
  const out = merge(corpus, gathered);
  assert.equal(out.length, 1);
  assert.equal(out[0].id, "p-dublin-casino-marino");
});

test("a hand placed one with nothing like it survives", () => {
  const corpus = [p({ id: "p-bandstand", name: "The Bandstand", lat: 53.3646, lng: -6.2364 })];
  const gathered = [p({ id: "p-dublin-croke-park", name: "Croke Park", lat: 53.3607, lng: -6.2512 })];
  const out = merge(corpus, gathered);
  assert.equal(out.length, 2);
  assert.ok(out.some((x) => x.id === "p-bandstand"));
});

test("two different places at the same address both stay", () => {
  /* Near is not the same as the same. A church and the graveyard beside it
     share a wall and are two places to walk to. */
  const corpus = [p({ id: "p-church", name: "Saint Johns Church", lat: 53.3640, lng: -6.2380 })];
  const gathered = [p({ id: "p-dublin-graveyard", name: "Saint Johns Graveyard", lat: 53.3641, lng: -6.2381 })];
  assert.equal(merge(corpus, gathered).length, 2);
});

test("the same name a long way apart is two places", () => {
  /* Every county has a Castletown. Matching on name alone would collapse
     them into one. */
  const corpus = [p({ id: "p-castletown-dublin", name: "Castletown", lat: 53.3640, lng: -6.2380 })];
  const gathered = [p({ id: "p-kildare-castletown", name: "Castletown", lat: 53.3510, lng: -6.5290 })];
  assert.equal(merge(corpus, gathered).length, 2);
});

test("an id in both lists is not listed twice", () => {
  const same = p({ id: "p-shared", name: "Shared", lat: 53.36, lng: -6.23 });
  const out = merge([same], [same]);
  assert.equal(out.length, 1);
});

test("with nothing gathered the corpus comes back whole", () => {
  const corpus = [p({ id: "a" }), p({ id: "b", lat: 53.40, lng: -6.30 })];
  assert.deepEqual(merge(corpus, []).map((x) => x.id), ["a", "b"]);
});
