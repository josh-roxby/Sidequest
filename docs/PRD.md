# Side Quest — Product Requirements Document

| | |
|---|---|
| **Version** | 0.2 |
| **Date** | 2026-08-31 |
| **Owner** | Josh |
| **Status** | Proposed |
| **Changes from 0.1** | Duration tiers replace freeform distance · "run" retired · zero third-party spend is now a hard constraint · we build and own the GIS · curated corpus replaces live generation for v1 · no-chains rule · lore layer · hospitality categories |
| **Related** | [`data-pipeline.md`](./data-pipeline.md) · [`repo-review.md`](./repo-review.md) · [`fog-of-war.md`](./fog-of-war.md) · [`../TODO.md`](../TODO.md) |

> **Scope note.** Minimal visual design detail — the aesthetic is being
> re-opened (`repo-review.md` §6). This is product logic, data, and
> architecture.

---

## 1. Summary

Side Quest turns a walk into a local adventure. A signed-in user shares their
location, sees Ireland rendered as a stylised map we built ourselves, picks
how long they have — **15 minutes, 45 minutes, 90 minutes, or 3 hours** — and
gets a walking loop anchored to real places worth knowing about: a ringfort,
a holy well, a river crossing, a 19th-century mill, a townland whose name
means "the ford of the two waters".

**Nothing on the map is a chain.** The cafés, pubs and restaurants that
appear are independent and local, by rule and by pipeline. That is the
product's spine, not a filter setting.

Every anchor point can tell you its **tale** — sourced, cited history and
placename lore, never invented. Walking reveals map territory permanently,
advances category progression, and fills a personal history. Users curate
quests into shareable collections — *"Castle ruins by rivers"*, 8 quests
across Ireland.

Two constraints shape every decision in this document:

1. **No third-party service spend to reach MVP.** Everything self-hosted or
   inside free tiers we already use.
2. **We own the data.** The Irish local-place dataset — categorised,
   chain-free, lore-enriched — is the asset. Not a wrapper on someone's API.

---

## 2. Problem & opportunity

Walking apps split into two camps and both miss:

- **Fitness trackers** measure the walk. They have no answer to *"where
  should I go and why would I care?"*
- **Route libraries** (AllTrails, Komoot) assume you already want a named
  trail, will drive to it, and are motivated by the outdoors itself.

And every "places near me" surface — Google Maps, TripAdvisor — is optimised
for the opposite of what we want. Ranking rewards volume, ad spend, and
review count, which systematically surfaces chains and tourist traps and
buries the good local place with 40 reviews.

The gap is the **unplanned local hour**, filled with genuinely local things.
Someone with 45 free minutes who would love to know that the wall at the end
of their road is a 15th-century tower house, and that the coffee two streets
over is roasted by the person who serves it.

The mechanic that makes this compelling is proven — it's the open-world game
map: fog of war, discoverable landmarks, collectible categories, completion.
Nobody has bolted it to real walking over a *curated, non-commercial-ranked*
local dataset.

---

## 3. Goals, constraints, non-goals

### Goals

| # | Goal | Measure |
|---|---|---|
| G1 | Cold start to walking a quest in under 90 seconds | p50 time-to-first-quest < 90 s |
| G2 | Quests feel *chosen*, not random | ≥60% of previewed quests are started |
| G3 | Walking is rewarding without gimmicks | ≥40% who finish one quest finish a second within 14 days |
| G4 | Progression gives a reason to return | ≥25% of actives progressing on ≥2 categories |
| G5 | The dataset is visibly better than Google Maps for local | Qualitative + zero chains in production data |
| G6 | The map is our identity, not a commodity embed | Our tiles, our style, our POI layer |

### Hard constraints

| # | Constraint | Consequence |
|---|---|---|
| **C1** | **Zero third-party service spend to MVP** | No MapTiler, no Mapbox, no hosted routing, no LLM API in v1. Self-host or free-tier only. (§12) |
| **C2** | **We own the GIS** | Our vector tiles, our POI database, our zone polygons. No runtime dependency on anyone's places API. (§11) |
| **C3** | **No chains, ever** | Enforced in the pipeline, not the UI. A chain reaching production is a P1 bug. (§9.3) |
| **C4** | **No invented history** | Every published lore row carries a source and a licence. An LLM may compress sourced text; it may never originate a fact. (§8.12) |

### Non-goals for v1

Turn-by-turn voice nav · fitness metrics · social feed, following, likes ·
multi-day, driving, cycling, transit · countries beyond Ireland · native
apps · photo/CV verification · monetisation.

---

## 4. Users

**The 45-minute local.** Walks for headspace, same three routes for two
years. Wants a reason to turn left. Highest frequency. Lives in the Stroll
tier.

**The weekend explorer.** Will drive 20 minutes to a start point, wants a
half-day with something worth seeing and somewhere decent to eat. Lives in
Adventure.

**The completionist.** Motivated by the meta-layer — tiles, categories,
townlands explored. Will build a trip around "there are three ringforts left
in this parish". Lowest volume, highest retention, and the reason
progression is v1.

---

## 5. Product principles

1. **The map is the home screen.** Everything is spatial.
2. **Never show an empty map.** Fog, zones and undiscovered pins mean there
   is always something to want.
3. **Time is the unit, not distance.** People have an hour, not 6.4 km.
4. **Local is the whole point.** If a chain could appear, the product has
   failed at its one job.
5. **Honest about the ground.** Unpaved, no pavement, a stile, likely mud —
   say it before they leave.
6. **Honest about the past.** Cited or not published.
7. **Reward the walk, not the phone.** No mechanic requires staring at a
   screen while walking.
8. **Progress is permanent.** Nothing decays, nothing expires, no streak
   punishes a bad week.
9. **The user's track is not our data.** We store the tiles you unlocked,
   not the path you took.

