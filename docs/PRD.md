# Side Quest — Product Requirements Document

| | |
|---|---|
| **Version** | 0.1 (draft for review) |
| **Date** | 2026-08-31 |
| **Owner** | Josh |
| **Status** | Proposed — supersedes the pin-and-word-bank concept currently in the repo |
| **Related** | [`repo-review.md`](./repo-review.md) · [`fog-of-war.md`](./fog-of-war.md) · [`../TODO.md`](../TODO.md) |

> **Scope note.** This document deliberately carries **minimal visual design
> detail**. The aesthetic is being re-opened (see `repo-review.md` §6), so
> everything here is product logic, data, and architecture. Where UI is
> described it is described as *behaviour and information*, not as pixels.

---

## 1. Summary

Side Quest turns a walk into a generated adventure. A signed-in user shares
their location, sees their country rendered as a stylised map, picks a
starting point, and receives a **sidequest**: a walking route with a small
number of **objectives** anchored to real, interesting places — a castle
ruin, a holy well, a river crossing, a viewpoint, a stretch of ancient
woodland.

Walking the route reveals map territory permanently (fog of war), advances
category-based progression ("visit 5 castles", "complete 3 forest quests"),
and writes a permanent entry into the user's history. Users can save
sidequests into **collections** — curated sets like *"Castle ruins by
rivers"* with 8 quests across Ireland — and keep them private, share them by
link, or publish them.

The product's job is to make going outside feel like opening a map in a game.

---

## 2. Problem & opportunity

Walking apps split into two camps and both miss:

- **Fitness trackers** (Strava, Health) measure the walk. They have no
  answer to *"where should I go and why would I care?"*
- **Route libraries** (AllTrails, Komoot) are excellent for planned
  day-hikes but assume you already want a specific named trail, are
  willing to drive to it, and are motivated by the outdoors itself.

The gap is the **unplanned local hour**. Someone with 45 free minutes and no
particular destination. There is no product that says *"here is a 3.2 km
loop from your door that passes a 12th-century church wall, a river bend,
and a viewpoint — go."* and then rewards them for it.

The mechanic that makes this compelling already exists and is proven — it's
the open-world video game map: fog of war, discoverable landmarks,
collectible categories, completion percentages. Nobody has properly bolted
it to real-world walking with real-world points of interest.

---

## 3. Goals and non-goals

### Goals

| # | Goal | How we'll know |
|---|---|---|
| G1 | A user can go from cold start to walking a generated sidequest in under 90 seconds | Time-to-first-quest metric, p50 < 90s |
| G2 | Generated quests feel *chosen*, not random | ≥60% of generated quests are started (not rerolled/abandoned at preview) |
| G3 | Walking feels rewarding without gimmicks | ≥40% of users who complete one quest complete a second within 14 days |
| G4 | Progression gives a reason to come back | ≥25% of active users have made progress on ≥2 categories |
| G5 | Marginal cost per active user stays negligible | < £0.05 / MAU in map + routing + POI cost at 10k MAU |
| G6 | The map is the product's identity, not a commodity embed | Qualitative; the map must be visually ours, not stock Mapbox |

### Non-goals (explicitly out of scope for v1)

- Turn-by-turn voice navigation.
- Fitness metrics — pace, heart rate, calories, health-app integrations.
- A social feed, following, comments, or likes. (Sharing a collection by
  link is *not* a social graph.)
- Multi-day routes, driving, cycling, public transport legs.
- Global coverage. v1 ships **one country properly** rather than everywhere
  badly. (See §8.3.)
- Native iOS/Android apps. PWA only — with the background-location caveat
  documented in §11.8.
- Photo/computer-vision verification of objectives.
- Monetisation.

---

## 4. Users

We are not doing personas theatre. Three real usage shapes:

**The 45-minute local.** Lives in a town or city, walks for headspace, has
walked the same three routes for two years. Wants a reason to turn left
instead of right. Highest-frequency user. Cares about: variety, short
distances, not needing to drive anywhere.

**The weekend explorer.** Will drive 20 minutes to a start point. Wants a
2–3 hour loop with something genuinely worth seeing. Cares about: quality
of the landmark, terrain honesty, being able to save and re-walk.

**The completionist.** Motivated primarily by the meta-layer — the tile
count, the category progress, the fog map. Will construct trips around
"there are 3 castles left in this county". Lowest volume, highest retention,
and the user who makes collections worth building.

All three need the same core loop. The completionist is why the progression
system is v1, not v2.

---

## 5. Product principles

1. **The map is the home screen.** Not a list, not a feed. Everything is
   spatial.
2. **Never show an empty map.** Fog, tiles, and undiscovered pins mean the
   map always has something to want.
3. **Generation is a proposal, not a command.** Reroll must always be one
   tap away and must feel free.
4. **Honest about the ground.** If a route uses an unpaved path, a road with
   no pavement, or a stile, say so before the user leaves. Trust is the
   whole product.
5. **Reward the walk, not the phone.** No mechanic should require the user
   to stare at the screen while walking.
6. **Progress is permanent.** Nothing decays, nothing expires, no streak
   punishes you for a bad week.
7. **The user's track is not our data.** We store the tiles you unlocked,
   not the path you took. (See §13.)

---

## 6. Concepts and vocabulary

Fixing these words now; they are used consistently in code, schema, and UI.

