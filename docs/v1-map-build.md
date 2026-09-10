# Side Quest: building the real map, v1

Written 3 September 2026. `docs/map-infrastructure.md` says what the pieces
are and why. This says **what order to build them in**, what each step
replaces, and how you know it worked.

The organising rule: **every slice replaces one placeholder with the real
thing, and the app keeps working the whole way through.** No slice ends with a
broken screen, and no slice needs the one after it to be useful.

---

## The thing that has to go first

Right now nothing in the app knows where it is.

```ts
const SPAN_M = 2000;
const toWorld = (n: number) => (n - 0.5) * SPAN_M;
```

That is duplicated in four screens. Every point, quest path, marker and
objective is a pair of numbers between 0 and 1, stretched across an imaginary
two kilometre box. The hex grid is an axial stand-in, not H3. The island
outline is thirty points traced by eye, and its own comment says so.

**None of the real work can land on top of that.** Real points have latitudes.
Real routes follow real ground. Real fog covers real cells. Slice 0 is
therefore not optional and not deferrable, and it ships nothing a user can see,
which is exactly why it is worth naming as its own step rather than letting it
hide inside a bigger one.

---

## The slices

| # | Slice | Replaces | Visible? | Size |
|---|---|---|---|---|
| 0 | ~~Real coordinates~~ **Done** | The 0-1 surface, axial hexes, traced outline | No | M |
| 1 | The basemap on screen | Blank ground under the hexes | Yes, hugely | L |
| 2 | The survey plate style | Default MapLibre styling | Yes | M |
| 3 | Ground types | `surface` as a fixture string | Yes, and in every estimate | S once 1 is done |
| 4 | The points library | 5 fixture points | Yes | L |
| 5 | Routing and assembly | Pre-baked fixture paths | Yes | L |
| 6 | Collecting a point | A `visited` boolean in a fixture | Yes, it is the loop | M |
| 7 | Fog for real | `revealedAt` around the origin | Yes | M |

Sizes are shape, not estimates: S is a sitting, M is a few days, L is a week or
more with a build pipeline in it.

Slices 0 to 3 are the map. Slices 4 to 7 are the product. **They can run in
parallel after slice 0**, because the points pipeline needs no map and the map
needs no points.

---

## Slice 0: real coordinates

**What ships.** One projection, used everywhere. Web Mercator metres, because
that is what tiles are in and it keeps the maths linear.

- A `lib/map/project.ts`: `lngLatToMerc`, `mercToLngLat`, and nothing else.
- `MapCanvas` takes lat/lng and projects internally. Callers stop doing arithmetic.
- Delete `toWorld` and `SPAN_M` from all four screens.
- `lib/map/hex.ts` swaps its axial stand-in for real H3. The public shape
  survives, the internals do not.
- Fixtures gain real coordinates. Quest starts already have them.
- `lib/map/ireland.ts` keeps the traced outline for now, marked as the only
  remaining lie, and dies in slice 1.

**Done when.** The Cloonanaha fixture renders at 52.941, -9.226 and a
`distanceM` between two fixture points matches what a map ruler says.

**Why first.** Everything below assumes it.

### Done, 3 September 2026

Shipped as specified, plus four things the slice turned up.

- **`lib/map/project.ts`** is the one projection. Web Mercator, y south.
  `SPAN_M` and `toWorld` are gone from all four screens.
- **`lib/map/hex.ts` is real H3**, on `h3-js` (Apache-2.0). Resolutions 10 to 5,
  76m to 9.9km edges. Cell boundaries are projected once and cached, because a
  pan re-uses almost every cell it had last frame and six corners each is a
  logarithm and an arctangent apiece. A coarse cell's majority test now uses
  H3's own children rather than seven sampled points.
- **The reveal radius is honest ground metres again.** It had been silently
  shrunk by a third: Mercator over-reads the ground by 1.66 at Ireland's
  latitude, and the old grid was sized in the projected units without correcting
  for it.
- **`MapCanvas` gained `fit`.** Real coordinates mean the view can be computed
  rather than guessed, so the call sites dropped their magic zoom numbers. A
  caller should not have to know a 2.8km loop wants a scale of 0.26.
- **The app opens at Corofin, not Ennistymon.** The fixture points are Dysert,
  Inchiquin, Toonagh and Cahercalla, which cluster round Corofin. Opening
  fifteen kilometres west of all of them showed an empty map, which the fake
  coordinate space had hidden.
- **Tests exist**, on Node's own runner with no new dependency, wired into CI.
  `docs/audit.md` X-07 named these three files first and it was right: the
  fixture tests found three real bugs the moment they ran. A route that drew
  1200m while printing 1080m beside it, a loop that ended 78m from its own
  start, and a waypoint sitting ten kilometres off the quest that visits it.
  All three were invisible while the coordinates were made up.