---

## 6. Concepts and vocabulary

Binding across UI, code and schema.

| Term | Definition |
|---|---|
| **Quest** | The umbrella noun. A generated-then-curated walking loop with a start, a route, and objectives. Durable and shareable; exists independently of anyone walking it. |
| **Tier** | A quest's duration class: **Trot**, **Stroll**, **Sidequest**, **Adventure**. (§7) |
| **Walk** | One person's attempt at a quest — `active` / `completed` / `abandoned`. **Internal record only; the word never appears in the UI as an entity.** The user sees "your sidequests" and their history. |
| **Objective** | One point to reach within a quest. `required` or `optional`. |
| **Anchor** | The primary objective a quest was built around — the reason the quest exists. |
| **Point** | A real place in our dataset: geometry, category, quality, and lore. (Internally `pois`.) |
| **Category** | The taxonomy slot a point occupies — `ringfort`, `holy_well`, `independent_cafe`. Progression is defined over categories. (§9) |
| **Tale** | The sourced, cited lore attached to a point. (§8.12) |
| **Tile** | An H3 res-11 hexagon. The atomic unit of revealed territory. |
| **Zone** | A named real-world area — **townland**, parish, county. The human-readable territory layer. (§8.10) |
| **Collection** | A user-curated, ordered set of quests. Private, unlisted, or public. |

**On "walk" vs "run".** v0.1 called the attempt a *run*; that's wrong for a
walking app and it leaked into the UI. It is now a **walk**, and it is
invisible to users. The two-entity split itself must stay: a collection
points at *quests*, not at anyone's attempt at them, and without that
separation collections, sharing and re-walking are all impossible.

**On the name collision.** *Sidequest* is both the app and the 90-minute
tier. That's deliberate — the product is named after its signature tier, the
way a pub is named after its best pint. Flagged as Q9 if you want it changed.

---

## 7. Duration tiers

Tiers are the primary choice a user makes. Everything downstream —
generation radius, objective count, whether there's a coffee stop — keys off
the tier.

| Tier | Target | Loop distance | Reach¹ | Required objectives | Food stop |
|---|---|---|---|---|---|
| **Trot** | 15 min | 0.9–1.3 km | ~350 m | 1 | No |
| **Stroll** | 45 min | 2.6–3.4 km | ~1.0 km | 1–2 | Optional, at the end |
| **Sidequest** | 1 h 30 | 5.5–6.5 km | ~2.0 km | 2–3 | Optional, mid or end |
| **Adventure** | 3 h | 10–13 km | ~4.0 km | 3–5 | **Expected**, at roughly halfway |

¹ Reach = maximum straight-line distance from start to the furthest point.

**Duration model.** `duration = walking_time + dwell_time`, where walking
time uses a terrain- and gradient-adjusted pace (baseline 4.7 km/h on made
paths, penalised for surface and incline) and dwell is 2–5 minutes per
objective by category — a viewpoint is 2, a ruin you can walk around is 5, a
café is excluded from the estimate because it's optional.

Tolerance is **±20%** of target. Outside that, the quest is rejected at build
time and rebuilt.

**Tiers are progression dimensions too.** "Complete 10 Trots", "walk an
Adventure in three counties" are valid unlock rules (§8.11). And the tier is
the honest expectations contract: a user who picks Trot and gets 40 minutes
will not come back.

---

## 8. Feature specification

### 8.1 Accounts

Supabase Auth; substantially built (`repo-review.md` §3.1).

v1: email+password with display name · magic link as the primary path ·
Google and Apple OAuth · **email verification enforced** (currently a gap) ·
password reset (missing) · account deletion with full cascade · JSON data
export. Profile carries `display_name`, `avatar_url`, `home_country`,
`unit_system`, `is_admin`.

No guest mode — territory, progression and collections all need identity.
Revisit if signup drop-off exceeds 50%.

### 8.2 Location capture

The single highest-risk moment in the funnel. A denied prompt is effectively
unrecoverable on mobile Safari.

1. **Never** call geolocation on page load.
2. A **priming screen** first: what we use it for, that we store tiles not
   tracks, one "Enable location" button. Only that button triggers the
   browser prompt.
3. An equally prominent **"pick a place on the map instead"**. First-class
   path, not a consolation prize.
4. Detect `denied` via `navigator.permissions.query`; show
   platform-specific recovery plus the pin-drop path.
5. **Accuracy gate** — reject fixes worse than 100 m for quest selection.
6. Persist `last_location` so a returning user's map opens correctly before
   any prompt fires.

Live tracking uses `watchPosition` with high accuracy. The existing
`useLiveLocation` already guards non-finite coordinates (a real iOS bug);
add the max-jump jitter filter from `fog-of-war.md`.

PWA install prompt offered after the **first completed quest**, never
before. On iOS, `beforeinstallprompt` doesn't fire — show manual
Add-to-Home-Screen instructions.

### 8.3 The country lock

The map is bounded to one country. It makes the map a game board rather than
an infinite canvas, caps data and tile cost to one country, and gives
progression an honest denominator.

- First fix reverse-resolves to a country against a **local PostGIS
  `countries` table**. No geocoding service. (C1)
- Camera `maxBounds` to the country bbox; the country polygon is the board,
  everything outside is inert out-of-bounds treatment.
- A fix in another country offers an explicit switch — never silent.
- **v1 country: Ireland.** Exceptional density of exactly our categories,
  a small OSM extract, world-class open heritage data (§ `data-pipeline.md`),
  and it's where the first users are.
- Adding a country is a data operation, not a code change.

### 8.4 The map

Ours, end to end (C2). Vector basemap in a custom style, minimal labels, the
country polygon as the board, fog overlay above the basemap and below the
trail, our POI layer served live from Postgres so it updates without a tile
rebuild.