| Term | Definition |
|---|---|
| **Location** | A user-chosen start point (lat/lng). Either "my current location" or a pin dropped on the map. Users may save named locations ("home", "mum's"). |
| **Sidequest** | A generated, self-contained walking adventure: a start point, a routed loop, and 1–4 objectives. The atomic unit of the product. |
| **Objective** | One thing to do or reach within a sidequest. In v1 always *"reach this place"*, optionally with a flavour prompt. Anchored to a POI or a route waypoint. |
| **POI / Landmark** | A real-world place from our curated dataset, with a category, geometry, and metadata. |
| **Category** | The taxonomy slot a POI occupies — `castle`, `holy_well`, `viewpoint`, `ancient_woodland`… Progression is defined over categories. (§9) |
| **Trail** | The rendered vector line of the sidequest's route. Out-leg and return-leg are visually distinct. |
| **Run** | A single attempt at a sidequest by a user. Has status `active` / `completed` / `abandoned`. Sidequests can be re-run; runs are the history rows. |
| **Tile** | An H3 hexagonal cell. The atomic unit of explored territory. (§11.5) |
| **Territory** | The set of tiles a user has unlocked. Drives fog of war and the "X tiles" stat. |
| **Collection** | A user-curated, ordered set of sidequests with a title and description. Private, unlisted (link), or public. |

Note the **sidequest / run** split. It is the single most important modelling
decision in this document: it is what makes a sidequest *shareable* and
*collectable*. A sidequest is a durable artefact that exists independently of
anyone walking it.

---

## 7. The core loop

```
        ┌──────────────────────────────────────────────┐
        │                                              │
        ▼                                              │
   Open map  ──▶  Choose location  ──▶  Generate  ──▶  Preview
   (country,      (GPS or pin)         (server)       (route + objectives
    fog, pins)                                         + distance/time)
                                          ▲                 │
                                          │                 │
                                       Reroll ◀─────────────┤
                                                            ▼
                                                          Start
                                                            │
                                                            ▼
                                              Walk  ──▶  Objectives complete
                                              (tiles reveal live)
                                                            │
                                                            ▼
                                        Finish: new tiles, XP, category
                                        progress, unlocks, history entry
                                                            │
                                                            ▼
                                            Save to collection? Share?
```

**The loop must close in one session.** Every step from "open map" to
"finish" is designed to be completable in a single outing with no prior
setup.

---

## 8. Feature specification

### 8.1 Accounts and profiles

Supabase Auth. Already substantially built (see `repo-review.md` §3).

**v1 requirements**

- Email + password sign-up with a display name captured at signup.
- Magic-link sign-in as the primary path (fewer passwords, better mobile).
- OAuth: Google and Apple. Apple is required if we ever wrap for iOS.
- Email verification enforced before app access. *Currently not enforced —
  gap.*
- Password reset flow. *Currently missing — gap.*
- Profile row auto-created by trigger (built).
- Account deletion: hard-delete cascade across all user tables, exposed in
  settings. GDPR requirement, not optional.
- Data export: JSON of runs, collections, and territory on request.

**Profile fields**

`display_name`, `avatar_url` (nullable), `home_country` (ISO 3166-1 alpha-2),
`unit_system` (`metric` | `imperial`), `created_at`.

**Anonymous / guest mode:** *rejected for v1.* Territory, progression, and
collections all require identity. A guest can see the landing page and
nothing else. Reconsider if signup drop-off exceeds 50%.

### 8.2 Location capture and permission

The permission prompt is the single highest-risk moment in the funnel. A
denied prompt is effectively unrecoverable on mobile Safari without the user
digging through Settings.

**Rules**

1. **Never** call `getCurrentPosition` or `watchPosition` on page load.
2. Show a **priming screen** first: one screen, plain language — what we
   use location for, that we store tiles and not tracks, and a single
   "Enable location" button. Only that button triggers the browser prompt.
3. Offer an explicit alternative on the same screen: **"Pick a place on the
   map instead."** This is the escape hatch for users who will never grant
   permission and it must be first-class, not a consolation prize.
4. If permission is `denied`, detect it (`navigator.permissions.query`) and
   show recovery instructions specific to the platform, plus the pin-drop
   path.
5. **Accuracy gate.** Reject fixes with `accuracy > 100m` for quest
   generation and tell the user we're still getting a fix. A 2 km-accurate
   fix generating a quest from the wrong side of town is a trust-killer.
6. Store `last_location` (lat/lng + timestamp + accuracy) on the user's
   settings row so a returning user's map opens where they were, before any
   prompt fires.

**Live tracking during a run** uses `watchPosition` with
`enableHighAccuracy: true`. Existing `useLiveLocation` hook already guards
non-finite coordinates — keep that, add the jitter filter from
`fog-of-war.md`.

**PWA install prompt:** offered after the first *completed* run, never
before. Capture `beforeinstallprompt`; on iOS show manual "Add to Home
Screen" instructions since the event doesn't fire.

### 8.3 The country lock

The map is bounded to a single country. This is a product decision, not a
technical limitation, and it does three things: it makes the map feel like a
game board rather than an infinite canvas; it caps our POI ingestion and tile
cost to one country at a time; and it gives progression a denominator
("you've explored 0.4% of Ireland").

**Behaviour**

- On first location fix, reverse-resolve the point to a country using a
  local PostGIS `countries` table (Natural Earth admin-0, public domain).
  No third-party geocoding call.
- Store as `profiles.home_country`.
- Map camera `maxBounds` is set to the country's bounding box, with the
  country polygon rendered as the "land" and everything outside it rendered
  as inert out-of-bounds texture.
- If a later fix lands in a different country, offer to switch — do not
  switch silently. Territory and progression are scoped per country, so
  switching is a visible change of context, not a settings toggle.
- **v1 launch country: Ireland (IE).** Rationale: manageable POI volume,
  outstanding density of exactly the landmark categories we care about
  (ruins, holy wells, ring forts, ancient woodland), a single OSM extract
  under 200 MB, and it is where the first users are.
- **Country rollout is a data operation, not a code change.** Adding GB or
  FR is: ingest the extract, generate the tileset, done.

