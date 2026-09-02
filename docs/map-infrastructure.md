# Side Quest: map infrastructure, points library and quest building

Written 3 September 2026. This is the engineering plan behind decisions that
are already made: PRD §11 chose MapLibre over self-built tiles, Valhalla run
offline, and our own places data; `docs/data-pipeline.md` covers how the
dataset is sourced and cleaned; `docs/fog-of-war.md` covers territory. None of
that is repeated here.

What this adds is the part between those documents and the code: what each
artefact actually is, how big, in what format, where it lives, what the client
downloads and when, and the algorithm that turns a library of points into a
walk. It also names the four places where the constraints collide, because
those need a decision from you rather than from me.

## The constraints, as testable rules

Your words turned into things a build can be checked against.

1. **Nothing costs money to run.** No metered API, no paid tier, no per-request
   billing anywhere in the runtime path.
2. **No third-party API at runtime.** External services may be used to *build*
   artefacts on a laptop. Nothing the app does while a person is walking may
   depend on one.
3. **No new service accounts.** Everything runs on what already exists:
   Supabase and Vercel.
4. **Minimal backend.** Ideally the runtime is static files plus HTTP range
   requests. Compute happens at build time, on a laptop, once.
5. **Self contained.** Every artefact is reproducible from scripts in this
   repo. Note this is not the same as every artefact *living* in this repo,
   which turns out to be impossible. See Limit 1.
6. **Fast.** A cold start on a phone on mobile data should be under a couple of
   hundred kilobytes before the map is usable.

Everything below is designed against those. Where a rule cannot be met, it is
called out rather than quietly bent.

---

## 1. The four layers

The map is not one artefact. It is four, with very different sizes, update
rates and delivery mechanisms, and keeping them separate is what makes the
budget work.

| Layer | What it is | Changes | Rough size | Where it lives |
|---|---|---|---|---|
| A. Basemap | Ground, water, coast, paths, labels | Quarterly | Large. See Limit 1 | Object storage, range-requested |
| B. Points | The 35,000 places worth knowing | Monthly | Small, sharded | Static shards, CDN cached |
| C. Walking network | Routable paths, build time only | Quarterly | Large, never shipped | A laptop |
| D. Quest corpus | Pre-built walks | Monthly | Modest, sharded | Static shards, CDN cached |

Layer C never reaches a phone. That is the whole trick: routing is the
expensive part, and it happens once on a laptop rather than on demand on a
server we would have to pay for.

---

## 2. Layer A: the basemap

### What we need it to draw

Not much, and that matters. The design is a nineteenth century survey plate:
ink line on paper, no satellite imagery, no photographic texture, no building
footprints in colour. `docs/design-system.md` §E. What the walker has to see
is: the coastline, water, the walkable network, enough road and settlement to
orient by, contours where they explain a climb, and townland boundaries.

That is a fraction of what a general purpose basemap carries. A conventional
vector basemap ships landuse polygons, building footprints, POI labels, transit
and a dozen other layers we would immediately style out of existence.

### The plan

Planetiler, run on a laptop, against a Geofabrik Ireland plus Northern Ireland
extract, with a **custom layer profile that emits only what we draw**. Output a
single PMTiles archive, uploaded to object storage, read by MapLibre over HTTP
range requests. No tile server, no per-tile billing, one file.

PMTiles is the specific reason this meets the constraints: it is a single
archive addressed by byte range, so dumb static hosting serves it, a CDN caches
the ranges, and there is nothing to run.

### Sizes

**I have not measured these and will not guess precisely.** The honest position
is that a full OSM-derived vector basemap for the island is in the hundreds of
megabytes, and a profile carrying six layers instead of thirty is a large
multiple smaller. The first pipeline task is to build both and measure, because
the number decides Limit 1 below.

Two levers if it comes back too big:

- **Zoom ceiling.** Build to z13 or z14 and overzoom in the client. Detail past
  z14 is buildings we do not draw.