**Interaction surfaces** — behaviour only:

- **Popovers** — tap a pin: name, category, one line, distance, primary
  action, and a "Tale" affordance if lore exists.
- **Modals** — decisions only: tier choice, quest preview, end-quest
  confirmation, permission priming, save-to-collection.
- **Tooltips** — custom, tap-friendly, never hover-only.

All three are **one shared overlay primitive** with three presentation
modes, so focus trapping, dismissal, safe-area insets and reduced-motion are
solved once. Building them separately is the standard way "clean popovers and
modals" degrades into three inconsistent implementations.

3D building extrusions and terrain: **v1.5**, capability-gated. They are a
`fill-extrusion` layer and a `raster-dem` source over a style that already
exists — genuinely incremental, and the first thing to disable on a
mid-range Android.

### 8.5 Where quests come from — the corpus

**Decision: v1 ships a pre-built, quality-reviewed corpus of quests. Live
on-demand generation is v1.5.**

This is the most consequential change from v0.1, and C1 forces it — live
generation needs a routing service running 24/7, which is a monthly bill.
But it is also simply the better product:

| | Live generation | **Pre-built corpus** |
|---|---|---|
| Runtime cost | A routing server, always on | **Zero — a spatial query** |
| Quality control | Whatever the algorithm did, shipped blind | **Every quest reviewable before publication** |
| Lore curation | Impossible — no time to research at request time | **Researched, cited, edited** |
| Latency | 1–3 s | **Instant** |
| Offline | Needs a network round-trip | **Cacheable** |
| Novelty | Infinite | Finite, but ~12k quests is not a constraint anyone hits |
| Feels like | A machine | **A local who knows the area** |

The generator still exists — it's the tool we run **offline** to build the
corpus. Same algorithm, run on a laptop with Valhalla in Docker against the
Ireland extract, output written to Postgres. No runtime dependency.

**Build algorithm** (offline, deterministic by seed):

1. **Start anchors.** A grid of candidate start points: every settlement
   centroid, every car park and trailhead, plus an H3 res-8 lattice over
   populated areas. Targets ~1,500 anchors nationally.
2. **Candidate points.** For each anchor × tier, query points within the
   tier's reach annulus (inner 0.5×, outer 1.0× reach) via `ST_DWithin`.
3. **Score.** Category rarity × quality score × lore richness × new-territory
   gain. Points *with a tale* score materially higher — that's how the
   curation effort compounds into quest quality.
4. **Pick an anchor point**, weighted-random from the top N.
5. **Route the loop** — Valhalla pedestrian, out via the anchor, back via a
   perpendicular-offset corridor so it isn't an out-and-back. (`lib/geo.ts`
   `midpointWaypoints` is already exactly this primitive.)
6. **Validate** — distance within tier tolerance, no motorway or
   `access=private` segments, no unlit road-without-pavement section over
   300 m for tiers likely to run into dusk.
7. **Attach secondary objectives** — points within ~150 m of the polyline.
   For Stroll and above, try to include one independent food stop as an
   **optional** objective (§9.3).
8. **Simplify** the polyline (Douglas–Peucker, ~5 m) and encode as a
   polyline string.
9. **Stage as `draft`.** Publication is a human decision (§8.14).

**Selection at runtime** is one spatial query: quests whose start is within
walking distance of the user, filtered by tier, ranked by unvisited anchors,
lore richness, and new territory. Sub-millisecond, zero external calls.

**"Start is 200 m away" is fine** — the app says so and draws the connector.
Trying to make every quest start exactly underfoot is what forces live
generation, and it isn't worth a monthly bill.

**Reroll** cycles to the next candidate from the same query. Instant, free,
unlimited. Reroll depth is logged — it's the clearest signal that corpus
quality in an area is poor.

**Fallbacks:** where point density is too low for a tier, build a **shape
quest** — a loop scored on path quality and new territory, with route-feature
objectives ("cross the river", "reach the high point"). Never leave an area
with nothing.

### 8.6 The trail

Vector line on the map (GeoJSON source + line layers). Out-leg and
return-leg visually distinct; walked vs remaining updated live by
nearest-point-on-line projection. Stored simplified and polyline-encoded —
*not* the `jsonb` array of pairs the current schema uses.

### 8.7 Walking a quest

One active walk per user, enforced by a partial unique index. The screen
shows distance covered/remaining, elapsed vs tier target, the next
objective, and a position dot. Nothing else.

Pause, resume, abandon. **Abandoning keeps every tile already unlocked** —
we never take territory back.

Offline: route, objectives, point metadata and tales are cached at start, so
a walk survives total loss of connectivity end to end. Sync on reconnect.

### 8.8 Objective verification

**Geofence proximity, verified server-side.** Within
`completion_radius_m` (default 40 m, per-point override for large sites) for
≥15 continuous seconds. The client shows the reward immediately; the server
independently re-checks the distance before writing progress. Client
authority is unacceptable for anything feeding a public collection's
completion count.

Implied-speed plausibility check → **flag, don't block**. GPS is noisy and a
false accusation is worse than a few cheated ringforts. Flagged walks don't
count toward category progression.

Optional objectives (food stops) complete the same way but never gate quest
completion — the café might be shut.

### 8.9 Completion and history

On finish: sync tiles and get the new-cell count · award XP · evaluate
unlocks · write the walk row · offer save-to-collection or another quest.

History is chronological, each entry opening to a route map, objectives, the
tales of the points visited, and stats. Filter by category and tier, search
by name. **The track polyline is individually deletable** — it's the only
replayable path we store.

### 8.10 Territory: tiles and zones

Two layers, because they do different jobs.

