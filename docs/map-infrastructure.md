# Side Quest: map infrastructure, points library and quest building

Written 3 September 2026, revised the same day after the budget and scope
questions were answered. **Cost is now acceptable and the target is the whole
island.** Section 11 records what changed and why, and it materially simplifies
several things below. Read it alongside the rest rather than after it.

This is the engineering plan behind decisions that
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

1. ~~Nothing costs money to run.~~ **Revised.** A predictable monthly bill is
   fine. What is not fine is a *per-use meter on the core loop*: a walking app
   opens its map constantly, and anything charged per map load turns the
   product's central action into a cost centre. See §11.2.
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


---

## 11. Revisions after the budget and scope answers

Three answers came back: a monthly cost is acceptable, Supabase and a render
host are both feasible, and the target is Ireland wide rather than one county.
That changes four things.

### 11.1 Yes, Postgres. For most of it.

**"Is Supabase too slow" is the wrong axis.** It is very fast at the thing we
need most and the wrong tool for exactly one thing.

**What belongs in Postgres, comfortably:**

| | Volume | Verdict |
|---|---|---|
| Points library | ~35,000 rows | Trivial. A GiST index over 35k rows answers a radius query in well under a millisecond. Postgres starts caring somewhere north of a few million |
| Quest corpus | ~12,000 rows, 3 to 5kB each, ~50MB | Trivial |
| Fog cells, walks, notes, profiles | Per user | What a database is for |

The Pro plan includes 8GB of database, and everything above lands around 100MB
before user data. There is no capacity question here at all.

**What does not belong in Postgres: the basemap.** A PMTiles archive of a few
hundred megabytes is a file, not a table. Two ways it goes wrong:

- **As a blob.** Every tile read goes through the connection pool and the
  compute you rent, to do a job static object storage and a CDN do for
  effectively nothing.
- **Generated live with `ST_AsMVT`.** This is a real and respectable pattern,
  and it is the one place the answer to "too slow?" is genuinely yes at our
  size. Every pan is dozens of tile requests, each a spatial query plus a
  geometry clip plus a protobuf encode. A Micro instance is 2 ARM cores and 1GB
  of RAM. It will not hold up, and scaling compute to fix it means paying by
  the hour for work a pre-built file does once.

**So: Postgres for points, corpus and user state. Storage for tiles.** Pro
includes 100GB of storage and 250GB of egress a month, then $0.09/GB. A few
hundred megabytes of archive served as byte ranges is not close to either
ceiling.

**What this simplifies.** §3 of this document designed static per-cell shards
for the points library specifically to avoid needing a backend. With Postgres
available and paid for, that whole layer can go: the client queries points and
quests directly through PostgREST, always fresh, no shard build step, no cache
invalidation when a tale is edited. The shard design stays in §3 as the
fallback if we ever want to run with no database at all, but it is no longer
the plan.

The one thing the shards were also buying is **offline**, and that has to be
solved anyway: cache the active walk's points, tales and tiles on device when a
walk starts. That is `docs/audit.md` P-03 and it is now the only reason left to
care about local copies.

### 11.2 OSM: the licence and the vendor are two different questions

Worth separating, because ODbL is a licence and Mapbox is a company, and they
constrain different things.

**The licence layer applies whoever you use.** Every vendor below serves the
same OSM data under the same terms. Choosing Mapbox does not launder ODbL out
of a database we derive from OSM.

- **Attribution** is required, always, in all cases. Cheap and non negotiable.
- **Share-alike** applies to a *Derivative Database*, not to a picture. Drawing
  a map from OSM produces a Produced Work and only needs attribution. Combining
  OSM geometry with our own curated records into a new database is where it may
  bite. This is still Limit 3 and still worth an hour of proper advice, and the
  likely mitigation is keeping the OSM-derived geometry and our own records as
  separable databases rather than one merged table.

**The vendor layer is a cost and control question.**

| Option | Shape of the deal | Fits us? |
|---|---|---|
| **Mapbox** | 50,000 web map loads a month free, then $5 per 1,000, falling to $3 above 200,000. Vector tile requests included in a load | Poor. A "map load" is the exact action our app is built around. 100,000 loads is around $250 a month and it grows with engagement, which is the opposite of what you want |
| **MapTiler** | Free self-hosted, cloud from around $29 a month, billed on two meters, sessions and tile requests | Reasonable fallback. Cheaper than Mapbox, no routing |
| **Stadia Maps** | Credit based, generally the most predictable managed pricing, and includes geocoding and routing | The best managed option if we ever want out of self-hosting |
| **Protomaps, self-hosted PMTiles** | Open source. One archive on our own storage. No vendor, no meter | The plan. See below |
| **Google Maps** | Per-request, heavily branded, limited restyling | No. The survey plate look is not achievable and the cost model is worse than Mapbox's |