### 8.4 The map

**v1 requirements**

- 2D vector basemap in a custom style. Ours, not a stock style. Labels
  minimal or absent.
- The country polygon is the visual "board". Outside it: out-of-bounds
  treatment.
- Fog-of-war overlay drawn above the basemap, below the trail.
- Pins for: current location, the active sidequest's objectives,
  discovered POIs, undiscovered-but-hinted POIs.
- The active trail as a vector line.
- Camera: pitch and bearing enabled; 3D building extrusions and terrain
  are **v1.5**, gated behind a device-capability + performance check.
- No third-party attribution chrome we don't control — attribution is
  required by licence and will be present, but styled to fit.

**Interaction surfaces** (behaviour only; visual design deferred)

- **Popovers** — tapping a pin opens a lightweight anchored panel: name,
  category, one-line description, distance, and the primary action.
- **Modals** — reserved for decisions: quest preview, end-run confirmation,
  permission priming, collection save.
- **Tooltips** — custom, not native `title`. Used on map controls and
  progression badges. Must be tap-friendly, not hover-only.

All three are a **single shared overlay primitive** with three presentation
modes, so focus trapping, dismiss behaviour, safe-area insets, and
reduced-motion are solved once. This is called out because getting this wrong
produces three subtly inconsistent implementations, which is the most common
way "clean UI popovers and modals" fails in practice.

### 8.5 Sidequest generation

The heart of the product. **Runs server-side** — always. Reasons: routing
and POI credentials stay secret; the generated quest is a durable database
record that can be shared and re-run; and generation logic can change
without shipping a client.

**Input**

```
{ origin: {lat, lng}, target_distance_m, difficulty, categories?, seed? }
```

**v1 algorithm (procedural, deterministic given a seed)**

1. **Candidate search.** Query the POI table for landmarks within an
   annulus around the origin — inner radius `0.25 × target/2`, outer radius
   `0.45 × target/2` — so the anchor POI sits roughly at the far point of a
   loop rather than next door. PostGIS `ST_DWithin` on a GiST index.
2. **Score candidates.** Weighted by: category rarity, whether the user has
   already visited it (heavily penalised but not excluded — revisits are
   allowed, just deprioritised), POI quality score, and how much *new
   territory* the route to it would unlock. That last term is what makes
   the fog and the generator reinforce each other.
3. **Pick an anchor** — weighted random from the top N, so it is neither
   deterministic-boring nor uniformly-random-bad.
4. **Route a loop.** Request a pedestrian route origin → anchor → origin,
   with a return leg forced through a different corridor (a perpendicular
   offset waypoint — the existing `midpointWaypoints` in `lib/geo.ts` is
   exactly this and is worth keeping). Reject and retry if actual distance
   deviates > 35% from target.
5. **Add secondary objectives.** Any POI within ~150 m of the routed
   polyline becomes a candidate secondary objective. Cap at 3 total.
6. **Compose.** Title, flavour text, difficulty, estimated duration
   (terrain-adjusted, not a flat 5 km/h), and the category tags that this
   quest will count toward.
7. **Persist** the sidequest row and return it.

**Failure modes and fallbacks** — these are requirements, not edge cases:

| Situation | Behaviour |
|---|---|
| No POIs in range (rural, sparse data) | Fall back to a **shape quest**: a scenic loop scored on path quality and new-territory gain, with route-feature objectives ("cross the river", "reach the high point") instead of named landmarks. Never fail to generate. |
| Router returns nothing | Retry once with a wider corridor, then fall back to the shape quest. Never return a straight line to the user as if it were a route. |
| Origin is not walkable (motorway, water, private) | Snap to the nearest walkable node within 250 m; if none, tell the user plainly and ask them to move the pin. |
| All nearby POIs already visited | Allow revisits, mark the quest as a revisit, reduce XP but do not block. |

**Reroll** re-runs generation with a new seed and an exclusion list of the
previously offered anchors. Free, unlimited, instant-feeling (target < 1.5 s
p95). Reroll counts are logged — a high reroll rate is our clearest signal
that generation quality is bad.

**v2: LLM narrative layer.** The structured plan stays procedural; an LLM
writes the title, flavour, and objective prompts over it. This ordering is
deliberate — the model never chooses where you walk, only how it's
described. Cached per sidequest so it's a one-time cost per generated quest.

### 8.6 The trail

- Rendered as a vector line on the map (a GeoJSON source + line layers), not
  a raster overlay.
- Out-leg and return-leg visually distinguished.
- Walked portion vs remaining portion visually distinguished, updated live
  by nearest-point-on-line projection of the user's position.
- The stored polyline is simplified (Douglas–Peucker, ~5 m tolerance) before
  persisting. Full-resolution routes are 10–50× larger for no visible gain.
- Encoded as a polyline string, not a JSON array of pairs. *The current
  schema stores `jsonb` arrays of `[lat,lng]` — this should change (see
  §10 note).*

### 8.7 Running a sidequest

- One active run per user, enforced at the database level (the existing
  partial unique index is the right pattern — carry it forward).
- The run screen shows: distance covered / remaining, elapsed time, the
  next objective, and a live position dot. Nothing else.
- Tiles reveal live as the user walks, written locally first (see §8.10).
- Works with the screen off *for tile capture only if the PWA is
  foregrounded* — see the honest constraint in §11.8.
- Pause, resume, abandon. Abandoning keeps the tiles already unlocked. We
  never take territory away.
- Offline: a started run must survive loss of connectivity end to end. The
  route, objectives, and POI metadata are cached at start. Sync on
  reconnect.

### 8.8 Objective verification

**v1: geofence proximity, verified server-side.**

- An objective completes when the user is within its `completion_radius_m`
  (default 40 m, per-POI override for large sites) for ≥15 continuous
  seconds.