**Tiles — H3 res 11 (~2,150 m²).** The atomic unit. Drives the fog reveal
and the raw count. Architecture is settled in
[`fog-of-war.md`](./fog-of-war.md) and adopted wholesale: hybrid
client/server source of truth, IndexedDB during a walk for instant offline
reveal, delta sync at end-of-walk, cells stored and never raw tracks.

Additions this PRD makes: territory is **scoped per country**; coarse
statistics are **derived** via `cellToParent(cell, 8)`, never stored twice;
and the compaction path when row counts bite is one row per res-8 parent
carrying a 343-bit child bitmap — 44 bytes covering 0.74 km², collapsing a
heavy user's territory to a few hundred rows.

**Zones — townlands.** Ireland is divided into roughly 61,000 **townlands**,
the smallest administrative land division, most with names that are
anglicised Irish with a real meaning. This is the human-readable territory
layer and it is uniquely, unfakeably Irish:

> *You have explored 14 townlands in Co. Clare.*
> *Ballynacally — Baile na Coille, "the town of the wood".*

A townland unlocks when the user's tiles cover a threshold share of it
(proposed: 15%, tuned in playtest). Zones give progression a *place-name*
vocabulary that hexagons never can, and they connect directly to the lore
layer via Logainm (CC BY 4.0 — verified, see `data-pipeline.md`).

Zones nest: townland → civil parish → barony → county. Achievements can key
on any level.

Fog renders on the main map and the history hero map; not on small
thumbnails.

### 8.11 Progression

Four independent systems, so each can be tuned without disturbing the
others:

1. **Level (XP)** — a single number that only goes up. Cosmetic. Its job is
   to acknowledge every action.
2. **Category progress** — distinct points reached per category, with honest
   country-scoped denominators from our own dataset: *"Ringforts: 3 of 312
   in Co. Clare"*. No third-party API can give you that number.
3. **Territory** — tiles, km², townlands, counties, percentage of Ireland.
4. **Tier record** — Trots, Strolls, Sidequests and Adventures completed.

**Unlocks are declarative rows, not code:**

| Type | Example | 
|---|---|
| `category_count` | Reach 5 distinct castles |
| `category_sweep` | Every holy well in a barony |
| `tier_count` | Complete 10 Trots |
| `zone_count` | Explore 25 townlands |
| `zone_sweep` | Fully explore a townland |
| `territory` | Unlock 1,000 tiles |
| `distance` | 100 km walked |
| `collection` | Complete every quest in a collection |
| `lore` | Read 50 tales |

Evaluated server-side after each walk. New unlocks ship as data. **Retroactive
evaluation on rule insert is required** — a user who already has five castles
gets the badge the moment we add it.

**No streaks, no decay, no expiry.**

### 8.12 Tales — the lore layer

Every point can carry a **tale**: sourced history, placename etymology,
architectural description, archaeological classification.

**C4 is absolute: no invented history.** Every published lore row carries
`source_name`, `source_url`, `licence`, and `attribution_text`. An LLM may
*compress or rewrite* text we already hold from a cited source, under human
review. It may never originate a fact. A hallucinated claim about a real
monument is a reputational failure, a heritage-sector relationship failure,
and — given §16 — a due-diligence failure.

**Lore kinds**, in descending confidence:

| Kind | Source | Licence |
|---|---|---|
| `archaeology` | Archaeological Survey of Ireland (SMR) | **CC BY 4.0** ✅ |
| `architecture` | NIAH — the Description and Appraisal prose | **data.gov.ie open** ✅ |
| `placename` | Logainm — Irish form and meaning | **CC BY 4.0** ✅ |
| `fact` | Wikidata | **CC0** ✅ |
| `reference` | Wikipedia | CC BY-SA — **link out, don't embed** ⚠️ |
| `folklore` | Dúchas / Schools' Collection | **CC BY-NC — commercially blocked** ❌ |
| `editorial` | Written or edited by us | Ours |

**The Dúchas problem, stated plainly.** The 1937–38 Schools' Collection —
schoolchildren recording local folklore townland by townland — is the single
best "tale of a point" source that exists for Ireland, and it is licensed
**CC BY-NC 4.0**. That excludes commercial use. Three options: omit it;
**link out to it only** (linking is not reuse, and is the v1 answer); or
approach UCD for a licence. Given §16, this is worth a conversation with the
National Folklore Collection — but the pipeline must not depend on it.

Presentation: the tale is a popover on the point, expandable, with visible
attribution. Reading tales is itself a progression dimension — it rewards
the behaviour the whole dataset exists to enable.

### 8.13 Collections and sharing

A collection is an ordered set of quests with title, description and
visibility. *"Castle ruins by rivers", 8 quests in Ireland* is the canonical
case and must work exactly.

Create from scratch or from a completed quest · user-controlled order ·
`private` (default) / `unlisted` (link) / `public` (discoverable) · stable
slug URLs, server-rendered with link-preview metadata, viewable signed-out
with a signup prompt to walk it · walking someone's collection creates *your*
walks against *their* quests, never modifying theirs · per-viewer completion
("3 of 8") · **report/takedown path**, non-negotiable the moment anything is
public.

Not in v1: forking, collaborative editing, comments, ratings, a discovery
browse surface.

### 8.14 Admin — the curation console

**Partly promoted into v1.** v0.1 deferred admin entirely; that is no longer
tenable, because a curated corpus and a chain-free dataset *require* a review
tool. The **media generation** half stays deferred.

**Security model, decided now:**

- `is_admin` is a **boolean column on `profiles`**, default false, writable
  only by the service role. **Never `user_metadata`** — that is user-writable
  via `supabase.auth.updateUser`.
- Enforced in **three** places, all required: proxy redirect, a server-side
  check in every admin route handler and server action, and RLS on admin
  tables. Middleware alone is not access control.
- Seeded by migration to Josh's account id only.
- Every admin action written to an append-only `admin_audit` table.

