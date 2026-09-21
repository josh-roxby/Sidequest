# Getting to a first MVP, and points of interest across Ireland

Written 21 September 2026, after a session spent on the quest generator. It
answers two questions. What is actually stopping this being handed to friends
and family, and how does the country get filled with places worth walking to.

The honest summary is that the app looks further along than it is. Twenty two
screens, a real vector basemap, a working router that draws walks on real
streets, and eighty three tests. What it does not yet have is the loop: you can
start a walk, and then nothing that happens next is recorded.

---

## 1. Where it actually is

**Working, and verified.**

- The basemap is real OpenStreetMap vector tiles, styled from the design
  tokens, with attribution. No key, no account, no meter.
- Walks are routed on real streets and paths, generated and written alike.
  `lib/quest/graph.ts` planarises tile geometry so junctions exist at all,
  which is the thing that makes routing on vector tiles possible.
- The generator picks places at random, leans towards well recorded ones,
  avoids repeating itself, and takes in more of them on longer tiers.
- A walk cannot be built without a live position, and the walker is told which
  setting is switched off when there is not one.
- Fifty points of interest, all carrying a historical reference, across
  Dublin 3 and Dublin 9, plus five in Clare left from the original fixtures.

**Not working, and this is the part that matters.**

| What | State |
|---|---|
| The walk tracks you | **No.** The walk screen never watches position |
| Progress along a walk | **No.** `walkedM` reads `objectives.reached`, a fixture flag nothing sets |
| Ground you covered is kept | **No.** No store exists. `lib/fog/` is in the layout and not on disk |
| Finishing a walk records it | **No.** It routes to a history screen showing fixtures |
| Anywhere outside D03 and D09 | **No points in reach** |
| A thrown error mid walk | **White screen.** No error boundary anywhere |
| Offline | **No.** Both the app shell and the tiles need network |
| Accounts | Off by design for this phase |

So the product promise, "walk it, keep the ground you covered", is the one
thing not built. Everything around it is.

---

## 2. What blocks handing it to friends and family

In the order they have to be fixed, because each one makes the next worth
doing.

### Blocker 1. The walk has to follow you

`MapView` already watches position, holds the walker's pin, and fires
`onUnlock` for each H3 cell entered. The walk screen passes it none of that:
no `visited`, no `onUnlock`, and no watch unless the walker presses locate.
So the map has the machinery and the screen never asks for it.

Needed: the walk screen watches from the moment it opens, the pin follows, the
distance covered comes from the track rather than from a flag, and an objective
is reached by being near it rather than by a fixture saying so.

This is the single biggest gap and it is mostly wiring.

### Blocker 2. It has to still be there tomorrow

A visited set in local storage, keyed by H3 cell at `RES_FINEST`, written as
cells unlock. A finished walk appended to a local history with its date,
distance, duration and the points reached. Local storage is the right place
until the migrations are approved: it is free, it needs no account, and it is
the honest lifetime for a device the walker owns.

Without this, someone walks five kilometres, closes the app, and it never
happened. Nobody comes back to that twice.

### Blocker 3. Points of interest outside Dublin 3

Covered in section 3. Until this lands the app works for about four square
kilometres of the north side and politely refuses everywhere else.

### Blocker 4. It must not be able to show a white screen

An `app/error.tsx` and an `(app)/error.tsx`, plus a boundary around the map,
which is the component most likely to throw on a device we have not tested.
Somebody two kilometres into a walk with a blank phone is the worst failure
this app can have, and right now nothing catches it.

### Worth doing before sharing, not blocking

- A service worker so the shell and recent tiles survive a dead spot. Walking
  in Ireland means losing signal.
- A real "about to run out of battery / you are far from the start" nudge.
- Install prompt copy, since this is a PWA and will be used from a home screen.

---

## 3. Points of interest across Ireland

### The shape of the problem

There is no single open dataset of "brown sign" attractions. The brown signs
themselves are a signage decision by Transport Infrastructure Ireland and
Fáilte Ireland, not a published register. What exists instead is better, and
it is already researched in [`docs/data-pipeline.md`](./data-pipeline.md):

| Source | Gives | Rough volume | Licence |
|---|---|---|---|
| Archaeological Survey of Ireland (SMR) | Class, geometry, description | ~140,000 | CC BY 4.0 |
| NIAH | Post-1700 buildings **with written appraisals** | ~50,000 | CC BY |
| OpenStreetMap | `tourism=attraction`, `historic=*`, parks, bridges | tens of thousands | ODbL |
| Logainm | Townland names and Irish forms | ~60,000 | CC BY 4.0 |
| OPW | State heritage sites, the ones with car parks and signs | ~70 | Verify |
| NPWS | National parks, nature reserves | ~80 | Verify |
| Wikidata | Identifiers, images, cross links | thousands | CC0 |

All free. All commercially usable except Dúchas, which is non commercial and
must be linked to rather than reused.