**Self-hosted PMTiles stays the recommendation, and money is only the third
reason.**

1. **No per-use meter on the core loop.** We never have to think about how
   often someone opens the map. For a walking app that is the whole product.
2. **No runtime third party.** Nobody is on a hillside in Clare waiting on
   somebody else's uptime.
3. **Total style control.** The aesthetic is a specific and unusual one and it
   wants the whole stylesheet, not a vendor's approximation of it.

The honest cost of that choice: **we own the Planetiler build and we own
uptime.** Neither is hard, both are real work, and MapTiler or Stadia are the
fallback if the build turns out to be more trouble than it is worth.

### 11.3 Sources beyond Dúchas

Dúchas is CC BY-NC and commercially blocked, and it is still the best folklore
source in the country. It is not the only way to have something true to say
about a place, and one of the alternatives is arguably better suited to what we
actually do.

**Open-licence modern datasets, commercially usable:**

| Source | What it gives | Notes |
|---|---|---|
| Archaeological Survey of Ireland, National Monuments Service | ~140k records, class and description | CC BY 4.0. Already in the register |
| NIAH | Description and Appraisal prose for post-1700 buildings | CC BY. Already the tale, needs editing not writing |
| **Logainm** | Townland names, Irish forms, meanings | CC BY 4.0, and it has a **real API** through the Gaois Developer Hub. **Needs an account, so it needs you.** See §11.5 |
| **Open Topographic LiDAR, data.gov.ie** | National LiDAR, ESRI REST and WMS | New to this plan. This is contours and honest ascent numbers without buying elevation data. Worth a proper look |
| TII digital heritage, via the Digital Repository of Ireland | Hundreds of excavation reports | Site-by-site archaeological detail |
| Wikidata | Identifiers, dates, cross-links | CC0 |

**Public domain nineteenth century texts. This is the real Dúchas substitute.**

Copyright expired long ago, so there is no licence question about the text
itself:

- **O'Donovan's Ordnance Survey Letters, 1834 to 1841.** Twenty-nine counties,
  excluding Cork, Antrim and Tyrone. John O'Donovan and his colleagues walked
  the country recording antiquities and placenames parish by parish, and this
  is the work that standardised Irish placenames in the first place. Digitised
  and publicly readable on askaboutireland.ie.
- **Lewis's Topographical Dictionary of Ireland, 1837.** Parish by parish
  descriptions of the whole island. Full text on libraryireland.com.
- **Ordnance Survey Memoirs**, mainly Ulster, same period.
- First edition OS six-inch mapping, Griffith's Valuation.

**Why this may be better than Dúchas for us, not just legally available.**
Dúchas is folklore collected by schoolchildren in 1937: wonderful, and harder
to verify against PRD constraint C4, no invented history. The Ordnance Survey
Letters are antiquarian description *of places*, written by the people
surveying them, which is exactly the shape of a tale attached to a point.

**The caveat, and it matters.** The *text* is public domain; a particular
*digitisation* may carry its own site terms or database rights. Taking the text
is fine. Scraping someone's website is a separate question with a separate
answer. Prefer scans we OCR ourselves, or an explicitly open host such as the
Internet Archive, over hitting askaboutireland.ie in a loop.

**On search and location APIs generally:** Nominatim and Overpass are both free
and both have usage policies that rule out being a runtime dependency. They are
build-time tools. Nothing in this section changes the rule that the app calls
no third-party API while somebody is walking.

### 11.4 Ireland wide, confirmed

Question 1 in §9 is answered. Consequences:

- The corpus is built for the island, not for Clare, so the anchor density
  question in §9 now sets the real number rather than a pilot's.
- Limit 2 stops being a launch blocker, because Pro's 250GB of egress a month
  and $0.09/GB after it is a bill rather than a wall. It is still worth
  measuring, but as budgeting rather than as a risk.
- The fixture data staying in Clare is fine and deliberate. It exercises the
  whole app at a scale that can be reasoned about by hand.

### 11.5 Still needs you

Reduced from four to two, plus one new one.

- **Limit 3, ODbL share-alike, unchanged.** Still worth an hour of advice
  before pass 0. Using a vendor does not solve it.
- **Limit 4, Dúchas.** Downgraded. Approaching UCD is still worth doing because
  the collection is extraordinary, but §11.3 means it is no longer the
  difference between having tales and not having them.
- **New: the Logainm API needs an account on the Gaois Developer Hub.** Irish
  placename meanings are close to load-bearing for this product, so it is worth
  having. I have not created it and will not: it is a service account, so it is
  yours to make.

Limits 1 and 2 are effectively closed. The basemap still cannot live in git,
but with paid storage that is now a filing decision rather than a constraint.


---

## 12. Where quests are actually assembled