**v1 admin surfaces** (`/admin`):

| Surface | Job |
|---|---|
| **Chain review** | Work the 0.35–0.70 chain-confidence band; approve/deny; maintain the deny and allow lists (§9.3) |
| **Point review** | Sampled QA on geometry, category, completion radius, closure reports |
| **Tale editor** | Write and edit lore, attach sources, set licence, publish |
| **Quest review** | Preview built quests on a map; publish, reject, or edit objectives |
| **Pipeline runs** | Trigger and monitor ingestion passes; see per-pass counts and diffs |
| **Reports queue** | User reports: closed down, wrong location, unsafe route, bad tale |

**Deferred to v2 — `/admin/media`:** batch media generation with hard
per-day caps, review/approve/reject, publish to Supabase Storage, attach to
points and categories.

---

## 9. The taxonomy

The spine of progression, and therefore v1, not v2.

### 9.1 Heritage and landscape

| Group | Categories |
|---|---|
| **Fortified** | `castle`, `castle_ruin`, `tower_house`, `ringfort`, `hillfort`, `martello_tower`, `bawn` |
| **Sacred** | `church_ruin`, `abbey`, `monastic_site`, `holy_well`, `high_cross`, `round_tower`, `historic_graveyard` |
| **Ancient** | `megalithic_tomb`, `dolmen`, `stone_circle`, `standing_stone`, `ogham_stone`, `cairn`, `souterrain`, `fulacht_fiadh` |
| **Water** | `waterfall`, `river_crossing`, `lough_shore`, `harbour`, `lighthouse`, `canal_lock`, `sea_arch` |
| **Green** | `ancient_woodland`, `forest_park`, `nature_reserve`, `bog`, `esker`, `demesne` |
| **Elevation** | `viewpoint`, `summit`, `cliff`, `sea_stack` |
| **Built** | `historic_bridge`, `mill`, `windmill`, `folly`, `lime_kiln`, `industrial_ruin`, `railway_remnant`, `famine_road` |
| **Curious** | `sculpture`, `mural`, `mass_rock`, `memorial`, `oddity` |

### 9.2 Local hospitality

| Group | Categories |
|---|---|
| **Table** | `independent_cafe`, `independent_restaurant`, `pub_food`, `traditional_pub`, `bakery`, `farm_shop`, `market` |

Every one carries `independent_only = true`. There is no chain variant of
these categories, by construction — a chain is not a lesser member of
`independent_cafe`, it is **excluded from the dataset**.

### 9.3 The no-chains rule

C3, mechanised. Full pipeline detail in
[`data-pipeline.md`](./data-pipeline.md) §5; the product rules:

- Every hospitality point gets a **`chain_confidence` score, 0–1**, from
  independent signals: OSM `brand:wikidata` (the strongest — OSM's own chain
  marker), `brand` and `operator` tags, national name-frequency analysis,
  shared website domains, and a curated denylist.
- **Publish only below 0.35.** The **0.35–0.70 band goes to human review** in
  the admin console. Above 0.70 is auto-excluded.
- A curated **allowlist** protects genuine independents with two or three
  sites — a local bakery with a second shop is still local.
- Also excluded: supermarket and petrol-forecourt food counters, hotel-chain
  restaurants, franchise operations under any name.
- **A chain in production is a P1 bug**, with a user report path straight to
  the review queue.

### 9.4 Rules

- One **primary category** per point (what it counts toward), plus
  **secondary tags** (what it can also satisfy). A holy well by a river is
  `holy_well` primary, `water` secondary.
- Every category has a **rarity weight** driving scoring and XP.
- Categories are **data**, in `poi_categories`. Adding one is an insert plus
  a re-tag pass.
- Quest-level tags (`forest`, `coastal`, `monastic`) derive from objective
  categories plus the landcover the route crosses — which is what makes
  "complete 3 forest sidequests" expressible.

---

## 10. Data model

Additive to what exists. `profiles`, `user_settings` and the auth trigger
survive; `quests` is replaced by the `quests` / `walks` split.

```
profiles            id, display_name, avatar_url, home_country,
                    unit_system, is_admin, created_at

user_settings       user_id, last_lat, last_lng, last_fix_at, last_accuracy_m,
                    default_tier, privacy_acknowledged, updated_at

saved_locations     id, user_id, name, lat, lng

countries           iso2 PK, name, geom geography(MultiPolygon), bbox
zones               id, country_iso2, kind (townland|parish|barony|county),
                    name, name_ga, name_meaning, parent_id,
                    geom geography(MultiPolygon) [GiST], area_m2

poi_categories      id PK, group, label, rarity_weight, independent_only,
                    default_completion_radius_m, default_dwell_s, icon_key

pois                id, country_iso2, zone_id, category_id, name,
                    geom geography(Point) [GiST],
                    completion_radius_m, dwell_s,
                    quality_score, lore_richness,
                    chain_confidence, chain_signals jsonb, independent bool,
                    opening_hours, availability_checked_at,
                    source, source_ref, osm_type, osm_id, wikidata_id,
                    status (draft|published|excluded|closed),
                    UNIQUE (source, source_ref)

poi_lore            id, poi_id, kind, title, body,
                    source_name, source_url, licence, attribution_text,
                    confidence, reviewed_by, reviewed_at, published

quests              id, country_iso2, tier, start_lat, start_lng, zone_id,
                    title, flavour, difficulty,
                    distance_m, est_duration_s, ascent_m, surface_summary,
                    route_polyline text, routed bool,
                    generator_version, seed, tags[],
                    status (draft|published|retired),
                    created_by (null = system), visibility, created_at

quest_objectives    id, quest_id, ordinal, poi_id, lat, lng,
                    required bool, kind, prompt, completion_radius_m

walks               id, user_id, quest_id, status,
                    started_at, completed_at, distance_m, duration_s,
                    track_polyline text,          -- user-deletable
                    tiles_gained, xp_awarded, flagged
                    -- partial unique index: one active walk per user

walk_objectives     walk_id, objective_id, completed_at,
                    verified_lat, verified_lng, verified_accuracy_m

explored_cells      user_id, h3_cell bigint, country_iso2, first_seen, walk_id
                    PK (user_id, h3_cell)
user_zones          user_id, zone_id, coverage_pct, unlocked_at
                    PK (user_id, zone_id)
poi_visits          user_id, poi_id, first_visited_at, visit_count
                    PK (user_id, poi_id)

collections         id, owner_id, slug, title, description, visibility,
                    country_iso2, item_count, created_at
collection_items    collection_id, quest_id, ordinal, note

unlock_rules        id, type, params jsonb, label, badge_key, xp_reward, active
user_unlocks        user_id, rule_id, unlocked_at, walk_id

chain_denylist      id, pattern, match_kind (name|brand|domain|operator), note
chain_allowlist     id, pattern, match_kind, note
reports             id, reporter_id, target_kind, target_id, reason,
                    body, status, resolved_by, resolved_at
pipeline_runs       id, pass, started_at, finished_at, counts jsonb, notes
media_assets        id, kind, storage_path, prompt, model, status   -- v2
admin_audit         id, actor_id, action, target, payload, created_at
```