**The catch, and it is the whole reason this has not started:** every one of
those hosts is refused by the proxy on the machine this repo is being built on.
data.gov.ie, the Logainm API, Wikidata and every OSM endpoint return nothing.
A dataset written from memory instead would be fabricated data, which the phase
rules forbid and which nobody could check.

### Phase 0. Somewhere that can reach the internet

Pick one. Both are free.

1. **A GitHub Action.** A scheduled or manual workflow runs the ingest, writes
   the output, and commits it back. Reproducible, versioned, costs nothing, and
   anybody can re-run it. This is the recommendation.
2. **Josh's own machine.** `scripts/` already runs under plain Node. Faster to
   start, but the build then lives on one laptop.

Nothing else in this plan can begin until this exists.

### Phase 1. A national spine, roughly 3,000 to 5,000 points

Not all 140,000. The goal is that **every county has something worth walking
to**, not that everything is in. Take the highest signal subset:

- Every OPW heritage site and every NPWS park or reserve. These are the actual
  brown sign spots: signed, parked, and open.
- SMR filtered to classes with something to see: castles, tower houses, round
  towers, high crosses, dolmens, stone circles, cairns, monastic sites,
  ringforts with upstanding remains. This is a class filter, not a judgement
  call, and it cuts 140,000 to a few thousand.
- NIAH entries rated Regional or above, which is where the written appraisals
  are, so the lore comes free.
- OSM `historic=castle|ruins|monument|archaeological_site` and
  `tourism=attraction`, as the net that catches what the official registers
  miss.

Deduplicate across sources on position and name (pipeline pass 2, already
specified). Attach the Irish form from Logainm. Score and cut.

**Where it lives.** Five thousand points is a two to three megabyte file. Commit
it as NDJSON in the repo and load it through `lib/data` exactly as the mock
source is loaded today. No database, no hosting, no bill, and it works offline.
Move to Postgres when the migrations are approved and there is a reason to.

### Phase 2. Density where people actually walk

The spine gives coverage. It does not give a trot from your front door in
Fairview, which needs a place every few hundred metres. That is urban texture:
parks, bridges, churches, libraries, statues, old industrial works, named
terraces. Almost all of it is in OSM.

Target: every town over about five thousand people has enough within a
kilometre that a stroll does not repeat itself inside ten presses. The Griffith
Avenue measurement in section 4 is the yardstick.

### Phase 3. The rest of the survey

The full 140,000, run through the pipeline's reachability, visibility and
scoring passes. This is the long tail and it can wait until the app is being
used.

### The quality bar, enforced by tests

Whatever comes in has to clear what the Dublin corpus already clears, and
`test/fixtures.test.ts` already holds three of these:

- A name, a position, a category, a group and a townland.
- A one line blurb that says what it is before you have been.
- At least one lore entry with a real source and licence, or a link out where
  the licence is share alike.
- Addresses under a quarter of the set.
- Well recorded places spread across counties rather than clustered.

Extend those tests to run against the national file. A dataset with no tests
over it will rot in a month.

---

## 4. Navigation and how it feels

Measured, so it can be argued with.

- **Repetition.** Ten presses from Griffith Avenue, Drumcondra end: eight to
  ten different walks, nothing repeating inside three presses. From the Marino
  end: four, because only five recorded places sit inside a stroll's reach.
  The picker is doing all it can; the rest is phase 2 density.
- **Routing.** Every walk in the corpus re-cuts onto real streets, median
  distance error two per cent, all loops coming home a different way.
- **Re-cut cost.** About 750ms on a dense graph, once, behind the written line.

Refinements worth making, in rough order of how much they change the feel:

1. **The walk screen has to track you.** Blocker 1. Nothing else in this list
   matters next to it.
2. **Tell the walker where the next thing is.** A bearing and a distance to the
   next objective, so the map is not the only way to know.
3. **Keep the camera honest.** It follows until you drag, then hands back. That
   already works on the map screen and is not wired on the walk screen.
4. **Off route.** Say so, quietly, and offer the way back. Currently there is
   no concept of being off the line at all.
5. **Arrival.** Reaching a point should be an event: the tile pops, the card
   opens, the lore unlocks. The pop animation exists and nothing triggers it.
6. **The re-cut swap.** The written line is replaced under the walker about a
   second after the screen opens. It should be a visible transition rather than
   a jump, or it reads as a glitch.

---

## 5. The order to do it in

Each of these is a session's work or less.

1. Wire the walk screen to live position: watch, follow, unlock, and derive
   progress from the track. **Blocker 1.**
2. A visited store and a walk history in local storage. **Blocker 2.**
3. Error boundaries, app wide and around the map. **Blocker 4.**
4. Phase 0: the ingest running in a GitHub Action.
5. Phase 1: the national spine, committed as NDJSON, tests extended over it.
6. Arrival as an event, and the bearing to the next objective.
7. A service worker for the shell and recent tiles.
8. Phase 2: urban density, measured against the Griffith Avenue yardstick.

One to three are what stand between this and something worth sending to
somebody. Four and five are what make it worth using outside Dublin 3.