Recorded 3 September 2026, because the shorthand "query nearby points and
generate a quest" is one word away from a different architecture and the word
is *where*.

### The two halves of a quest

**Choosing the points is cheap.** A radius query against the points table
returns candidates in under a millisecond, and the scoring in §6 is arithmetic
over a few dozen rows. This can happen anywhere, any time, on demand.

**Joining them into a walk is not.** Turning four points into a route needs a
routing engine: real walking distance over real paths, real ascent, and a line
that follows ground a person can actually cross. That is the expensive half and
it is the half that decides the architecture.

So "we query a range of nearby points and have them returned" is exactly right,
and it is the input to quest assembly rather than the whole of it.

### Three ways to do the expensive half

| | How | Cost | Coverage | Safety |
|---|---|---|---|---|
| **A. Pre-built corpus** | Route ~12,000 quests offline, ship rows | None at runtime | Anchored. A walker away from an anchor gets an approximation | Every quest human reviewed before publishing |
| **B. Live assembly** | Query points, route on demand | One always-on routing service | Perfect. A quest from exactly where you stand | Nothing is reviewed before a person walks it |
| **C. Live, with the safety rules encoded** | As B, with a strict costing profile, an automated validator and a cache | Same as B | Perfect | Rules enforced per route rather than eyes per route |

§5 chose A, and it chose it **only because routing had to cost nothing**. That
constraint is gone, so the choice is worth reopening on its merits.

### What actually argues for each, now that money is not the argument

**For A:** a human looks at every published quest. For a product that sends
people down boreens, that is not nothing. It is the strongest remaining
argument and it is a safety argument, not a cost one.

**Against A:** the corpus is a fixed set of walks anchored to fixed points. It
has a coverage problem that §5 solves with on-device re-anchoring, which is a
workaround for a limitation we no longer have to accept. It also creates a
review backlog of twelve thousand items before launch, and every dataset
refresh invalidates part of it.

**For B and C:** the product's promise is a walk from where you are, right now,
for the time you have. Live assembly is that promise met literally rather than
approximately. It also deletes the corpus build, the corpus review and the
re-anchoring code.

### The recommendation: C

Human review does not have to mean human eyes on each route. It can mean the
rules those eyes would apply, written down and enforced:

- **A strict costing profile.** The router is only allowed on ways we have
  decided are walkable. A road above a speed threshold with no footway is not
  routable at all, so no generated quest can use one.
- **An automated validator after routing.** Re-check the assembled route
  against the same rules the offline builder would have applied in §6 step 8,
  and reject rather than ship a walk that fails.
- **Reviewed points, not reviewed routes.** The places are curated and carry
  their own safety and access attributes. That review still happens, offline,
  where it belongs.
- **A cache.** Key on rounded position, tier and shape. Popular ground warms up
  and costs nothing after the first walker, which also gives back most of A's
  efficiency without any of its rigidity.

This keeps the safety property that made A attractive, meets the product
promise that made B attractive, and the cache means the routing service is
sized for cold requests rather than for every request.

### What C costs and what it needs

A self-hosted Valhalla for Ireland, always on. The OSM extract is on the order
of a gigabyte and the built routing tiles are a few gigabytes on disk, so this
is a small instance rather than a large one. **The exact figure needs
measuring, not guessing**, and it is the same Planetiler-and-Valhalla build the
plan already calls for, just deployed rather than run on a laptop.

**This is a new always-on service and a new monthly line item, so it is a
decision rather than an assumption.** §5 stays as written until it is taken.

---

## 13. Sequencing the basemap: ours now, a vendor later

Right instinct, with one caveat about which vendor.

**Ours first is the cheap direction to move in.** MapLibre reads standard
vector tiles, so a PMTiles archive today and a hosted tile URL tomorrow is a
config change, not a rewrite.

**MapTiler and Stadia are the frictionless later.** Both serve standard vector
tiles that MapLibre consumes with no code change and no licence question.

**Mapbox is a bigger jump than it looks**, for two reasons worth knowing before
it becomes the assumption:

1. **The SDK went proprietary.** Mapbox GL JS v2 and later is not open source.
   Moving to their SDK is a licence decision, not just a dependency bump, and
   MapLibre exists precisely because of that split.
2. **Using Mapbox tiles with MapLibre is contested.** Their product terms
   restrict interfering with what a Mapbox SDK reports, and whether that
   extends to serving their tiles into a non-Mapbox client is argued rather than
   settled. **Verify with Mapbox directly before designing around it.** It is a
   cheap email and an expensive assumption.

None of that rules Mapbox out. It means "our tiles now, Mapbox later" should be
"our tiles now, a vendor later, and Mapbox is the one that needs a conversation
first".


---

## 14. Why Valhalla, and the answer is probably not Valhalla