**RLS**

- User-owned tables: own rows only, no exceptions.
- Reference data (`pois`, `poi_lore`, `poi_categories`, `zones`, `countries`,
  `quests` where `status='published'`, `unlock_rules`): read-only to
  authenticated users, writable only by service role.
- `quests` visibility: readable if published, **or** `created_by =
  auth.uid()`, **or** it appears in a non-private collection. The one
  genuinely non-trivial policy in the system — **it needs a test.**
- `collections`: owner, or `visibility != 'private'`.
- Admin tables: `is_admin = true` on the requester's profile.

**Changes from the current schema**

- **PostGIS is required.** Bare `double precision` lat/lng can't answer
  "points within 2 km" efficiently. The most important upgrade in the list.
- `quests.route jsonb` → `route_polyline text` (encoded). 10–50× smaller and
  the format every mapping library reads.
- The word-bank columns (`action`/`item`/`descriptor`/`prompt_text`) are the
  old generator's output shape baked into the schema. Gone.
- `pg_trgm` for name search and for chain name-matching.

---

## 11. Architecture

### 11.1 Stack

Next.js 16 App Router · React 19 · TypeScript strict · Tailwind v4 ·
Supabase (Auth, Postgres+PostGIS, Storage) · Vercel. Adding: `maplibre-gl`,
`h3-js`, `pmtiles`.

### 11.2 Decision — we build the basemap

**MapLibre GL JS rendering vector tiles we generate ourselves and host as a
single PMTiles file.**

| Option | Verdict |
|---|---|
| Leaflet *(current dep, unused)* | **Drop.** No vector styling, pitch, extrusions or terrain. Every requirement is outside what it does. |
| Mapbox | **No.** Proprietary, per-map-load pricing, and it locks the renderer to the vendor. Violates C1 and C2. |
| MapTiler | **No for MVP.** Was the v0.1 pick; violates C1. Good fallback if self-hosting proves painful. |
| **Self-built PMTiles + MapLibre** | **Yes.** Satisfies C1 and C2 outright. |

**How.** `tilemaker` or `planetiler` over the Geofabrik Ireland extract,
emitting only the layers we need — land, water, green, paths and roads,
buildings — as a single `.pmtiles` archive. Hosted on Supabase Storage (free
tier, supports HTTP range requests, which is all PMTiles needs). The
`pmtiles` JS library reads ranges directly; **no tile server process, no
per-request cost.**

**The size trick:** build to **z0–14 only** and let MapLibre **overzoom** to
z18. Vector tile geometry scales cleanly, so a z14 tile renders sharp at z18
— you lose nothing that matters for a walking map. Ireland at z0–14 with a
trimmed layer set lands comfortably inside the free storage tier, where a
full z0–18 build would not.

Rebuild monthly alongside the POI refresh. Attribution is required by the
ODbL and will be present — styled to fit, not stock chrome.

### 11.3 Decision — routing runs offline, not in production

**Valhalla in Docker on a local machine, used only to build the corpus.**

| Option | Verdict |
|---|---|
| Public OSRM demo *(current)* | **Must go.** Explicitly not for production, rate-limited, no SLA. |
| Hosted routing (Mapbox, GraphHopper) | Violates C1. |
| Self-hosted routing server | A VPS is a monthly bill. Violates C1 for MVP. |
| **Offline Valhalla, corpus pre-built** | **Yes.** Zero runtime cost, zero hosting, and it enables the curation that makes the corpus good (§8.5). |

Valhalla over OSRM because one binary gives pedestrian costing with
surface and steepness awareness, **isochrones** (what's reachable in 45
minutes on foot — directly the tier model), a **matrix** (rank 30 candidates
in one call instead of 30), and **map-matching**. All of it offline.

Keep `lib/routing.ts`'s straight-line fallback only as a **surfaced** last
resort, never presented as a real route — and add fallback-rate telemetry,
which currently doesn't exist.

**When live generation returns (v1.5)**, the same Valhalla container goes on
a small VPS. By then it's a deliberate spend against known demand, not a
launch prerequisite.

### 11.4 Decision — we own the places data

**OSM plus Irish national open data, ingested into our PostGIS. No
third-party places API, ever.**

Because: our taxonomy is ours and no external categories will match it;
progression needs denominators only a local dataset can give; chain
exclusion is impossible against a black-box ranking that is *optimised to
surface chains*; scoring needs dozens of spatial queries per quest build;
and C1 forbids per-request charges.