- **Inside `lib/`, sibling imports are relative and carry their extension.**
  The `@/` alias needs a bundler; these are the pure modules the test runner
  loads directly.

---

## Slice 1: the basemap on screen

**The decision inside this slice, and it is the biggest in the document: does
the canvas survive?**

Three options.

1. **MapLibre renders everything.** Ground from PMTiles, fog as a fill layer of
   H3 polygons, markers as symbol layers, the trail as a line layer.
2. **MapLibre for ground, our canvas overlaid** for fog and markers.
3. **Keep the canvas and render vector ground ourselves.**

**Recommendation: 1.** Option 2 means two engines sharing one camera, and
keeping them in sync through pinch, rotate and inertia is a class of bug that
never fully closes. Option 3 is writing a renderer, including label collision,
which is months and is the part of a map engine that is genuinely hard.

The cost of 1 is real and worth stating plainly: **the current `MapCanvas` is
544 lines of working, good code and most of it goes.** What survives is the
design decisions inside it, which is the part that matters. The hex fade
behaviour, the marker glyphs, the compass and recentre, the layer toggles that
fade rather than blink: all of those are specifications now, and they are
reimplemented as MapLibre layers and controls rather than thrown away.

What MapLibre gives back, that the canvas will not do without months of work:
continuous zoom across fourteen levels, tile loading and eviction, label
placement with collision, and GPU rendering of thousands of features.

**What ships.**

- Planetiler build script in the repo. Run twice, full and trimmed, **measure
  both**. This is the number section 8 of the infrastructure doc waits on.
- The PMTiles archive in Supabase Storage.
- `maplibre-gl` and `pmtiles` added, `MapCanvas` becomes `MapView`.
- The fog, trail and markers reimplemented as layers.

**Done when.** You can pan from Ennistymon to the Burren and the ground is
real, the fog still covers what it covered, and the compass still works.

### Done, 8 September 2026, with the ground still missing

Option 1 was taken. `MapCanvas` is gone and `components/map/MapView.tsx`
replaces it: MapLibre GL JS 6.8 under a style built in code from the design
tokens, so `--map-paper` still governs the map the way it governs everything
else. The fog is an H3 fill layer, the trail is two line layers so the walked
half is solid and the rest dashed, the markers stay DOM elements positioned by
`map.project` on every camera move, and the compass, recentre and layer
toggles behave as they did.

**What is not in it: the detailed ground.** The Planetiler build and the
PMTiles archive were not run, because every tile host reachable from this
machine is blocked by the egress proxy, so nothing served over the network
could be verified rather than assumed. `NEXT_PUBLIC_BASEMAP_URL` is therefore
unset by default and the vector source is only added when it is set. In its
place the repo ships `public/geo/ireland.geojson`, a 23kB coastline at a
kilometre, cut by `scripts/build-coastline.mjs` from a public-domain OSM
derivative. It is drawn as sea underneath and land on top, not the other way
round: with paper under a translucent land fill the coast was a scribble
across two identical tones, and an estuary has to read as an estuary. A
kilometre is true enough to navigate a bay by and not true enough to walk a
headland by, which is exactly the gap slice 2 closes.

Two things worth knowing before touching this again.

- **The worker cannot be left to the bundler.** It resolved to the page
  itself, and every GeoJSON source then hung forever with no error and no
  `load` event, including inline ones. `setWorkerUrl` points at a copy that
  `scripts/copy-maplibre-worker.mjs` places in `public/vendor/maplibre/` on
  `predev` and `prebuild`.
- **MapLibre serves 512px tiles, not 256.** The first resolution ladder was a
  power of two out because of it. `resForMetresPerPixel` now takes ground
  metres per pixel and `metresPerPixel(zoom, lat)` derives it, so the
  conversion lives in one place with a test around it.

**Still open from this slice.** The Planetiler run and the two measurements
section 8 of the infrastructure doc waits on, both of which need a machine
that can reach the network.

### Amended, 8 September 2026: the ground arrived after all

The detailed ground is wired, against OpenFreeMap. It is OpenStreetMap data
served with no API key, no account and no usage meter, which is the only
reason it could be switched on without asking anyone to sign up for
anything. `NEXT_PUBLIC_BASEMAP_URL` overrides it and `off` disables it.

The layers are written here rather than taken from the vendor's stylesheet,
so the ground arrives in the app's palette: water, waterway, landcover, park,
landuse, building, and transportation split so a footpath is drawn as heavily
as a minor road and dashed, while a dual carriageway is present and quiet. A
walking app is not a driving app.

