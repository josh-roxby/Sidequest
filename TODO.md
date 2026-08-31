# Side Quest — TODO

Live punch list, organised by the release phases in
[`docs/PRD.md`](./docs/PRD.md) §15. `README.md` stays lean; this is the
authoritative "what's left".

**Legend:** `[x]` done · `[ ]` outstanding · `[~]` exists but must be
replaced or reworked

Companion docs: [PRD](./docs/PRD.md) · [Repo review](./docs/repo-review.md) ·
[Fog of war](./docs/fog-of-war.md)

---

## Done (carried forward from the prototype)

### Foundations
- [x] Next 16 App Router + React 19 + TypeScript strict + Tailwind v4
- [x] Design tokens in `:root` bridged to Tailwind via `@theme inline`
- [x] Fraunces + Plus Jakarta Sans via `next/font`
- [x] `prefers-reduced-motion` global guard
- [x] `lib/cn.ts`, `lib/env.ts` (`required()` + auth-disabled preview mode)

### Auth
- [x] Supabase browser / server / middleware clients with session rotation
- [x] `proxy.ts` (Next 16 convention) with correct matcher excluding `/api/*`
- [x] Route protection + onboarding gate redirect matrix
- [x] `/auth/callback`, `/auth/signout`, `/login`, `/signup`
- [x] `/welcome` 5-step onboarding carousel
- [x] `NEXT_PUBLIC_AUTH_DISABLED` preview mode with `DEMO_USER`

### Schema
- [x] `profiles` / `user_settings` / `quests` with RLS on every table
- [x] Auto-profile trigger, `updated_at` triggers
- [x] One-active-quest-per-user partial unique index *(pattern carries to `runs`)*

### UI
- [x] Shell: `PhoneFrame`, `BottomNav`, `ScreenContainer`
- [x] Primitives: `Card`, `Button`, `Eyebrow`, `ProgressBar`, `Pill`
- [x] Marks + illustrations (subject to the strip-back below)
- [x] Screen scaffolds: landing, home, map, quests, journal, profile

### Infra & docs
- [x] CI: audit → lint → type-check → build on PR
- [x] `/api/healthz` probe
- [x] `docs/fog-of-war.md` — H3 storage architecture *(adopted by the PRD as-is)*
- [x] `docs/PRD.md` — full product requirements
- [x] `docs/repo-review.md` — full repo review

---

## Phase v0.5 — Foundations & strip-back

*No new user-facing features. Make the repo honest and the data model right.*

### Strip-back, tier one — no design judgement needed
- [x] Delete `Te.txt`
- [ ] Replace fabricated screen data with honest empty states
      — `/home` fake weather + `level 7 / 620 XP`
      — `/map` "Lakeside Loop / 2.5 km / 32 min / 30%"
      — `/quests` the entire fake "Find something purple" quest
      — `/profile` badge grid rendered from nothing
      *(`/journal` already does this correctly — copy its pattern)*
- [ ] Delete `components/shell/StatusBar.tsx` (fake iOS chrome under the real one)
- [ ] Retire `hooks/use-project-storage.ts` (territory goes to IndexedDB, not localStorage)
- [ ] Remove `leaflet`, `react-leaflet`, `@types/leaflet`, `styles/map.css`
- [ ] Either commit `SideQuestDesign.md` or remove the four references to it
      (`app/globals.css`, `PhoneFrame.tsx`, `MapBottomCard.tsx`, this file)
- [ ] Reconcile `README.md`'s `main`/`dev` branch story with reality

### Strip-back, tier two — blocked on the aesthetic decision (PRD Q5)
- [ ] Reduce `FlowerMedallion` / `ShieldBadge` / `Pins` / `Landscape` /
      `Backpack` to a swappable `<Icon>` / `<Badge>` interface over an asset
      map, so art direction is a directory swap not an SVG edit