Full pipeline, sources, licences and quality passes:
**[`data-pipeline.md`](./data-pipeline.md)**.

### 11.5 Decision — tiling

**H3 hexagons, res 11 canonical. Not lat/lng circles.**

| | Radius circles | Square grid | **H3** |
|---|---|---|---|
| Countable | No — they overlap | Yes | **Yes** |
| Tessellates | No | Yes | **Yes** |
| Uniform neighbours | n/a | No (diagonals) | **Yes** |
| Latitude distortion | n/a | Severe | **Handled** |
| Storage | Centre+radius, unbounded | Two ints | **One 64-bit int** |
| Multi-res rollup | No | Awkward | **Native** |

Circles fail immediately: overlapping circles can't produce an honest "1,284
tiles" without an expensive geometric union. Hexagons give it as `count(*)`.

Ladder: **res 11** (~2,150 m²) stored · **res 9** (~0.105 km²) if the
displayed count needs to be a smaller number · **res 8** (~0.74 km²) derived
for region stats. Res 12 only if 50 m reveal bands look chunky — it costs 7×
the rows.

Townland zones (§8.10) sit **beside** this, not instead of it.

### 11.6 Client state

Zustand for live-walk state (position, progress, tile buffer) · TanStack
Query for server data · IndexedDB for territory and the offline walk cache ·
Framer Motion honouring the existing reduced-motion guard. **Add none of
these until a screen needs them.**

### 11.7 PWA and offline — an honest constraint

**Background geolocation does not work in a PWA.** On iOS a backgrounded or
locked web app stops receiving `watchPosition` callbacks; on Android it's
unreliable and power-managed. No web workaround exists.

Consequences, to be designed around and stated to users:

- Tiles are captured reliably only while the app is **foregrounded**.
- Mitigations: `navigator.wakeLock` during an active walk; a one-time plain
  explanation at first start; and **bounded gap-filling** — on return to
  foreground, interpolate along the *routed line* between last and current
  fix and unlock those tiles, only when the gap is short and the geometry
  plausible. Deliberate generosity, not a correctness claim.
- Objectives are checked on foreground return as well as live.
- Real background tracking needs a native shell (Capacitor). v2, and only on
  evidence that foreground-only is costing completions.

Service worker v1: app shell, the active quest, and its tales. Offline
basemap tiles are v1.5 — though PMTiles makes that unusually easy, since the
archive is one cacheable file.

---

## 12. Cost model — the zero-spend MVP

C1 in full. Every line is free-tier or one-off local compute.

| Line | How | MVP cost |
|---|---|---|
| App hosting | Vercel | £0 (hobby)¹ |
| Database, auth, storage | Supabase free tier | £0 |
| Basemap tiles | Self-built PMTiles on Supabase Storage | £0 |
| Routing | Valhalla in Docker, **local machine, offline** | £0 |
| POI + heritage data | OSM, data.gov.ie, Logainm, Wikidata | £0 |
| Quest corpus | Built offline, stored in Postgres | £0 |
| Lore | Sourced and human-edited; **no LLM API in v1** | £0 |
| Geocoding | None — local PostGIS country/zone lookup | £0 |
| **Total recurring** | | **£0** |

¹ Vercel's hobby tier prohibits commercial use. The moment there's revenue
or investment, that becomes a Pro seat — the only certain future line item,
and a small one. Flagged rather than glossed.

**Where cost appears later, and why it's a choice not a surprise:**

| Trigger | Line | Order |
|---|---|---|
| Supabase free tier outgrown | Supabase Pro | ~$25/mo |
| Live on-demand generation (v1.5) | A small VPS for Valhalla | ~£5–15/mo |
| Storage egress on tiles | Cloudflare R2 (free tier, no egress fees) | ~£0 |
| LLM-assisted lore drafting (v2) | Cached per point, one-off per row | Small, bounded |

The design principle: **every expensive thing is fixed-cost and self-hosted;
every per-request thing is local.** That is the structural answer to
"keeping price points as low as possible", and it is why the MapLibre,
PMTiles and offline-Valhalla decisions are what they are.

---

## 13. Privacy, safety, legal

**Privacy.** Territory stores **cells, not tracks** — a res-11 cell set can't
be replayed as a route and reveals no speed, direction or dwell. The per-walk
track polyline is the only replayable path and is individually deletable.
Location is never shared with another user in v1; a shared collection exposes
*quests*, not anyone's track. `last_location` is clearable. Deletion cascades;
export on request. The plain-language explanation lives in the priming screen
(§8.2), not a policy page.

**Safety.** Pedestrian-costed routes that avoid roads without pedestrian
access; where a route uses a road with no pavement, **say so in the
preview**. Surface, gradient and stile warnings. Never route onto
`access=private` land. Flag when a tier's duration would end after sunset —
inform, don't block. Objectives never require entering a building, climbing,
or leaving a path; completion radii are generous by design. Visible
"use your judgement" disclaimer and a one-tap unsafe-route report.

**Legal.** OSM/ODbL attribution and database share-alike. CC BY attribution
for SMR, NIAH and Logainm. **Dúchas is CC BY-NC — link only, never embed**
(§8.12). Wikipedia CC BY-SA — link, don't embed. Public collections are UGC
pointing at physical places, so moderation and takedown ship with public
visibility. Standard GDPR: lawful basis, retention, export, deletion.

**Get the ODbL share-alike posture reviewed before public launch.** Our
derived `pois` table is a substantial OSM derivative and the obligations are
real. It is a solvable question, not a blocker — but solve it deliberately.

---

## 14. Metrics

**Activation funnel:** signup → location granted → tier chosen → quest
previewed → quest completed. The location prompt is the expected cliff.