- The client detects it and shows the reward immediately; the client also
  submits the fix and the server independently re-checks the distance before
  writing progress. Client-authoritative completion is not acceptable for
  anything that feeds a public leaderboard or a shared collection's
  completion count.
- Plausibility check: a run whose implied speed exceeds walking/running
  bounds is flagged, and flagged runs don't count toward category
  progression. Flag, don't block — GPS is noisy and false accusations are
  worse than a few cheated castles.

**Deferred:** photo capture, CV classification, QR/NFC. Photos are a
*journal* feature (optional, user-initiated) not a *verification* feature.

### 8.9 Completion and history

On finishing a run:

1. Sync new tiles, get back the count of genuinely new ones.
2. Award XP: base + per-objective + new-territory bonus + first-visit
   category bonus.
3. Evaluate unlocks (§8.11) and surface any that fired.
4. Write the run row: sidequest reference, timings, distance, simplified
   polyline, objectives completed, tiles gained.
5. Offer: save to a collection, share, or start another.

**History** is a chronological list of runs, each opening to a detail view
with a small map of the route, the objectives, the stats, and any photos the
user chose to attach. Filterable by category. Searchable by title and place
name.

### 8.10 Territory and fog of war

The architecture is already worked out in [`fog-of-war.md`](./fog-of-war.md)
and this PRD adopts it wholesale. Summary of what's binding:

- **Representation:** H3 hexagonal cells. Not lat/lng circles. Rationale in
  §11.5.
- **Canonical resolution:** H3 **res 11** (~2,150 m², ~50 m across).
- **Source of truth:** hybrid. Client (IndexedDB) owns the set during a
  walk for instant reveal and offline capability; server is authoritative
  across devices; delta sync at end-of-run and hydration at app load.
- **Privacy:** we store cells, never raw tracks, in the territory table.
  A cell set cannot be replayed as a route and does not reveal speed,
  direction, or dwell time.
- **Reveal radius:** cells within ~40 m of a GPS fix are unlocked, after a
  max-jump jitter filter (~30 m/sample at walking pace).

**Additions this PRD makes to that document:**