**What is verified and what is not.** The tile URL, the glyph endpoint, the
`Noto Sans Regular` fontstack and all eight `source-layer` names were checked
against OpenFreeMap's own production style and the OpenMapTiles schema they
generate with. The whole style is validated against the MapLibre style
specification by `test/style.test.ts`, which catches a bad filter or paint
property as a red test rather than as a blank rectangle. What could not be
checked is whether the tiles arrive: every tile host is blocked from the
machine this was written on. That is one look on a real device.

**Two things to raise before this is a launch decision.** OpenFreeMap is
donation funded and offers no availability guarantee, so it is a way to walk
the app now, not the thing to ship on; our own PMTiles archive is still the
plan. And OpenStreetMap is ODbL, so attribution is a licence condition: the
attribution control is on whenever a basemap is configured and must stay on.

The fallback was also fixed while wiring this. Configuring a basemap is not
the same as reaching one, and the first cut dropped the committed coastline
the moment a URL was set, which answers a dead network with an empty blue
rectangle. The coastline fill now always paints and the tiles draw over it.

### Standing ground, 10 September 2026

The fog has three states rather than two. The cell you are standing in is
clear, the six touching it are half lit, and everything else is closed. A fog
that starts fully shut tells you nothing about whether a walk is worth taking,
and a walking app that will not show you your own street is no use for judging
one.

This replaced a 900m "revealed" radius that was drawing a circle of ground
nobody had walked. That was placeholder data pretending to be exploration,
which is the thing `CLAUDE.md` rules out, and it was also large enough to
swallow the halo entirely.

Two decisions inside it worth knowing. The halo is cells of the drawing
resolution rather than a fixed one, so it lines up with the fog around it
instead of laying a second grid over the first. And it switches off below
`RES_ORIENT` (res 9, cells about 400m across), because coarser than that "the
cell you are standing in" is kilometres wide, so lighting it would clear half
a county as a reward for pinching out.

**Open.** The half lit tone was tuned against the coastline fallback rather
than against real ground, because the tiles cannot be reached from here. Over
paper it is subtle; over roads and buildings it should be obvious. Worth a
look on a device before deciding it is right.

---

## Slice 2: the survey plate style

"Correct map presentation" is a stylesheet, and it is its own slice because it
is taste work that should not be rushed inside slice 1.

A MapLibre style is JSON: a list of layers, each a filter over the tile data
plus paint. The house style, layer by layer, from `docs/design-system.md` §E:

| Layer | Source | Treatment |
|---|---|---|
| Paper | background | `--map-paper`, flat |
| Sea and lakes | water | Hairline outline, no fill, or the lightest hatch |
| Coastline | water boundary | The heaviest line on the map |
| Contours | LiDAR, slice 3 | Hairline, every 10m, heavier every 50m |
| Woodland | landuse | Stipple, not fill |
| Boreens and paths | highway, by surface | See slice 3 |
| Roads | highway | Thin, restrained: they orient, they are not the subject |
| Buildings | building | Only above z15, outline only |
| Townlands | our own layer | Dashed, `--rule` |
| Labels | place | Archivo for names, JetBrains Mono for anything numeric |

**Two rules the style has to hold**, both already in the design system and both
easy to lose in a tile style: every number is mono, and nothing is filled with
colour that could be a hairline instead.

**Done when.** A screenshot of the Burren at z14 sits next to a real Ordnance
Survey plate and reads as the same family.

---

## Slice 3: ground types

Ground type is not decoration. It shows up in three places and they must agree.

1. **Routing cost.** A `sac_scale=demanding` path is not a stroll. This is the
   costing function from infrastructure §12, and it is where safety lives: a
   `highway=primary` with no `sidewalk` is not routable at all.
2. **The duration estimate.** `lib/walking.ts` already has surface factors,
   made 1.0, unpaved 0.9, rough 0.78, and 6 seconds per metre of ascent. Today
   `surface` is a fixture string. It becomes the real dominant surface of the
   real route.
3. **The line on the map.** A boreen, a field path and a road should not look
   alike, because the walker is deciding what to wear.

**Where it comes from.** OSM tags, in priority order: `highway`, `surface`,
`tracktype`, `smoothness`, `sac_scale`, `trail_visibility`. Ascent comes from
the national LiDAR on data.gov.ie, which also gives the contour layer in slice
2 and means we never buy elevation data.