- **Zoom floor.** Below about z8 the whole island is on screen and the fog is
  what people are reading, not the ground. A very coarse coastline and county
  outline is enough down there, and can be a hand-simplified GeoJSON of a few
  hundred kilobytes rather than tiles at all.

### What the client downloads

Only the ranges covering the tiles on screen. A walker in Clare never fetches
Donegal. This is the difference between a 300MB archive being fine and being
impossible: nobody downloads the archive.

---

## 3. Layer B: the points library

### The shape of the problem

Around 35,000 points survive the reachability and visibility passes. The client
needs, for anywhere it might be: what is near me, what is it, one line about it.
It does not need the tale until someone has arrived, which is a product rule
before it is an optimisation.

### Shard by cell, ship as static files

Split the library by H3 cell and publish one file per cell. The client resolves
its position to a cell, fetches that cell and its six neighbours, and has
everything within a comfortable radius.

The arithmetic, using the island's 84,400 km²:

| Resolution | Cell area | Cells over Ireland | Points per cell |
|---|---|---|---|
| res 4 | ~1,770 km² | ~48 | ~730 |
| **res 5** | **~253 km²** | **~334** | **~105** |
| res 6 | ~36 km² | ~2,340 | ~15 |

Res 5 is the sweet spot. Around 105 points per shard, and a point index record
(name, Irish name, category, group, townland, one line, coordinates, tags) runs
roughly 400 to 800 bytes of JSON. That is 40 to 85KB per shard raw, and these
compress extremely well because the field names repeat: expect 10 to 20KB over
the wire gzipped.

**Seven shards is on the order of 100KB.** That is the entire places dataset a
walker needs, on a cold start, once, and it caches.

At res 6 the shards are tiny but a walker near a boundary fetches seven of
them for very little payload each, which is worse: more round trips for less
data. At res 4 a single shard is half a megabyte. Res 5 is the choice unless
measurement says otherwise.

### Lore is not in the shard

The tale cards are prose with per-card sourcing, and they are the reward for
arriving. One file per point, fetched on unlock. This keeps the index small,
keeps the product rule honest, and means editing a tale does not invalidate a
shard 100 points wide.

### Format

Start with gzipped JSON. It is debuggable, every tool reads it, and at these
sizes the win from a binary format is not worth the opacity. Revisit only if
measurement says the parse cost matters on a slow phone, which at 100KB it
almost certainly will not.

---

## 4. Layer C: the walking network

Never ships. It exists so that Layer D can be built.

Valhalla in Docker on a laptop, fed the same OSM extract, used to answer two
questions during the corpus build: how far is it actually to walk between these
points, and what does the line look like on the ground. Both are expensive, both
are answered once, and the answers are baked into Layer D.

The reason this is worth stating plainly: **the moment anything asks a routing
engine at runtime, the zero cost constraint is gone.** Either we pay a provider
per request or we run a server. Layer D exists to make sure that never has to
happen.

---

## 5. Layer D: the quest corpus

### Schema

A quest is a route, a set of objectives, and honest numbers about it:

```
id, cell (H3 res 5), tier, shape, start (lat,lng), start_name,
polyline (encoded, ~10m spacing), distance_m, ascent_m, surface,
objectives [point_id, at_m], honesty [], encounters [], built_at
```

### Sizes

A 6km route sampled every 10m is about 600 positions. Encoded as a delta
polyline that is roughly 3KB. Add the objectives and the honesty list and a
quest row is on the order of 3 to 5KB.

An order of 12,000 quests nationally, per `docs/data-pipeline.md` §5, is
therefore **40 to 60MB in total, and 30 to 40 quests per res 5 cell, which is
about 120KB per shard.** A walker downloads their own cell. Same delivery as
Layer B: static files, CDN cached, no server.

### The coverage problem, honestly

A pre-built corpus is anchored to fixed start points. Real walkers stand
wherever they stand. There are three ways to handle that and the third is the
one I would build:

1. **Anchor density.** Build enough anchors that everyone is near one. This
   scales badly: halving the acceptable distance to an anchor quadruples the
   corpus.
2. **Runtime routing.** Solves it perfectly and breaks the cost constraint.
3. **Pre-built spine, re-anchored on device.** Ship the corpus at a comfortable
   anchor density, and when a walker is a few hundred metres off an anchor,
   redraw only the first and last leg on the device against the local path
   geometry the basemap already contains. The middle of the walk, which is the
   part that took a routing engine to get right, is untouched.

Option 3 is the design. It costs nothing, needs no server, and degrades
gracefully: if the local geometry is not good enough to re-anchor, the walker
gets the honest version, which is the walk starting where it starts and a
directions link to it. That is the `StartGate` already built.

---

## 6. The quest building algorithm

Run offline, on a laptop, over the published points library.

### Per anchor, per tier, per shape

**Step 1: candidates.** Take points within the tier's reach radius of the
anchor. Trot 350m, stroll 1km, sidequest 2km, adventure 4km, from `TIERS` in
`lib/data/types.ts`. This is a spatial index lookup, not a scan.

**Step 2: score.** Each candidate gets a number from four things:

- **Quality.** How much is actually there to see, from the visibility pass.
- **Lore.** Whether we have something true to say about it. A point with a
  Logainm meaning and an NIAH appraisal beats a point with a class name.
- **Rarity.** A mass rock is worth more than the fortieth ringfort in the
  parish, because a walk that is four ringforts is one ringfort four times.
- **Category spread.** Scored against what is already picked, not in isolation,
  so a walk tends toward variety without being forced into it.

**Step 3: pick anchors.** One point for a trot, up to four for an adventure.
Greedy by score with the spread term recomputed after each pick, which is
cheap and produces better sets than picking the top N independently.

**Step 4: order them.** For a loop, sort by bearing from the start so the route
sweeps round rather than crossing itself. For a line, take the strongest distant
point as the turning point and let the rest fall on the way out.

**Step 5: route.** Valhalla, walking profile, through the ordered points and
back to the start for a loop. This returns the real distance, the real ascent
and the real geometry, which is the entire reason for the offline step.

**Step 6: measure against the tier.** Duration comes from `lib/walking.ts`,
which already accounts for surface and ascent and dwell time at each point, and
is the same function the UI uses so the estimate a walker sees is the estimate
the builder accepted.

**Step 7: adjust and retry.** Too long, drop the furthest point or swap it for
a nearer candidate. Too short, add the next best. Two or three iterations, then
give up on that anchor and tier rather than shipping something that misses its
promise. **A tier that says 45 minutes and delivers 70 is worse than no quest.**

**Step 8: safety and honesty.** Reject anything routed along a road with no
footway above a speed threshold. Build the honesty list from what the route
actually crosses, never suppressed to make a quest look better.

**Step 9: stage as draft.** Nothing publishes without review. `docs/data-pipeline.md`
§8.

### Cost

Every expensive step is offline. At runtime the app does a cell lookup and a
static fetch. There is no server in this loop at all.

---

## 7. Runtime budget

What a walker downloads, cold, on mobile data, before the app is usable:

| | Estimate |
|---|---|
| App shell, JS and CSS | Measured per build, currently modest |
| Basemap tiles for one screen | Tens of KB, range requested |
| Points shards, own cell plus six | ~100KB gzipped |
| Quest shard, own cell | ~120KB |
| Artwork on the first screen | Currently the largest single item |

The artwork is the thing to watch, not the map. A home screen already pulls
several hundred kilobytes of plates at device pixel ratio 3, which is more than
the entire places dataset for a county. `docs/audit.md` P-02.

---

## 8. Where this collides with the constraints

Four things. All four need you.

### Limit 1: the basemap cannot live in the repository

GitHub rejects single files over 100MB and is unhappy well before a repository
reaches a gigabyte. A vector basemap for Ireland will not fit under those
limits even heavily trimmed, and Git LFS has its own quota that is not free at
volume.