Asked 3 September 2026: can the assembly not just run in code on Vercel when a
quest is generated? Largely yes, and it is the better answer. Recording why the
plan said Valhalla in the first place, because the reason expired.

### Why it was there

§5 assumed routing happened **offline in a batch on a laptop**. In that world a
heavyweight engine is free: it runs once, nobody waits on it, and its size does
not matter. Valhalla was chosen for what it gives you out of the box, not
because the problem needs it.

Once assembly moves to request time that calculation inverts, and what was free
becomes an always-on service and a monthly bill.

### What routing a walk actually needs

Much less than a general routing engine provides. Valhalla, OSRM and the rest
carry vehicle costing, turn restrictions, one-way rules, lane logic, ferry and
toll handling, time-dependent speeds. **A walker has none of those problems.**
Walking is very close to plain shortest path over a graph where the only
interesting part is the cost function, and the cost function is the exact thing
we want to write ourselves, because it is where the safety rules live per §12.

What is left is:

1. A graph of walkable ways: nodes, edges, length, surface, incline, a safety
   class.
2. A* over it.
3. The geometry of the chosen path, for drawing.

### It fits in a function, because the graph does not have to

The instinct that this is too much data for a serverless function is right and
also beside the point. **The whole island never needs to be in memory.** An
adventure has a 4km reach, so the working set is a box around the walker:

| Tier | Reach | Box | Walkable edges, rough |
|---|---|---|---|
| Trot | 350m | ~0.5 km² | hundreds |
| Stroll | 1km | ~4 km² | low thousands |
| Sidequest | 2km | ~16 km² | thousands |
| Adventure | 4km | ~64 km² | tens of thousands, in a town |

A* over tens of thousands of edges in JavaScript is single digit milliseconds.
Vercel functions allow up to 4GB of memory and long durations, and neither is
close to being the constraint. The graph lives in Postgres, indexed spatially,
and the function pulls the box it needs.

One design note that matters for payload: **store the topology and the geometry
separately.** The A* only needs node ids, costs and attributes, which is a few
bytes an edge. Full linestrings are fetched only for the edges in the chosen
path, once the route is known. Pulling geometry for the whole box and throwing
most of it away is the obvious way to make this slow.

### Three ways to do it, in order of preference

1. **Our own A* in a Vercel function, graph in Postgres.** No extra service, no
   extra bill, scales to zero, and total control of the cost function, which is
   the safety mechanism. What we take on is the graph build: turning OSM ways
   into a topologically correct node and edge table, split at intersections,
   with footpaths connected to roads. That is real work, and it is **offline,
   on a laptop, once**, which is where the heavy lifting belonged all along.
2. **pgRouting.** The same thing inside Postgres. It solves the graph build and
   the search together and would save real effort. **Whether the extension is
   available on Supabase needs checking before this is relied on**, and it is
   the first thing to verify.
3. **Valhalla as a service.** The fallback if the graph build proves nastier
   than expected, or if we later want map matching to snap a recorded GPS track
   to the network for walk records. That is the one capability the first two do
   not give us for free, and it is not needed for v1.

**The recommendation is 1, checking 2 first**, and Valhalla stays in the tree as
the offline tool for building and validating the graph rather than as a
production dependency.

### What this closes

§12 said live assembly needs "one always-on routing service, so it is a new
monthly line item and therefore yours". If assembly runs in a Vercel function
against a graph in Postgres, **that line item disappears** and the decision in
§12 gets easier, because the remaining argument for a pre-built corpus is
purely the review question, which §12 already answers with encoded rules.

---

## 15. The safety brief

Built 3 September 2026, ahead of the routing work, because it gates the walk
rather than depending on it.

Before a walker's first quest, a frame opens with eight points on staying safe
on an Irish boreen: being seen, footwear, weather and light, telling someone,
battery, animals and land, water, and that turning back is finishing. Then one
question, drawn from a pool of five, multi select, and the whole set has to be
right.

**Why a question rather than a tick box.** A tick box records that someone saw
a screen. A question records that they read it. We are sending people onto
unlit roads with no footpath and across land where there is no right to roam,
so the difference is worth the friction exactly once.

Three details that took a second pass:

- **The accept enables on answering, not on answering correctly.** A button
  that only lights up on the right answer never lets a wrong one happen, so it
  can never send anyone back to reread, which is the point of asking.
- **A wrong answer scrolls the brief back to the top.** "Have another read"
  should put the reading in front of them rather than just say the words.
- **A question you can pass by ticking every box is not a question.** The whole
  selected set has to match, and every question carries plausible wrong options
  rather than filler.

The acknowledgement records the version, so a materially changed brief asks
again. It is local for this phase. `recordSafetyAck` belongs on the data source
when accounts are switched on, because "they acknowledged it" is a claim we may
one day have to stand over, and that wants a row rather than a browser.