**The honest bit.** OSM surface tagging in rural Ireland is patchy. Where a way
has no `surface` tag we infer from `highway` and mark the estimate as inferred
rather than known, and the honesty list on the quest says so. That is
`docs/ux-loops.md` §D-2 doing its job: **never suppressed to make a quest look
better.**

**Done when.** Walking `estimateDurationS` over a real route with real surfaces
lands within a few minutes of a walk actually taken.

---

## Slice 4: the points library

The pipeline in `docs/data-pipeline.md`, passes 0 to 8, into Postgres.

**Build tactic, not a scope reduction.** Run the whole pipeline on Clare first.
It is a few thousand points instead of thirty-five thousand, every pass is
inspectable by eye, and the fixtures already live there so the comparison is
direct. Then run it nationally, which is the same scripts with a bigger extract.
Ireland wide is the target and this is how you get there without debugging at
national scale.

**Schema.** `points`, `lore`, `point_sources`, with PostGIS geometry and a GiST
index. Lore is a separate table because it is fetched on unlock, not with the
index.

**The gates before it publishes**, all already specified: reachability, so we
never send someone to a monument in the middle of a private field; visibility,
so a point is something you can actually see; chain exclusion, because no
chains is a hard rule; licence, because Dúchas cannot be embedded.

**Done when.** `getPointsNearby` returns real rows through the existing
interface and no screen changes. That is the seam earning its keep.

---

## Slice 5: routing and assembly

Per infrastructure §12 and §14.

**Offline, once:** build the walking graph from the OSM extract. Nodes, edges,
length, ascent, surface, safety class. Split at intersections, connect
footpaths to roads. This is the real work of the slice.

**Check pgRouting first.** If it is available on Supabase, the graph build and
the search come together and much of this disappears. It is the cheapest
question to ask and the most expensive to skip.

**At request time:** query the box, A* over it, validate against the safety
rules, cache on rounded position and tier.

**Done when.** A quest generated at a random Clare address routes over real
boreens, its duration estimate is honest, and its honesty list names what it
actually crosses.

---

## Slice 6: collecting a point

This is the loop, and today it is a boolean in a fixture. `docs/audit.md` L-05.

- `useLiveLocation` into the walk screen. It exists and is wired to nothing,
  and it already guards non-finite coordinates, which is a real iOS bug.
- Arrival is entering the point's H3 cell, not a radius. Cells are what the fog
  is made of and one rule is better than two.
- On arrival: unlock the point, write the row, reveal the tale, update progress.
- On finish: write the walk record, the badges, the tales opened.

**Watch the battery.** A three hour walk with `watchPosition` on high accuracy
is the single biggest power draw the app will ever have. Distance-filtered
updates, and back off when nothing is near.

**Done when.** You can walk a real quest in Clare and it notices.

---

## Slice 7: fog for real

`docs/fog-of-war.md` has the architecture. Today `revealedAt` clears a radius
around the origin.

Real version: the position watch writes H3 cells, they persist per user, the
map renders them as a fill layer, and the roll-up to coarser cells at low zoom
already has its rule, majority revealed.

**Done when.** Two walks in the same townland leave a shape you recognise.

---

## What survives from today

Worth saying, because it is more than it looks.

**Survives untouched:** the data-layer seam, every screen, the design system,
the shell, the safety brief, the start gate, `lib/walking.ts`, `lib/geo.ts`,
`lib/maps.ts`.

**Survives as a specification:** everything `MapCanvas` decided about how the
map should behave. The code changes, the decisions do not.

**Dies:** `SPAN_M` and `toWorld`, the axial hex maths, the traced island
outline, and the fixture `visited` and `reached` booleans.

That is the reface earning back its cost. The whole app was built against an
interface rather than against a map, so replacing the map does not touch the
app.

---

## Where I would expect trouble

1. **The graph build.** Turning OSM ways into a topologically correct walking
   graph is the least glamorous and most error-prone thing in this document.
   Footpaths that do not quite meet roads, ways split across tiles, access tags
   that mean different things in different counties.
2. **Surface tagging coverage.** Slice 3 will be less complete than it looks in
   a demo. Plan for inference and be honest in the UI about which it is.
3. **The style.** Slice 2 is taste work and taste work expands. Timebox it,
   ship something coherent, refine later.
4. **Battery in slice 6.** Easy to get working, hard to get frugal, and the
   difference decides whether anyone finishes an adventure.
5. **Losing the canvas in slice 1.** The current map feels good. It will feel
   worse for a while after MapLibre lands and before slice 2 is done. That is
   the trough, it is expected, and it is not a reason to turn back.

---

## If you want one week to count

Slice 0, then measure the Planetiler build. That unblocks everything, breaks
nothing, and turns the biggest unknown in the plan into a number.