So "self contained in the repo" cannot mean the tiles are in git. What it can
mean, and what I would propose, is:

- Every **script** that builds every artefact is in this repo.
- Every artefact is **reproducible from scratch** on a laptop with no accounts.
- The built artefacts live in object storage and are **replaceable at any
  time** by re-running the build.

Nothing external is called at runtime, and there is no vendor holding anything
we could not regenerate in an afternoon. **Decision needed: do you accept that
definition, or would you rather cut the basemap down until it does fit in git,
which means a much sparser map?**

### Limit 2: free tier storage and egress

The plan puts a few hundred megabytes on object storage and serves it to every
walker. Supabase's free tier has both a storage cap and a monthly egress cap,
and PMTiles range requests over a popular county could move real volume.

**I have not verified the current numbers and will not quote stale ones.** This
needs measuring against the actual archive size and a realistic user count
before launch. It is the single most likely place where "free" stops being
true, and it will fail quietly by being throttled rather than loudly.

**Decision needed: nothing today. But this must be measured before any public
launch, and I would want your call on the fallback if the numbers do not work.
Options include shipping one county, aggressive client caching, or Vercel's
static hosting instead. All are free-tier decisions I should not make alone.**

### Limit 3: ODbL share-alike

OSM is ODbL. Attribution is straightforward. The share-alike clause is not: a
database derived from OSM can carry an obligation to be offered under ODbL
itself, and our points library is derived from OSM among other sources.

This is a commercial question, not a technical one, and it interacts with PRD
§16. It may be manageable by keeping the OSM-derived geometry and our own
curated records as separable databases, but that is a structural decision to
take **before** the pipeline is built rather than after.

**Decision needed: is this worth an hour with someone who knows ODbL before
pass 0 runs?** I would say yes. Getting it wrong is expensive to unwind.

### Limit 4: Dúchas is still the best source and still blocked

Recorded already in `docs/data-pipeline.md`. Restated here because it is the
biggest single gap between what the corpus could be and what it will be. The
folklore collection is the tale of a point, townland by townland, and CC BY-NC
rules it out commercially. Link out only for v1.

**Decision needed: is approaching UCD for a licence worth doing early?** It has
a long lead time, so late is expensive.

---

## 9. Questions for you

Nothing here blocks work that can start now. These are the ones where I would
be guessing.

1. **Island wide, or one county first?** Clare is already the fixture data.
   Building Clare end to end would prove every step at a fraction of the volume
   and would make Limit 2 a non-issue for months. It also means the first
   public version says no to most of Ireland.
2. **How dense should quest anchors be?** This is the corpus size dial and it
   trades directly against Limit 2. My instinct is comfortable density plus
   on-device re-anchoring, per §5.
3. **How much basemap?** A full OSM-derived set gives a map that works when
   someone zooms into a town. A curated survey-plate set is smaller, more on
   brand, and looks thin in a built-up area.
4. **Contours?** They explain a climb better than any number and they are a
   large layer. Worth their size or not.
5. **Do we ship offline?** A walking app that loses signal is the normal case,
   not the edge case. Caching the active walk's tiles, points and tales is real
   work and it changes the storage design. `docs/audit.md` P-03.
6. **What happens outside Ireland?** The PRD says country locked. Worth
   confirming that means a polite refusal rather than an empty map.

## 10. What I would do first

In order, and none of it needs a decision above to start.

1. Build the OSM extract and run Planetiler twice, once full and once with a
   trimmed profile. **Measure both.** This is the number every other decision
   waits on.
2. Write the shard builder for Layer B against the existing fixtures, so the
   client-side loading path is real before the dataset is.
3. Port `lib/map/hex.ts` from its axial stand-in to real H3, since every shard
   key in this document depends on it.
4. Implement the scoring function from §6 against fixtures. It is pure, it is
   testable, and it is the part most likely to need iterating on taste.