- [ ] Decide whether `PhoneFrame`'s desktop phone silhouette stays
- [ ] Re-decide the palette values in `:root` *(keep the structure — it's right)*
- [ ] Hold the painted-asset pipeline until the direction is set

### Database
- [ ] Enable PostGIS (`create extension postgis`) — **blocks everything spatial**
- [ ] Enable `pg_trgm` for name search
- [ ] Migrate `quests` → `sidequests` + `sidequest_objectives` + `runs` +
      `run_objectives` (PRD §10)
- [ ] `pois` + `poi_categories` + `countries` tables with GiST indexes
- [ ] `explored_cells`, `poi_visits`
- [ ] `collections`, `collection_items`
- [ ] `unlock_rules`, `user_unlocks`
- [ ] Store polylines as encoded strings, not `jsonb` arrays of pairs
- [ ] RLS for every new table
- [ ] **RLS test for the `sidequests` visibility policy** (own OR in a
      non-private collection) — the one non-trivial policy in the system
- [ ] Account deletion cascade + data export (GDPR)

### Map layer
- [ ] Add `maplibre-gl`; build `<QuestMap>` wrapper
- [ ] Port the hard-won iOS/Leaflet lessons: NaN coord guards, `getBounds()`
      avoidance, `requestAnimationFrame` defer on pin set, z-index isolation
- [ ] Keep `IllustratedMap` behind a flag as `<MapPlaceholder>` until the
      MapLibre style lands, then delete it

### POI data — the long pole, start early
- [ ] Finalise the taxonomy in PRD §9 (groups, categories, rarity weights)
- [ ] Geofabrik Ireland extract → tag filter → `osm2pgsql` → `pois`
- [ ] Wikidata / Wikipedia enrichment (descriptions, images)
- [ ] `quality_score` computation
- [ ] Per-POI `completion_radius_m` overrides for large sites
- [ ] Monthly refresh job
- [ ] **ODbL / CC BY-SA licensing review before any public launch** (PRD Q7)

### Routing
- [ ] Stand up self-hosted Valhalla with the Ireland extract
- [ ] Repoint `lib/routing.ts`; keep straight-line fallback as a *surfaced*
      last resort, never silently presented as a route
- [ ] Add fallback-rate telemetry (currently unmeasurable)
- [ ] Terrain/gradient-adjusted duration to replace the flat 5 km/h

### Auth gaps
- [ ] Enforce email verification before app access
- [ ] Password reset (`resetPasswordForEmail` + `/auth/update-password`)
- [ ] Magic-link sign-in
- [ ] Google + Apple OAuth
- [ ] Display-name field on signup *(the DB trigger already reads it)*
- [ ] Friendly error mapping for Supabase auth errors

### Testing
- [ ] Add Vitest; unit-test `lib/geo.ts`, the H3 quantiser, the scorer
- [ ] Add Playwright for the auth + onboarding + run flows
- [ ] Wire both into CI

---

## Phase v1 — The loop

*Done when a stranger in Ireland can sign up, walk a generated quest, and see
their map change, with no help.*

### Location capture (PRD §8.2) — highest-risk funnel step
- [ ] Priming screen; **never** call geolocation on page load
- [ ] First-class "pick a place on the map instead" alternative
- [ ] `navigator.permissions.query` denied-state detection + recovery copy
- [ ] Accuracy gate — reject fixes worse than 100 m for generation
- [ ] Persist `last_location` so a returning map opens in the right place
- [ ] Saved named locations ("home", "mum's")
- [ ] Jitter filter (max jump per sample) on `useLiveLocation`

### Country lock (PRD §8.3)
- [ ] Natural Earth admin-0 → `countries` table
- [ ] Local PostGIS reverse-resolve on first fix → `profiles.home_country`
- [ ] Camera `maxBounds`; country polygon as the board, out-of-bounds treatment
- [ ] Explicit country-switch prompt when a fix lands elsewhere — never silent

### Map (PRD §8.4)
- [ ] Custom country-locked MapLibre style — ours, minimal labels
- [ ] Pins: current location, objectives, discovered POIs, hinted POIs
- [ ] **One shared overlay primitive** with popover / modal / tooltip modes —
      focus trap, dismiss, safe areas, reduced motion solved once
- [ ] Trail rendering: out vs return, walked vs remaining
- [ ] Styled (not stock) attribution that still satisfies the licence

### Generation (PRD §8.5) — the heart; give it the most time
- [ ] Server-side generation endpoint, idempotent by seed
- [ ] Annulus candidate query via `ST_DWithin`
- [ ] Scoring: rarity × quality × visit-penalty × **new-territory gain**
- [ ] Valhalla matrix call to rank candidates in one request
- [ ] Loop routing with perpendicular return corridor
      *(reuse `midpointWaypoints` — it's already exactly this)*
- [ ] Secondary objectives from POIs within ~150 m of the polyline, cap 3
- [ ] Douglas–Peucker simplification before persisting
- [ ] **Shape-quest fallback** for sparse areas — never fail to generate
- [ ] Non-walkable origin snapping (250 m) with a plain message if impossible
- [ ] `generator_version` stamped on every sidequest
- [ ] Reroll with anchor exclusion list; log reroll depth
- [ ] Per-user rate limit; p95 < 1.5 s

### Preview & run (PRD §8.6–8.8)
- [ ] Preview modal: route, objectives, distance, duration, difficulty
- [ ] **Terrain and safety honesty** — unpaved, no pavement, steep, stiles,
      finishes after sunset
- [ ] Start / pause / resume / abandon; abandoning keeps unlocked tiles
- [ ] One active run per user, enforced in the database
- [ ] Live position, progress by nearest-point-on-line projection
- [ ] Objective geofence: 40 m default, 15 s dwell
- [ ] **Server-side re-verification** of every completion
- [ ] Implied-speed plausibility check → flag, don't block
- [ ] Offline: cache route + objectives + POI metadata at start; sync on reconnect
- [ ] `navigator.wakeLock` during an active run
- [ ] Foreground-return gap-fill along the routed line (bounded)
- [ ] One-time honest explanation of the foreground-only limitation

### Fog of war (PRD §8.10, `docs/fog-of-war.md`)
- [ ] `h3-js` + `lib/fog/h3.ts` quantiser (res 11)
- [ ] `lib/fog/local-store.ts` IndexedDB store
- [ ] Canvas overlay with soft reveal
- [ ] `explored_cells` + `append_explored` RPC returning new-cell count
- [ ] End-of-run sync + app-load hydration (paginated for heavy users)
- [ ] Per-country scoping
- [ ] Derived region stats via `cellToParent(cell, 8)` — never stored twice

### Progression (PRD §8.11)
- [ ] XP award: base + objectives + new territory + first-visit category bonus
- [ ] `poi_visits` driving category counts with honest country denominators
- [ ] `unlock_rules` as data: `category_count`, `category_sweep`,
      `quest_count`, `territory`, `distance`, `collection`
- [ ] Server-side evaluation after each run
- [ ] **Retroactive evaluation when a rule is inserted**
- [ ] Progression screen: categories, territory, badges
- [ ] No streaks, no decay, no expiry

### History
- [ ] Chronological run list from real data
- [ ] Detail view: route map, objectives, stats
- [ ] Category filter; name search via `pg_trgm`
- [ ] **Per-run track deletion** (the only replayable path we store)
- [ ] Fog on the history hero map; not on per-run thumbnails

### Collections (PRD §8.12)
- [ ] Create; save a completed quest into one
- [ ] User-controlled ordering
- [ ] Visibility: private (default) / unlisted / public
- [ ] Stable slug URLs, server-rendered with link-preview metadata
- [ ] Viewable signed-out with a sign-up prompt to walk it
- [ ] Walking someone else's collection creates *your* runs against *their* sidequests
- [ ] Per-viewer completion state ("3 of 8")
- [ ] Report / takedown path — required the moment anything is public

### PWA
- [ ] Manifest + icon set + apple-touch-icon
- [ ] Service worker: app shell + active run cache
- [ ] Install prompt after the **first completed run**, never before
- [ ] iOS manual "Add to Home Screen" instructions (`beforeinstallprompt` doesn't fire)

### Production hardening
- [ ] Vercel project + env wiring
- [ ] `not-found.tsx` and `error.tsx` boundaries
- [ ] Analytics for the funnel in PRD §14
- [ ] Dependabot / Renovate
- [ ] Preview deployments on PR

### Accessibility
- [ ] `aria-label` audit for every icon-only button
- [ ] ≥44 px touch targets verified
- [ ] Tooltips must work on tap, not hover only
- [ ] Reduced-motion respected by map transitions and fog reveals
- [ ] WCAG AA contrast audit against the final palette

---

## Phase v1.5 — Depth

- [ ] 3D building `fill-extrusion` + `raster-dem` terrain, capability-gated
- [ ] PMTiles self-host migration when tile spend becomes visible
- [ ] Public collection discovery surface *(PRD Q4 — decide first)*
- [ ] Optional photos attached to runs (journal feature, **not** verification)
      — Supabase Storage, signed URLs, 1024 px max, EXIF stripped
- [ ] Territory compaction: res-8 parent rows with 343-bit child bitmaps
- [ ] Second country (GB or FR) — a data operation, not a code change
- [ ] Seasonal / time-of-day quest variation
- [ ] Multiple saved start pins

---

## Phase v2 — Intelligence and reach

- [ ] LLM narrative layer over the procedural plan — titles, flavour,
      objective prompts. Cached per sidequest. **The model never chooses
      where you walk, only how it's described.**
- [ ] On-demand Overpass gap-fill for sparse areas
- [ ] Notifications: opt-in, one category, frequency-capped, never nagging
- [ ] Offline basemap tiles
- [ ] Native shell (Capacitor) **only if** evidence shows foreground-only
      tile capture is costing completions
- [ ] iNaturalist classification for nature objectives
- [ ] Friend leaderboards / social — currently an explicit non-goal

### Admin: media generation page — deferred, Josh's account only
> Deliberately not started. Security model decided up front (PRD §8.14) so
> nobody improvises it later.

- [ ] `is_admin` **boolean column on `profiles`**, default false, writable
      only by the service role
      — **never** `user_metadata`: that is user-writable via `updateUser`
- [ ] Seed migration granting admin to Josh's account id only
- [ ] Enforcement in **all three** places: proxy redirect, server-side check
      in every admin route handler and server action, and RLS on admin tables.
      Middleware alone is not access control.
- [ ] `/admin` shell + `/admin/media`
- [ ] `media_assets` table: kind, storage path, prompt, model, status
- [ ] Batch generation queue, server-side, with **hard per-day caps** so a
      bug cannot run up a bill
- [ ] Review → approve/reject → publish to Supabase Storage
- [ ] Attach approved media to POI / category / collection records
- [ ] Append-only `admin_audit` table for every admin action

---

## Open decisions

Tracked in PRD §16. Summary:

| # | Question | Needed by |
|---|---|---|
| Q1 | Confirm Ireland as the launch country | v0.5 |
| Q2 | Fog at H3 res 11 or res 12? | v1 |
| Q3 | Show the tile count at res 11 (big, noisy) or res 9 (meaningful)? | v1 |
| Q4 | Do public collections need a browse surface, or is link-sharing enough? | v1.5 |
| Q5 | **Aesthetic direction** — blocks strip-back tier two | v1 |
| Q6 | Is foreground-only tile capture acceptable, or is a native shell forced? | v1.5 |
| Q7 | ODbL share-alike posture on derived POI data | pre-launch |
| Q8 | Re-walk the same sidequest for progression? *(proposed: yes, count POIs once)* | v1 |

Settled by the PRD, recorded here so they don't get re-litigated:

| Decision | Outcome |
|---|---|
| Map renderer | **MapLibre GL JS** — Leaflet can't do vector/pitch/3D; Mapbox locks the vendor |
| Tile source | **MapTiler** for v1, **PMTiles self-host** as the cost escape hatch |
| Routing | **Self-hosted Valhalla** — pedestrian costing, isochrones, matrix, map-matching in one binary |
| POI source | **OSM ingested into our own PostGIS**, never a third-party API on the request path |
| Tiling | **H3 hexagons, res 11 canonical.** Circles can't be counted; square grids distort with latitude |
| Sidequest vs run | **Split.** A sidequest is durable and shareable; a run is one person's attempt |
| Generation | **Server-side, procedural, seeded.** LLM is a narrative layer on top in v2, never the planner |
| Objective verification | **Server-verified geofence.** Photos are a journal feature, not proof |
| Launch scope | **One country, properly** |