**Core:** quests per active per week · **preview→start rate** (best proxy for
corpus quality) · **reroll depth** (rising = corpus thin in an area) ·
completion rate · tiles and townlands per week · **tale open rate** (does the
curation actually get read?) · category breadth.

**Retention:** D1/D7/D30, and second-quest-within-14-days.

**Data quality guardrails:** chains reaching production (**target: zero**) ·
closure reports per 1,000 hospitality points · lore rows without a source
(**must be zero**) · objective verification failure rate (high = bad
geometry) · tier duration accuracy — actual vs target, per tier.

---

## 15. Release plan

### v0.5 — Foundations
Repo strip-back (`repo-review.md` §6). PostGIS. Schema migrated to
`quests`/`walks`/`pois`/`zones`. MapLibre replaces Leaflet. Self-built
PMTiles basemap for Ireland. Auth gaps closed. **Data pipeline passes 0–3
running** (`data-pipeline.md`). No new user-facing features.

### v0.75 — The dataset
Passes 4–7: chain filtering, enrichment, lore, scoring, human review. Admin
curation console. Quest corpus built and reviewed for a **pilot region**
(proposed: Co. Clare + Galway city) rather than all Ireland at once. Prove
the pipeline and the review workload on a real subset before scaling.

### v1 — The loop
Location priming and capture · country lock and custom map · tier selection ·
quest selection with reroll · preview with terrain and safety honesty · live
walk with trail and server-verified objectives · fog of war and townland
zones · progression and unlocks · tales · history · collections (private and
unlisted) · PWA. **National corpus published.**

*Done when a stranger in Ireland can sign up, walk a Stroll, learn what their
townland's name means, and see their map change — with no help.*

### v1.5 — Depth
Live on-demand generation (Valhalla on a VPS — a deliberate first spend) ·
3D buildings and terrain, capability-gated · public collections with slugs ·
photos on walks · offline basemap · territory compaction · second country.

### v2 — Reach
LLM-assisted lore drafting under human review (**never originating facts**) ·
admin media generation · notifications · native shell if evidence demands it ·
partnerships with heritage bodies.

---

## 16. The dataset as an asset

Noted because it changes what "good" means for the pipeline, and because it
is the reason C3 and C4 are constraints rather than preferences.

What we are building, as a by-product of building the app: **a
categorised, geocoded, chain-free, lore-enriched database of local Ireland,**
with provenance and licence tracked per row, and quality reviewed by hand.

Nothing like it is commercially available. Google's places data is optimised
for commerce and systematically buries the independent. The heritage datasets
are excellent but siloed, un-joined, and unusable as a product surface. The
join — heritage + placename + independent hospitality + walkable routes
between them — is the thing that doesn't exist.

That matters in four directions: **tourism** (Fáilte Ireland, local
authorities, heritage trails), **licensing** (the dataset itself, to anyone
who needs non-chain local data), **partnership** (heritage bodies who want
their records *walked* rather than filed), and **defensibility** — a
competitor can copy the app in a month and cannot copy four passes of human
curation.

Two implications for how we build:

1. **Provenance is not optional.** Every row carries source, licence and
   attribution from day one. Retrofitting provenance onto a scraped dataset
   is impossible, and its absence is fatal in diligence.
2. **The licence audit is real work, not paperwork.** The Dúchas finding
   (§8.12) is exactly the kind of thing that looks like a detail and is
   actually a constraint on what the business can be.

---

## 17. Open questions

| # | Question | Needed by |
|---|---|---|
| Q1 | Confirm Ireland, and the pilot region for v0.75 | v0.5 |
| Q2 | Fog at H3 res 11 or res 12? | v1 |
| Q3 | Tile count shown at res 11 (big, noisy) or res 9 (meaningful)? | v1 |
| Q4 | Townland unlock threshold — 15% coverage? | v1 |
| Q5 | **Aesthetic direction** — blocks strip-back tier two | v1 |
| Q6 | Do public collections need a browse surface, or is link-sharing enough? | v1.5 |
| Q7 | ODbL share-alike posture on our derived dataset | pre-launch |
| Q8 | Re-walk the same quest for progression? *(proposed: yes, count points once)* | v1 |
| Q9 | Keep "Sidequest" as both the app and the 90-min tier? | v1 |
| Q10 | Approach UCD about a commercial Dúchas licence? | v1.5 |
| Q11 | Corpus size target — 1,500 anchors × 4 tiers × 2 variants ≈ 12,000 quests. Right? | v0.75 |
| Q12 | Is foreground-only tile capture acceptable, or does it force a native shell? | v1.5 |

---

## 18. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **Location permission denial** | Fatal | Priming screen, first-class pin-drop, denied recovery (§8.2) |
| **The corpus is mediocre** | Fatal | Human review before publication, lore-weighted scoring, reroll-depth telemetry, shape-quest fallback |
| **Curation workload is underestimated** | High | Pilot region in v0.75 measures real review cost before national scale |
| **A chain reaches production** | High | Multi-signal scoring, review band, user reports, P1 treatment (§9.3) |
| **Hospitality data goes stale** — closures | High | Freshness scoring, food stops always optional, in-app closure reports |
| **PMTiles self-hosting is painful** | Medium | MapTiler is a drop-in fallback; MapLibre makes the vendor swap a config change |
| **Background location** | Medium | Foreground design + wake lock + bounded gap-fill; honest up front |
| **ODbL share-alike** | Medium | Legal review pre-launch (Q7) |
| **Fog row growth** | Medium | Compaction path specified (§8.10) |
| **Scope creep into a social product** | Medium | Explicit non-goal; collections ship link-only |
| **Solo-maintainer bus factor** | Medium | Everything in-repo — this PRD, the pipeline doc, no undocumented vendor magic |