- **Territory is scoped per country.** The tile count, percentage, and fog
  render are all per-country. A `country` column on the territory table (or
  derived from the cell's parent) keeps this cheap.
- **Coarser statistics are derived, not stored.** Region and county-level
  progress uses `h3.cellToParent(cell, 8)` (~0.74 km²) computed on read or
  in a materialised view. We never store the same territory twice.
- **Compaction path (v1.5).** The naive one-row-per-cell table is correct
  and fine for launch — a 5 km walk unlocks roughly 200 res-11 cells, so
  even 200 walks is ~40k rows per user. When that becomes a problem, the
  migration is: one row per res-8 parent carrying a 343-bit child bitmap
  (44 bytes covering 0.74 km²), which collapses a heavy user's territory to
  a few hundred rows. Design the sync RPC now so this swap is invisible to
  clients.
- **Fog renders on:** the main map (yes), the history detail hero map
  (yes), per-run thumbnails (no — too small to read).

### 8.11 Progression, categories, and unlocks

Three parallel systems. They must be independent so one can be tuned without
disturbing the others.

**1. Level (XP).** A single number that only goes up. Cosmetic. Its job is
to make every action feel acknowledged.

**2. Category progress.** For each landmark category (§9), the count of
distinct POIs of that category the user has reached. This is the
completionist's spine: *"Castles: 3 of 47 in Ireland"*. Denominators come
from our POI table and are therefore honest and country-scoped.

**3. Territory.** Tiles unlocked, km² revealed, percentage of country.

**Unlocks** are declarative rows in a table, not code. Each has a type, a
threshold, and a reward:

| Type | Example condition | Reward |
|---|---|---|
| `category_count` | Reach 5 distinct `castle` POIs | Badge, title |
| `category_sweep` | Reach every `holy_well` in a county | Badge, high XP |
| `quest_count` | Complete 3 quests tagged `forest` | Badge |
| `territory` | Unlock 1,000 tiles | Badge, map style variant |
| `distance` | 100 km walked | Badge |
| `collection` | Complete every quest in a collection | Badge, collection marked complete |

Evaluated server-side after each run against a rules table. New unlocks ship
as data, not deploys. Retroactive evaluation on rule insert is required —
a user who already has 5 castles gets the badge when we add it.

**No streaks. No decay. No expiry.** Principle 6.

### 8.12 Collections and sharing

A collection is an ordered set of sidequests with a title, description, and
visibility. The example from the brief — *"Castle ruins by rivers", 8
sidequests in Ireland* — is the canonical case and the system must serve it
exactly.

**Requirements**

- Create a collection from scratch or from a completed run ("save this
  quest to…").
- Add any sidequest you can see: your own generated ones, or one from a
  public collection.
- Order matters and is user-controlled.
- Visibility: `private` (default), `unlisted` (anyone with the link),
  `public` (discoverable).
- A public collection has a stable slug URL, is server-rendered with proper
  metadata for link previews, and is viewable **without an account** — with
  a sign-up prompt to actually walk it.
- Following/walking someone else's collection creates *your own runs*
  against *their* sidequests. Their collection is not modified.
- Completion state is per-viewer: "you've walked 3 of 8".
- Report / takedown path for public collections. Non-negotiable the moment
  anything is public — a public collection is user-generated content
  pointing at physical locations, and that needs a moderation lever.

**Not in v1:** collection forking, collaborative editing, comments, ratings,
a discovery browse/search surface. Public collections in v1 are shared by
link and by us featuring them, nothing more.

### 8.13 Notifications

Deferred past v1. When it lands: opt-in only, one category ("a new quest is
waiting near you"), frequency-capped, and never streak-nagging (principle 6).
Web Push works on Android and on installed iOS PWAs; treat coverage as
partial.

### 8.14 Admin: media generation

**Deferred — tracked in `TODO.md`, not built in v1.** Recorded here so the
security model is decided before anyone writes the first line.

- Route: `/admin`, and `/admin/media` for generation.
- **Access is a database property, not a route guard.** An `is_admin`
  boolean on `profiles` (or a separate `admin_users` table), defaulting to
  false, writable only via the service role — never by the user.
- Enforcement in three places, all required: proxy/middleware redirect,
  a server-side check in every admin route handler and server action, and
  RLS policies on admin-only tables. Middleware alone is not access control.
- **Restricted to Josh's account only.** Seeded by a migration keyed to the
  account's user id.
- Purpose: generating and managing map/illustration/POI media assets —
  batch generation, review, approve/reject, publish to Supabase Storage,
  attach to POI or category records.
- All admin actions written to an append-only `admin_audit` table.
- Generation is expensive and rate-limited; the queue is server-side with
  hard per-day caps so a bug can't run up a bill.

---

## 9. Landmark taxonomy

The taxonomy is the spine of progression, which means it **cannot be
deferred to v2**. "Discover X castles" is a v1 feature, and it requires
categorised POI data at v1.

Two levels: **group** (what the UI shows) and **category** (what we count).
Each category maps to one or more OSM tag combinations.

| Group | Categories | Representative OSM tags |
|---|---|---|
| **Fortified** | `castle`, `castle_ruin`, `tower_house`, `ringfort`, `martello_tower` | `historic=castle`, `historic=fort`, `historic=archaeological_site` + `site_type=fortification` |
| **Sacred** | `church`, `church_ruin`, `abbey`, `holy_well`, `high_cross`, `graveyard` | `historic=ruins`+`ruins=church`, `amenity=place_of_worship`, `historic=wayside_cross` |
| **Ancient** | `megalith`, `dolmen`, `stone_circle`, `standing_stone`, `cairn`, `souterrain` | `historic=archaeological_site`, `megalith_type=*` |
| **Water** | `waterfall`, `river_crossing`, `lake_shore`, `holy_well`, `harbour`, `lighthouse` | `waterway=waterfall`, `man_made=lighthouse`, `natural=water` |
| **Green** | `ancient_woodland`, `forest`, `nature_reserve`, `park`, `bog`, `meadow` | `landuse=forest`, `leisure=nature_reserve`, `natural=wood` |
| **Elevation** | `viewpoint`, `summit`, `cliff`, `hill_fort` | `tourism=viewpoint`, `natural=peak`, `natural=cliff` |
| **Built** | `bridge`, `mill`, `windmill`, `folly`, `industrial_ruin`, `railway_remnant` | `historic=*`, `man_made=windmill` |
| **Curious** | `sculpture`, `mural`, `mosaic`, `oddity`, `memorial` | `tourism=artwork`, `historic=memorial` |

**Rules**

- A POI has exactly **one primary category** (what it counts toward) and may
  carry **secondary tags** (what it can also satisfy). A holy well beside a
  river is `holy_well` primary, `water` secondary.
- Every category has a **rarity weight** driving both scoring and XP.
- Categories are **data**, in a `poi_categories` table. Adding one is an
  insert plus a re-tag pass, not a deploy.
- Quest-level tags (`forest quest`, `coastal quest`) are derived from the
  categories of the objectives plus the landcover the route passes through —
  which is what makes "complete 3 forest sidequests" expressible.

---

## 10. Data model

Proposed schema. Additive to what exists; `profiles`, `user_settings`, and
the auth trigger survive largely as-is. `quests` is **replaced** by the
`sidequests` / `runs` split.

```
profiles              id, display_name, avatar_url, home_country,
                      unit_system, is_admin, created_at

user_settings         user_id, last_lat, last_lng, last_fix_at,
                      default_distance_m, difficulty_pref,
                      privacy_acknowledged, updated_at

saved_locations       id, user_id, name, lat, lng, created_at

countries             iso2 PK, name, geom geography(MultiPolygon),
                      bbox, poi_count

poi_categories        id PK, group, label, rarity_weight,
                      default_completion_radius_m, icon_key

pois                  id, country_iso2, category_id, name,
                      geom geography(Point) [GiST],
                      completion_radius_m, quality_score,
                      wikidata_id, wikipedia_title, description,
                      image_url, osm_type, osm_id, secondary_tags[],
                      first_seen_at, last_verified_at
                      UNIQUE (osm_type, osm_id)

sidequests            id, created_by (nullable — system-generated),
                      country_iso2, origin_lat, origin_lng,
                      title, flavour, difficulty,
                      distance_m, est_duration_s,
                      route_polyline text,        -- encoded, simplified
                      return_polyline text,
                      routed bool, generator_version, seed,
                      tags[], visibility, created_at

sidequest_objectives  id, sidequest_id, ordinal, poi_id (nullable),
                      lat, lng, kind, prompt,
                      completion_radius_m

runs                  id, user_id, sidequest_id, status,
                      started_at, completed_at,
                      distance_m, duration_s,
                      track_polyline text,        -- user-deletable
                      tiles_gained int, xp_awarded int, flagged bool
                      -- partial unique index: one active run per user

run_objectives        run_id, objective_id, completed_at,
                      verified_lat, verified_lng, verified_accuracy_m

explored_cells        user_id, h3_cell bigint, country_iso2,
                      first_seen, run_id
                      PK (user_id, h3_cell)

poi_visits            user_id, poi_id, first_visited_at, visit_count
                      PK (user_id, poi_id)     -- powers category progress

collections           id, owner_id, slug, title, description,
                      visibility, country_iso2, cover_media_id,
                      item_count, created_at, updated_at

collection_items      collection_id, sidequest_id, ordinal, note
                      PK (collection_id, sidequest_id)

unlock_rules          id, type, params jsonb, label, description,
                      badge_key, xp_reward, active

user_unlocks          user_id, rule_id, unlocked_at, run_id
                      PK (user_id, rule_id)

media_assets          id, kind, storage_path, prompt, model,
                      status, created_by, created_at     -- admin, v2

admin_audit           id, actor_id, action, target, payload, created_at
```

**Row-level security**

- Every user-owned table: read/write own rows only. No exceptions.
- `pois`, `poi_categories`, `countries`, `unlock_rules`: read-only to
  authenticated users, writable only by service role.
- `sidequests`: readable if `created_by = auth.uid()`, **or** the sidequest
  appears in a collection whose visibility is not `private`. This is the one
  genuinely non-trivial policy in the system and it needs a test.
- `collections`: readable if owner, or `visibility != 'private'`.
- Admin tables: `is_admin = true` on the requesting user's profile.

**Schema notes / changes from the current implementation**

- `quests.route jsonb` (array of `[lat,lng]`) → `route_polyline text`
  (encoded polyline). Smaller, faster to parse, and the format every mapping
  library already consumes.
- PostGIS is required (`create extension postgis`). The current schema uses
  bare `double precision` lat/lng columns, which cannot answer "POIs within
  2 km" efficiently. This is the single most important schema upgrade.
- `pg_trgm` for place-name search in history and collections.

---

## 11. Technical architecture

### 11.1 Stack

Confirmed as-is: **Next.js 16 (App Router) + React 19 + TypeScript strict +
Tailwind v4 + Supabase (Auth, Postgres, Storage, Edge Functions) + Vercel.**
No reason to revisit any of it.

Additions required:
- **PostGIS** — spatial queries.
- **h3-js** — tiling.
- **MapLibre GL JS** — renderer (replacing the current Leaflet dependency).
- A server-side generation endpoint (Next route handler is sufficient;
  Supabase Edge Function if we want it closer to the database).

### 11.2 Decision: map rendering and tiles

**Decision: MapLibre GL JS as the renderer, MapTiler as the v1 tile vendor,
with a self-hosted PMTiles path held open for cost control.**

| Option | Verdict |
|---|---|
| **Leaflet** (current dep) | **Drop.** Raster-first, no vector styling, no pitch/bearing, no 3D extrusions, no terrain. Every one of our stated requirements is outside what it does. |
| **Mapbox GL JS** | **No.** Proprietary licence, per-map-load pricing that scales badly for a session-heavy app, and it locks the renderer to the vendor. Excellent product; wrong commercial shape for us. |
| **MapLibre GL JS** | **Yes.** BSD-3, open fork of Mapbox GL v1, vector styling, pitch/bearing, `fill-extrusion` for 3D buildings, `raster-dem` terrain. Critically, the *renderer* is decoupled from the *tile vendor*, so the vendor decision is reversible and the style is portable. |

Tile vendor, given MapLibre:

| Vendor | Notes |
|---|---|
| **MapTiler** | v1 pick. OpenMapTiles schema carries `render_height` / `render_min_height` on the building layer (3D extrusions work out of the box) and offers Terrain-RGB DEM tiles. Generous free tier, predictable paid tiers, MapLibre-native. |
| **Protomaps / PMTiles** | The escape hatch. A single `.pmtiles` file per country on object storage (Supabase Storage or R2), served by range requests. Marginal cost approaches zero. Ireland is a small file. Cost to adopt is a build step, not a rewrite. **Move here when tile spend becomes visible.** |
| **Stadia / Thunderforest** | Viable alternates; no advantage over MapTiler for our case. |

**3D buildings and terrain are v1.5, not v1.** They are a `fill-extrusion`
layer and a `raster-dem` source added to an existing style — genuinely
incremental. Gate them on device capability; they are the first thing to
turn off on a mid-range Android.

**Verify current pricing before committing spend** — vendor tiers change and
the numbers above are directional, not quoted.

### 11.3 Decision: routing

**Decision: self-hosted Valhalla, one small VPS, per-country OSM extract.**

| Option | Verdict |
|---|---|
| **Public OSRM demo** (current) | **Must go before any real traffic.** Explicitly not for production use, rate-limited, no SLA. |
| **Self-hosted OSRM** | Fast and cheap, but pedestrian profile is basic and it has no isochrones. |
| **Self-hosted Valhalla** | **Yes.** One binary gives pedestrian costing with surface/steepness awareness, **isochrones** (needed to answer "what's reachable in 45 minutes on foot"), a distance **matrix** (needed to score many POI candidates in one call), and **map-matching** (needed to snap tracks and compute progress). Runs comfortably on a small VPS with an Ireland extract. |
| **GraphHopper Cloud** | Best managed option, and its built-in `round_trip` algorithm is a genuinely good fit. Use as the interim while Valhalla is stood up, or as failover. |
| **Mapbox Directions** | Per-request pricing on our highest-volume call. No. |

The matrix endpoint is what makes candidate scoring (§8.5 step 2) affordable
— one call to rank 30 candidates instead of 30 calls.

Keep the existing straight-line fallback in `lib/routing.ts` as a **last
resort that is surfaced to the user**, never presented as a real route.

### 11.4 Decision: POI data

**Decision: ingest OSM into our own PostGIS table. Do not query a third-party
POI API at request time.**

Rationale:
- Our taxonomy (§9) is ours. Categories exist to drive progression, and no
  external API's categories will match. We need to own the mapping.
- Progression needs **denominators** — "3 of 47 castles in Ireland" requires
  knowing there are 47. Only possible with a local dataset.
- Candidate scoring needs dozens of spatial queries per generation. At
  request time against a rate-limited public API this is untenable; against
  a local GiST index it's sub-millisecond.
- Cost is a fixed ingestion job, not a per-request charge.

**Pipeline:** Geofabrik country extract → filter to taxonomy tags →
`osm2pgsql` (or `osmium` + `ogr2ogr`) into `pois` → enrich from Wikidata /
Wikipedia for descriptions and images → compute `quality_score` → publish.
Re-run monthly. Overpass API used only for ad-hoc gap-filling, never on the
request path.

**Licensing: this is a hard requirement, not a footnote.** OSM data is ODbL.
Derived databases carry share-alike obligations, and attribution is
mandatory and must be visible. Wikidata is CC0 (fine); Wikipedia text is
CC BY-SA (attribution + share-alike); Wikimedia images are individually
licensed and must be checked per image, not assumed. **Get this reviewed
before any public launch.**

### 11.5 Decision: tiling scheme

**Decision: H3 hexagons, canonical resolution 11. Not lat/lng circles.**

The brief asks whether to use radius circles or a tiled grid. Tiles, clearly:

| | Radius circles | Square grid | **H3 hexagons** |
|---|---|---|---|
| Countable ("X tiles") | No — circles overlap | Yes | **Yes** |
| Tessellates without gaps | No | Yes | **Yes** |
| Uniform neighbour distance | n/a | No (diagonals) | **Yes** |
| Latitude distortion | n/a | Severe — a "square" in degrees is a rectangle on the ground | **Handled** |
| Storage per unit | Centre + radius, unbounded set | Two ints | **One 64-bit int** |
| Sync payload | Complex | Moderate | **A list of integers** |
| Multi-resolution rollup | No | Awkward | **Native (`cellToParent`)** |
| Library | — | DIY | **h3-js, Apache-2.0** |

Circles fail the core requirement immediately: overlapping circles cannot
produce an honest "you have unlocked 1,284 tiles" number without expensive
geometric union. Hexagons give it for free as `count(*)`.

**Resolution ladder:**

| Res | Cell size | Use |
|---|---|---|
| 11 | ~2,150 m², ~50 m across | **Canonical stored cell.** Fog reveal granularity. |
| 9 | ~0.105 km² | Territory display / tile-count stat if res 11 feels too granular a number |
| 8 | ~0.74 km² | Region-level achievements, derived via `cellToParent` — never stored |

Drop to res 12 (~307 m²) only if playtesting says 50 m reveal bands look
chunky; it costs 7× the rows.

### 11.6 Generation service

- A server route handler (or Edge Function) owning: POI candidate query,
  scoring, routing calls, composition, persistence.
- **Idempotent by seed.** `(origin, distance, seed, generator_version)`
  always yields the same sidequest. Makes generation debuggable, quests
  reproducible, and reroll a pure function of the seed.
- `generator_version` stamped on every sidequest so we can tell which
  algorithm produced a bad quest.
- Rate-limited per user. Generation costs routing calls.
- Target p95 < 1.5 s. Above ~3 s, reroll stops feeling free and the whole
  loop breaks.

### 11.7 Client state

- **Zustand** for live-run state — position, route progress, tile buffer,
  objective status. High-frequency, ephemeral, doesn't belong in a server
  cache.
- **TanStack Query** for server data — sidequests, history, collections,
  progression.
- **IndexedDB** for the territory set and the offline run cache.
- Framer Motion for transitions, respecting the existing global
  `prefers-reduced-motion` guard.

Do not add these until the screens that need them exist. The current app has
no state layer and doesn't yet need one.

### 11.8 PWA and offline — an honest constraint

**Background geolocation does not work in a PWA.** On iOS, a backgrounded or
screen-locked web app stops receiving `watchPosition` callbacks. On Android
it is unreliable and aggressively power-managed. This is a platform
limitation with no web workaround.

Consequences we must design around, and be upfront with users about:

- A run captures tiles reliably only while the app is **foregrounded**.
- v1 mitigations: a wake-lock request (`navigator.wakeLock`) during an
  active run, a clear one-time explanation at first run start, and
  gap-filling — on return to foreground, interpolate along the *routed line*
  between the last and current fix and unlock those tiles, but only if the
  gap is short enough and the geometry plausible. This is a deliberate,
  bounded generosity, not a correctness claim.
- Objective completion is checked on return to foreground as well as live.
- Genuine background tracking requires a native shell (Capacitor is the
  cheapest route). That is a v2+ decision and should be made on evidence
  that foreground-only is actually costing us completions.

Service worker scope for v1: app shell + the active run's route, objectives,
and POI metadata. Offline basemap tiles are v2.

---

## 12. Cost model

Directional at 10,000 MAU. **Verify all vendor pricing before committing.**

| Line | Approach | Expected |
|---|---|---|
| Hosting | Vercel | Low fixed |
| Database + auth + storage | Supabase | Low fixed; scales with territory rows |
| Map tiles | MapTiler free/entry tier → PMTiles self-host | Near zero once self-hosted |
| Routing | Self-hosted Valhalla, one small VPS | ~£5–15/mo flat, independent of volume |
| POI data | Monthly ingestion job | Compute only |
| LLM narrative (v2) | Cached per sidequest, one-time | Small, bounded by generation volume |
| Media generation (admin) | Hard daily caps | Bounded by design |

**The architecture's cost story is that every expensive thing is fixed-cost
and self-hosted, and every per-request thing is cached or local.** That is
the direct answer to "keeping price points as low as possible", and it is
the reason for the MapLibre and Valhalla decisions specifically.

---

## 13. Privacy, safety, and legal

**Privacy**

- Territory stores **cells, not tracks**. A res-11 cell set cannot be
  replayed as a route and reveals no speed, direction, or dwell time.
- The per-run track polyline is higher resolution, is the only place a
  replayable path exists, and must be **individually deletable** from the
  history detail view.
- Location is never shared with another user, in any form, in v1. A shared
  collection exposes *sidequests*, which are generated routes — not anyone's
  recorded track.
- `last_location` is stored for map convenience and is clearable in
  settings.
- Full account deletion cascades. Data export on request.
- A plain-language privacy explanation appears in the location priming
  screen (§8.2), not buried in a policy page.

**Safety**

- Routes are pedestrian-costed and must avoid roads without pedestrian
  access. Where a route uses a road with no pavement, **say so in the
  preview.**
- Surface and terrain warnings in the preview: unpaved, steep, stiles,
  likely mud.
- Never route onto private land. Respect OSM `access=private`.
- Night-walking: if the route's estimated duration ends after sunset,
  surface that in the preview. Don't block it — inform.
- Objectives never require entering a building, climbing anything, or
  leaving a path. The completion radius is generous by design.
- A visible "this is a walking suggestion, use your judgement" disclaimer,
  and an easy way to report an unsafe route.

**Legal**

- OSM/ODbL attribution and share-alike (§11.4). Needs review before public
  launch.
- Tile vendor attribution per their terms.
- Public collections are UGC pointing at physical places — moderation and
  takedown are required from the moment public visibility ships.
- Standard GDPR: lawful basis, retention, export, deletion. Location is
  personal data; treat it as such.

---

## 14. Success metrics

**Activation:** signup → location granted → first quest generated → first
quest completed. Instrument every step; the location prompt is the expected
cliff.

**Core health**
- Quests generated per active user per week
- **Generation acceptance rate** — started / generated. The single best
  proxy for generation quality.
- **Reroll depth** — rerolls before starting. Rising = generation degrading.
- Completion rate — completed / started
- Tiles unlocked per user per week
- Category progress breadth — how many categories a user is progressing on

**Retention:** D1 / D7 / D30, and second-quest-within-14-days (G3).

**Quality guardrails**
- Routing fallback rate (straight-line served) — must trend to zero
- Generation p95 latency — must stay under 1.5 s
- Objective verification failure rate — high values mean bad POI geometry
- Flagged-run rate

---

## 15. Release plan

### v0.5 — Foundations (current + strip-back)
Repo strip-back per `repo-review.md` §6. PostGIS enabled. Schema migrated to
the `sidequests`/`runs` split. MapLibre replaces Leaflet. Auth gaps closed
(verification, reset, magic link). POI ingestion pipeline built and Ireland
loaded. *No new user-facing features.*

### v1 — The loop
Location priming and capture. Country-locked custom map. Procedural
generation with POI anchors and the shape-quest fallback. Quest preview with
reroll. Live run with trail and objectives. Server-verified completion. Fog
of war end to end. Category progression and unlocks. History. Collections
(private + unlisted link sharing). PWA install.

**v1 is done when a stranger in Ireland can sign up, walk a generated quest,
and see their map change — with no help.**

### v1.5 — Depth
3D buildings and terrain, capability-gated. Public collections with slugs
and link previews. Photos attached to runs. Territory compaction. Second
country. Search across history and collections.

### v2 — Intelligence and reach
LLM narrative layer over the procedural plan. On-demand POI discovery
(Overpass gap-fill) for sparse areas. Admin media generation (§8.14).
Notifications. Offline basemap. Native shell if background tracking proves
necessary.

---

## 16. Open questions

| # | Question | Owner | Needed by |
|---|---|---|---|
| Q1 | Launch country — Ireland assumed. Confirm. | Josh | v0.5 |
| Q2 | Does res 11 (~50 m) fog feel right, or is res 12 worth 7× the rows? | Playtest | v1 |
| Q3 | Is the "X tiles" number shown at res 11 (big, noisy) or res 9 (small, meaningful)? | Josh | v1 |
| Q4 | Do collections need a browse/discovery surface, or is link-sharing genuinely enough for v1.5? | Josh | v1.5 |
| Q5 | Aesthetic direction — resolved by the strip-back and a fresh design pass. | Josh | v1 |
| Q6 | Is foreground-only tile capture acceptable, or does that force a native shell earlier? | Evidence from v1 | v1.5 |
| Q7 | ODbL share-alike posture — do our derived `pois` and generated sidequests trigger it? | Legal review | Before public launch |
| Q8 | Do we allow re-walking the same sidequest for progression, or once per POI only? (Proposed: re-walk freely, count POIs once.) | Josh | v1 |

---

## 17. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **Location permission denial** kills activation | Fatal | Priming screen, first-class pin-drop alternative, denied-state recovery (§8.2) |
| **Generation quality is mediocre** — quests feel random | Fatal | Scoring model with new-territory term, free reroll, acceptance-rate instrumentation, shape-quest fallback so we never serve nothing |
| **POI data is sparse or wrong** outside cities | High | Shape-quest fallback, quality scoring, Wikidata enrichment, per-POI report path |
| **Background location doesn't work in PWA** | High | Foreground-only design + wake lock + bounded gap-filling; honest up front (§11.8) |
| **Map cost scales past the free tier** | Medium | PMTiles self-host path designed in from day one (§11.2) |
| **Fog-of-war row growth** | Medium | Compaction path already specified (§8.10) |
| **ODbL share-alike obligations** | Medium | Legal review before launch (Q7) |
| **Scope creep into a social product** | Medium | Explicit non-goal (§3); collections ship link-only |
| **Solo-maintainer bus factor** | Medium | Everything in-repo: this PRD, decision records, no undocumented vendor magic |
