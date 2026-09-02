# Side Quest — TODO

Live punch list, organised by the release phases in
[`docs/PRD.md`](./docs/PRD.md) §15. `README.md` stays lean; this is the
authoritative "what's left".

Docs: [Audit](./docs/audit.md) · [Map infrastructure](./docs/map-infrastructure.md) ·
[PRD](./docs/PRD.md) · [Data pipeline](./docs/data-pipeline.md) ·
[Repo review](./docs/repo-review.md) · [Fog of war](./docs/fog-of-war.md)

**Standing constraints** (PRD §3): **C1** zero third-party spend to MVP ·
**C2** we own the GIS · **C3** no chains, ever · **C4** no invented history.

---

## Done

### Foundations
- [x] Next 16 App Router + React 19 + TypeScript strict + Tailwind v4
- [x] Design tokens in `:root` bridged to Tailwind via `@theme inline`
- [x] Archivo + JetBrains Mono via `next/font` *(replaced Fraunces and
      Plus Jakarta Sans in the reface)*
- [x] `prefers-reduced-motion` global guard
- [x] `lib/cn.ts`, `lib/env.ts` (`required()` + auth-disabled preview mode)

### Auth
- [x] Supabase browser / server / middleware clients with session rotation
- [x] `proxy.ts` (Next 16 convention), matcher excluding `/api/*`
- [x] Route protection + onboarding redirect matrix
- [x] `/auth/callback`, `/auth/signout`, `/login`, `/signup`
      *(`/welcome` was removed with the location priming screen)*
- [x] `NEXT_PUBLIC_AUTH_DISABLED` preview mode with `DEMO_USER`

### Schema
- [x] `profiles` / `user_settings` / `quests` with RLS on every table
- [x] Auto-profile trigger, `updated_at` triggers
- [x] One-active-quest partial unique index *(pattern carries to `walks`)*

### UI
- [x] Shell, primitives, marks, illustrations, six screen scaffolds

### Infra & docs
- [x] CI: audit → lint → type-check → build on PR
- [x] `/api/healthz`
- [x] `docs/fog-of-war.md` — H3 territory architecture *(adopted as-is)*
- [x] `docs/PRD.md` v0.2 — tiers, zero-spend, own GIS, curated corpus, lore
- [x] `docs/data-pipeline.md` — the Ireland dataset build
- [x] `docs/repo-review.md` — full repo review
- [x] Source licence audit — **SMR / NIAH / Logainm CC BY (clear);
      Dúchas CC BY-NC (commercially blocked)**

---

## Front end reface (current)

Full plan in [`docs/reface-plan.md`](./docs/reface-plan.md). Runs on mock
data with auth off and no database.

- [x] Strip the previous visual layer: fake status bar, unused storage hook,
      Leaflet, word-bank generator, old illustration and marks sets
- [x] Field survey tokens, Archivo + JetBrains Mono, every number mono
- [x] Primitives: Action, Button, Card, Tabs, Check, Field, Chip, Stat,
      Marks, Skeleton, EmptyState, StatusStrip, LockedCallout
- [x] `Frame`: square and tall ratios, 8px gutter, scale from the thumb
      corner, focus trap, Escape, dismiss at the anchor
- [x] ~~Navigation, both forms: `NavBlock` 2×2 launcher, `NavBar`
      four-across~~ *(superseded by the single button below)*
- [x] `lib/data` read interface with mock and Supabase implementations,
      mock latency and failure switches
- [x] Screens: landing, location priming, home, map, quests, badges,
      outposts, auth
- [x] Migrations 0001 to 0006 written to `supabase/migrations/`, not applied
- [x] Three-radius scale replacing the two-radius rule (visual direction,
      2026-08-31)
- [x] Navigation reduced to one button: tap for the square drawer, press and
      hold and drag for the three-tile shortcut
- [x] Canvas map with pan, pinch zoom, twist rotate, north reset, DPR-capped
      quality scaling
- [x] Hex tiling as the stand-in for H3, with quest tiles drawn as territory
- [x] Pages: History, Badges (collected and earned), Tales, About, Settings
- [x] Interaction hygiene: no text selection on chrome, no tap highlight, no
      rubber band, gestures exclusive to their element
- [x] PWA: manifest, generated icons, Apple touch icon, service worker
- [x] Profile with account header, referral tile, and History, Badges and
      Settings as tabs over the same shared panels the routes use
- [x] Custom tap-first tooltips on the small drawer tiles and the count chips
- [x] Quests: Start is the default, with Community and Custom alongside
      History, and loop or line shown as a chip everywhere
- [x] Landing page rebuilt as the sales page, with drifting topographic
      contours and paired sign in and create account
- [x] Home fits the viewport with a mixed-ratio card shelf
- [x] Map zooms out to the whole island, with hex resolution following zoom
      and coarse tiles clearing only on a majority
- [x] Terrain and ascent aware duration estimates
- [x] Marquee of updates in the drawer footer
- [x] Home shelf on a fixed height, with the countryside band taking the
      leftover space
- [x] Home button in the drawer header
- [x] Outposts: add by map link or current location, for planning a trip from
      somewhere you are not yet
- [x] Full width media cards on About
- [x] Start shows the real map and tiles, and planning takes over the screen
      with the route drawing itself
- [x] Walk screen: map takeover, points along the way, detail unlocked by
      arrival
- [x] Map dock: tiles in view, badges, points, layers
- [x] Home cards standardised to 3:4 with room for media and text
- [x] Updates marquee along the foot of Home
- [x] Planning hands straight into the walk, with a brief of what you might
      run into
- [x] Notes on a walk, pinned at submission, surfaced on the walk record and
      on a profile tab
- [x] Trail record at `/history/[id]`: map, badges earned, tales opened, notes
- [x] Point drawer reads the tale inline as a snippet, still gated on arrival
- [x] Home cards at 3:2 with the left edge on the gutter, and the countryside
      band carrying the foot of the screen
- [x] Leaf and star drawn as real marks, in the header chips
- [x] Notes on the map: own layer, own dock panel, own marker
- [x] Primary actions docked beside the nav button
- [x] Activity feed, reachable from the drawer ticker
- [x] Friends: list, their quests, requests, challenges, referral
- [x] Profile and friends squares in the drawer header
- [x] Tile layer stops subdividing at level 5 and fades out, so a zoomed out
      map shows the island rather than a lattice
- [x] Recentre control beside the compass
- [x] Canvas markers use the same glyphs as the buttons that filter them
- [x] Add to the map: notes, and community points that go to review
- [x] Home band fixed to the nav button height
- [x] Tab panels slide, and no scrolling surface shows a scrollbar
- [x] Settings persist and take effect, including left-handed
- [x] Data export, terms of use and a privacy statement in settings
- [x] Profile edit: name, handle, avatar tint, bio, findability, account
- [x] Home rebuilt around one hero card, the shelf, four ways in and a docked
      begin action
- [x] Map add moved into the dock with its own menu, and its drawers hoisted
      out of the dock's stacking context
- [x] Layer toggles fade instead of blinking the canvas
- [ ] Legal copy reviewed by someone qualified before launch. What is there now
      is honest and plain, not advice
- [ ] Admin review queue for community points, alongside the media console
- [ ] Unlock a point for real from a live position rather than a fixture flag
- [ ] Tile counts in the dock computed from the camera rather than passed in

## Audit punch list

From [`docs/audit.md`](./docs/audit.md), taken 2 September 2026 against a built
app driven in a browser. IDs match that document, where the reasoning and the
measurements live. Ordered so that finishing a block leaves the app better
rather than half-migrated.

### Block 1: wrong on a screen you can reach today

- [ ] **X-01 Touch targets.** 55 controls render under 44px in at least one
      dimension, across 15 of 20 routes. `--hit-min: 44px` is defined,
      documented as the absolute minimum, and referenced by no code. Fix in
      the primitives by separating hit area from visual size, not by inflating
      every control: `Button`, `Check`, `Tabs`, the shape chips, the map dock
      and the back buttons cover most of it
- [ ] **A-01 / S-02 Unlabelled inputs.** `/login`, `/signup` and
      `/profile/edit` each have an input with no accessible name
- [ ] **S-08 The walk's "Read the tale" is hard-coded to `t-1`** and shows the
      wrong tale for every other point
- [ ] **S-01** One 2px radius on the landing page, outside the three-token
      scale
- [ ] **M-01 App icons.** See the artwork section below. Blocks reinstalling
      the PWA with real branding

### Block 2: before live data goes anywhere near this

- [ ] **X-03 Errors are invisible.** `useAsync` returns `error`; one screen of
      seventeen reads it. Standardise it in `Screen` with `StatusStrip`
- [ ] **X-04 Empty states.** Four screens of seventeen have one. A new account
      is empty everywhere
- [ ] **D-03 Replace `useAsync`.** Fetch-on-mount with no caching,
      refetching or invalidation, by its own comment. Wrong for a walk that
      runs three hours
- [ ] **D-05 Writes.** Notes, community points, profile edits and outposts all
      write to local state and are lost on navigation. Profile edit is the
      worst of them: it reports "Saved" and discards every field (S-13)
- [ ] **X-07 Tests.** Start with `lib/map/hex.ts`, `lib/walking.ts` and
      `lib/geo.ts`: pure, exact, cheap to test and expensive to get wrong
- [ ] **P-03 / L-06 Offline.** The service worker skips `/_next/`, which now
      holds every optimised plate. A walk that loses signal loses its artwork

### Block 3: the walk loop, which is the product

Everything that reads is built. Almost nothing that writes is. This block is
the remaining risk.

- [ ] **L-05 / D-04 Close the loop.** Wire `useLiveLocation` into the walk:
      position watch, tile entry, arrival, progress that moves with the walker
      rather than jumping between waypoints
- [ ] **E-2** Objective completion: detect reaching a point and unlock it
- [ ] **E-3** Walk complete: summary, record written, rewards
- [ ] **C-2 / S-09** Territory and dock tile counts derived from revealed
      tiles and the camera, not fixtures
- [ ] **B-2 / L-02** Location priming before a walk, not only on outposts

### Block 4: refinement

- [ ] **X-02 Type scale.** 26 hard-coded 9px sizes and 2 at 8px against a
      scale whose floor is 11px. Either add a sanctioned micro size or remove
      the overrides
- [ ] **X-06 Dead code.** Delete `HomeLauncher`, `QuestCard` and `Chip`. Note
      `use-live-location`, `routing`, `auth` and `supabase/client` as
      deliberately ahead of their phase so they do not read as rot
- [ ] **X-09** `getCollectibles()` has no consumer since Collected was
      removed. Either the concept returns or the method, fixtures and plates go
- [ ] **S-15** The shared quest preview draws a borrowed path because
      `FriendQuest` carries none of its own
- [ ] **S-16** "Try this quest" routes to the tier picker rather than starting
      anything. Same root as the walk loop
- [ ] **S-07** The briefing frame's body scrolls with no cue there is more
- [ ] **S-04** The home carousel has no keyboard path and no scroll cue
- [ ] **S-03** Keyboard users can reach the nav button but not the shortcut
- [ ] **S-14** `MapCanvas` is 544 lines holding three separable concerns, and
      will not shrink when MapLibre arrives
- [ ] **A-04** Colour contrast has never been measured. Check `--mute` on
      `--surface` at small sizes first
- [ ] **L-07** The map canvas has no accessible fallback and is invisible to
      assistive technology
- [ ] **P-04** No bundle or route weight budget in CI
- [ ] **M-03** Recheck page weight once all 41 plates have landed

### Block 4b: waiting on you, from the map infrastructure plan

Full reasoning in [`docs/map-infrastructure.md`](./docs/map-infrastructure.md)
§8 and §9. None of these block the work in §10 of that document.

- [x] **Limit 1.** Closed. Paid storage makes it a filing decision: scripts in
      the repo, artefacts reproducible from scratch, tiles in Supabase Storage
- [x] **Limit 2.** Closed as a risk. Pro includes 250GB egress a month then
      $0.09/GB, so it is a bill rather than a wall. Still worth measuring
- [ ] **Limit 3.** ODbL share-alike on an OSM-derived points database, against
      PRD §16. Worth an hour with someone who knows ODbL before pass 0 runs.
      **Using a vendor does not solve this**: Mapbox and MapTiler serve the same
      OSM under the same terms
- [ ] **Limit 4.** Dúchas. Downgraded, not closed. The Ordnance Survey Letters
      and Lewis's Topographical Dictionary are public domain and better suited
      to a tale attached to a place, so this is no longer the difference between
      having tales and not. Still worth approaching UCD
- [ ] **New: create the Gaois Developer Hub account for the Logainm API.**
      Irish placename meanings are close to load-bearing. It is a service
      account, so it is yours to make, not mine
- [x] Island wide, confirmed
- [ ] **Decide where quests are assembled** (map-infrastructure §12). The
      pre-built corpus was chosen only because routing had to cost nothing, and
      that constraint is gone. Live assembly with the safety rules encoded in
      the routing profile plus a cache meets the product promise literally
      rather than approximately, and deletes the corpus build, its review
      backlog and the re-anchoring code. It needs one always-on routing
      service, so it is a new monthly line item and therefore yours
- [ ] **Ask Mapbox directly** whether their tiles may be served into MapLibre
      (map-infrastructure §13). Contested rather than settled, cheap to ask,
      expensive to assume. MapTiler and Stadia have no such question
- [ ] Quest anchor density, contours, how much basemap, offline support, and
      what happens outside Ireland

### Block 5: open questions, not tasks

- [ ] **P-01** If the canvas still glitches on the phone after this session's
      changes, instrument marker hit-testing and per-frame hex set
      construction. Neither is memoised across frames, and neither was
      reproducible in a desktop harness
- [ ] **Z-03** Keep the loop table in `docs/audit.md` §5 current, or the gap
      between spec and build gets rediscovered every pass

---

### Artwork to generate

`docs/media-manifest.json` is the register: every key the app asks for, with
ratio, pixel size, priority and a brief. `npm run media` prints what has
landed and what is still waiting, so this list is not duplicated here and
cannot go stale.

- [x] `app-mark` landed. The icon, favicon and Apple touch icon all serve it,
      downscaled at the route. The PWA can be reinstalled with real branding
- [ ] **Redraw `hills-near`** (audit M-05). What arrived is a stag against
      alpine peaks with a full sky, filling the frame. It does not tile, so it
      is held out of the band and Home runs one layer with no parallax. Needs:
      near ground, hedgerows, a gate, skyline in the bottom third, transparent
      above and below, and the right edge butting cleanly against the left
- [ ] The remaining 12 plates, priority order in `npm run media`
- [ ] `app-mark-maskable` can be dropped from the brief (audit M-06). The
      Android icon is now derived from `app-mark` at `/maskable-icon`, which
      keeps the launcher icon and the favicon from ever drifting apart
- [ ] `quest-thumb-cloonanaha.png` still has nothing to render it (X-06)
- [ ] The four `collectible-*` plates lost their slot when the Collected tab
      was removed (audit X-09). Two are drawn and are in the folder rendering
      nothing. Decide whether collectibles come back before regenerating any

- [ ] Replace the placeholder Ireland outline with the real coastline when
      the basemap lands
- [ ] Replace the placeholder leaf mark with real artwork
- [ ] Illustration slots filled: home plate, quest heroes, thumbnails,
      category marks, badges (`docs/design-system.md` §H)
- [ ] Quest detail screen: hero plate, objective checklist, rewards row,
      Set active
- [ ] Map: locked territory treatment (rust dashed over hatching with a lock),
      zoom control, layers button, base camp card
- [ ] Active walk screen and walk complete frame
- [ ] Tale reader as its own route rather than a frame on the map
- [ ] Collections
- [ ] Left-handed mirror setting for the nav button and its lattice
- [x] Tale reader as its own route at `/tales/[id]`, a swipeable carousel of
      three to five sourced cards with a share action
- [ ] Story-shaped share image for tales, rendered server side, so a shared
      tale looks like something rather than a link
- [ ] Wire Tales and Badges to real progression rather than fixtures once
      the rules engine exists
- [ ] Full pass on empty, loading, error and offline states per
      [`docs/ux-loops.md`](./docs/ux-loops.md) §F
- [ ] Accessibility pass: touch targets, focus, reduced motion, colour
      independence
- [ ] Vitest and Playwright, wired into CI

### Gated on approval, do not start
- [ ] Apply `supabase/migrations/` to a project
- [ ] Switch `NEXT_PUBLIC_DATA_MODE` to live in a preview environment
- [ ] Set `NEXT_PUBLIC_AUTH_ENABLED=1` and verify the redirect matrix
- [ ] Delete `supabase/schema.sql` once the migrations are applied

### Product questions raised by the visual direction
- [ ] Confirm the IA: **Inventory** and **Outposts** replace Journal and You.
      Inventory currently merges walk history, tales, badges and territory.
      Outposts currently means saved start locations plus an active base
      camp, backed by `saved_locations`. Neither is in the PRD yet.
- [ ] Define leaves and stars. Two currencies now appear in the rank header
      and in quest rewards. The PRD has XP and unlocks only.
- [ ] Define rank. Currently distinct from level and from tier progress.
- [ ] Confirm quest objectives are counted (`5 / 8` in the direction) rather
      than reached once. Counted objectives change verification: proximity
      alone cannot count eight soil samples.
- [ ] Decide whether Home is a fifth destination or the shell that holds the
      launcher. It is currently the latter and is not in the nav.

---

## Phase v0.5 — Foundations

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
- [ ] Retire `hooks/use-project-storage.ts` (territory goes to IndexedDB)
- [ ] Remove `leaflet`, `react-leaflet`, `@types/leaflet`, `styles/map.css`
- [ ] Commit `SideQuestDesign.md` or remove the four references to it
- [x] Reconcile the branch story: `main` is the release line, there is no
      `dev`, CI triggers on `main` and `claude/**`
- [ ] **Set the repository default branch to `main`** in GitHub settings. It
      is currently `claude/setup-side-quest-project-BdHAe`, which no tool can
      change; it needs a click in Settings, General, Default branch
- [ ] Delete `claude/setup-side-quest-project-BdHAe` once the default has
      moved. Its content is fully contained in `main`
- [ ] Purge "run" from code and copy — the entity is `walks`, invisible in UI

### Strip-back, tier two — blocked on the aesthetic decision (PRD Q5)
- [ ] Reduce `FlowerMedallion` / `ShieldBadge` / `Pins` / `Landscape` /
      `Backpack` to a swappable `<Icon>` / `<Badge>` interface over an asset
      map — art direction becomes a directory swap, not an SVG edit
- [ ] Decide whether `PhoneFrame`'s desktop phone silhouette stays
- [ ] Re-decide the `:root` palette values *(keep the structure — it's right)*
- [ ] Hold the painted-asset pipeline until direction is set

### Database
- [ ] Enable PostGIS — **blocks everything spatial**
- [ ] Enable `pg_trgm` (name search + chain name matching)
- [ ] Migrate `quests` → `quests` + `quest_objectives` + `walks` +
      `walk_objectives`, with `tier` on quests (PRD §10)
- [ ] `pois`, `poi_categories`, `poi_lore`, `countries`, `zones` + GiST indexes
- [ ] `explored_cells`, `user_zones`, `poi_visits`
- [ ] `collections`, `collection_items`
- [ ] `unlock_rules`, `user_unlocks`
- [ ] `chain_denylist`, `chain_allowlist`, `reports`, `pipeline_runs`,
      `admin_audit`
- [ ] Polylines as encoded strings, not `jsonb` arrays of pairs
- [ ] RLS on every new table
- [ ] **RLS test for quest visibility** (published OR own OR in a non-private
      collection) — the one non-trivial policy in the system
- [ ] Account deletion cascade + JSON data export (GDPR)

### Map — we build it (C2)
- [ ] Add `maplibre-gl` + `pmtiles`; build `<QuestMap>` wrapper
- [ ] `planetiler`/`tilemaker` → Ireland `.pmtiles`, **z0–14 only**, trimmed
      layer set; overzoom to z18 in MapLibre
- [ ] Host the archive on Supabase Storage (range requests); verify size
      against the free tier
- [ ] First custom country-locked style
- [ ] Port the iOS/Leaflet lessons: NaN coord guards, `getBounds()`
      avoidance, `requestAnimationFrame` defer on pin set, z-index isolation
- [ ] Keep `IllustratedMap` behind a flag until the style lands, then delete

### Pipeline — passes 0–3 (`docs/data-pipeline.md`)
- [ ] Local Postgres+PostGIS and Valhalla in Docker
- [ ] Pass 0: Geofabrik Ireland extract via `osmium` + `osm2pgsql`
- [ ] Pass 0: SMR + NIAH from data.gov.ie via `ogr2ogr`
- [ ] **EPSG:2157 → 4326 reprojection test against a known control point**
- [ ] Pass 0: Logainm via the Gaois API, cached
- [ ] Pass 1: taxonomy mapping table + unmapped-category review queue
- [ ] Pass 2: dedupe on proximity + fuzzy name + shared identifier, with
      source precedence and provenance kept as a list
- [ ] Pass 3: reachability — public-way proximity, access tags, public-land
      polygons, Valhalla walking distance for borderline cases
- [ ] `pipeline/` in-repo so a full rebuild is one command

### Auth gaps
- [ ] Enforce email verification before app access
- [ ] Password reset; magic-link sign-in; Google + Apple OAuth
- [ ] Display-name field on signup *(the trigger already reads it)*
- [ ] Friendly Supabase auth error mapping

### Testing
- [ ] Vitest — `lib/geo.ts`, H3 quantiser, tier duration model, chain scorer
- [ ] Playwright — auth, onboarding, walk flow
- [ ] Wire both into CI

---

## Phase v0.75 — The dataset

*Prove the pipeline and the review workload on a pilot region before national
scale.*

### Pipeline — passes 4–8
- [ ] Pass 4: visibility — class allowlist + description language analysis
      (`no visible trace`, `site of`, `levelled` → excluded)
- [ ] Pass 5: **chain exclusion** — `chain_confidence` from brand tags, name
      frequency, shared domains, operator counts, forecourt/supermarket
      polygons; publish `<0.35`, review `0.35–0.70`, auto-exclude `>0.70`
- [ ] Seed the denylist empirically: national name-frequency analysis, review
      the top 200 by location count
- [ ] Name normalisation incl. trailing-placename stripping
      ("Costa Coffee Galway" → "costa coffee")
- [ ] Allowlist for genuine local multi-site independents
- [ ] Pass 6: zones — townland boundaries, Logainm names, meanings, hierarchy
- [ ] Pass 6: tales — SMR, NIAH prose, Logainm placename, Wikidata
- [ ] **Publish check rejecting any NC-licensed body text** (Dúchas guard)
- [ ] Wikipedia + Dúchas as outbound links only, never embedded
- [ ] Wikimedia images — per-image licence stored, or no image
- [ ] Pass 7: `quality_score`, `lore_richness`, `availability_confidence`
- [ ] Pass 8: review + publish to Supabase

### Corpus
- [ ] Start-anchor grid (~1,500 nationally)
- [ ] Offline builder: annulus candidates → scoring → Valhalla loop →
      tier tolerance ±20% → safety validation → simplify → stage as draft
- [ ] Shape-quest fallback for low-density areas
- [ ] Build and review the **pilot region** (proposed Clare + Galway city)
- [ ] **Measure the review workload** before national scale

### Admin curation console (`/admin`)
- [ ] `is_admin` **boolean column on `profiles`**, service-role writable only
      — **never `user_metadata`** (user-writable via `updateUser`)
- [ ] Seed migration granting admin to Josh's account id only
- [ ] Enforcement in **all three** places: proxy redirect, server-side check
      in every route handler and server action, RLS on admin tables
- [ ] Chain review queue + deny/allow list management
- [ ] Point review: geometry, category, radius, closure reports
- [ ] Tale editor with source, licence and attribution fields
- [ ] Quest review on a map: publish / reject / edit objectives
- [ ] Pipeline run trigger + monitoring with per-pass diffs
- [ ] Reports queue
- [ ] Append-only `admin_audit` on every action

---

## Phase v1 — The loop

*Done when a stranger in Ireland can sign up, walk a Stroll, learn what their
townland's name means, and see their map change — with no help.*

### Location capture (PRD §8.2) — highest-risk funnel step
- [ ] Priming screen; **never** call geolocation on page load
- [ ] Equally prominent "pick a place on the map instead"
- [ ] `navigator.permissions.query` denied detection + recovery copy
- [ ] Accuracy gate — reject fixes worse than 100 m
- [ ] Persist `last_location`; saved named locations
- [ ] Max-jump jitter filter on `useLiveLocation`

### Country lock (PRD §8.3)
- [ ] `countries` table; local PostGIS reverse-resolve — no geocoding service
- [ ] Camera `maxBounds`; country polygon as the board
- [ ] Explicit country-switch prompt — never silent

### Tiers (PRD §7)
- [ ] Tier selection as the primary user choice
- [ ] Duration model: terrain/gradient-adjusted pace + per-category dwell
- [ ] ±20% tolerance enforced at build time
- [ ] **Tier duration accuracy metric** — actual vs target, per tier

### Quest selection & preview (PRD §8.5)
- [ ] Spatial "quests near me" query filtered by tier
- [ ] Rank by unvisited anchors, lore richness, new territory
- [ ] "Start is 200 m away" connector display
- [ ] Reroll through the candidate list; log reroll depth
- [ ] Preview modal with route, objectives, distance, duration
- [ ] **Terrain and safety honesty** — unpaved, no pavement, steep, stiles,
      finishes after sunset

### Map surfaces (PRD §8.4)
- [ ] Pins: current location, objectives, discovered points, hinted points
- [ ] **One shared overlay primitive** with popover / modal / tooltip modes —
      focus trap, dismiss, safe areas, reduced motion solved once
- [ ] Tooltips must work on tap, not hover only
- [ ] Trail: out vs return, walked vs remaining
- [ ] Styled attribution that still satisfies ODbL

### Walking (PRD §8.7–8.9)
- [ ] Start / pause / resume / abandon; abandoning keeps unlocked tiles
- [ ] One active walk per user, enforced in the database
- [ ] Live position; progress by nearest-point-on-line projection
- [ ] Objective geofence: 40 m default, 15 s dwell
- [ ] **Server-side re-verification** of every completion
- [ ] Optional objectives (food stops) never gate completion
- [ ] Implied-speed plausibility check → flag, don't block
- [ ] Offline: cache route, objectives, points and tales at start
- [ ] `navigator.wakeLock`; bounded foreground-return gap-fill
- [ ] One-time honest explanation of the foreground-only limitation

### Territory (PRD §8.10, `docs/fog-of-war.md`)
- [ ] `h3-js` + `lib/fog/h3.ts` quantiser (res 11)
- [ ] `lib/fog/local-store.ts` IndexedDB store
- [ ] Canvas overlay with soft reveal
- [ ] `append_explored` RPC returning the new-cell count
- [ ] End-of-walk sync + paginated app-load hydration
- [ ] Per-country scoping; region stats derived via `cellToParent(cell, 8)`
- [ ] **Townland zones**: coverage calculation, unlock threshold (PRD Q4),
      "explored 14 townlands in Co. Clare" with Irish name and meaning

### Progression (PRD §8.11)
- [ ] XP: base + objectives + new territory + first-visit category bonus
- [ ] Category counts with honest post-pass-3/4 denominators
- [ ] `unlock_rules` as data: `category_count`, `category_sweep`,
      `tier_count`, `zone_count`, `zone_sweep`, `territory`, `distance`,
      `collection`, `lore`
- [ ] Server-side evaluation after each walk
- [ ] **Retroactive evaluation when a rule is inserted**
- [ ] Progression screen; no streaks, no decay, no expiry

### Tales (PRD §8.12)
- [ ] Tale popover on points, expandable, visible attribution
- [ ] **Every published lore row carries a source** — enforced by constraint
- [ ] Tale open rate metric

### History
- [ ] Chronological list from real data; detail with route, objectives, tales
- [ ] Filter by category and tier; name search via `pg_trgm`
- [ ] **Per-walk track deletion** — the only replayable path we store
- [ ] Fog on the history hero map, not on thumbnails

### Collections (PRD §8.13)
- [ ] Create; save a completed quest into one; user-controlled ordering
- [ ] Private (default) / unlisted / public
- [ ] Stable slug URLs, server-rendered with link previews
- [ ] Viewable signed-out with a signup prompt
- [ ] Walking someone's collection creates *your* walks against *their* quests
- [ ] Per-viewer completion ("3 of 8")
- [ ] Report / takedown path — required the moment anything is public

### PWA & hardening
- [ ] Manifest + icon set; service worker (shell + active quest + tales)
- [ ] Install prompt after the **first completed quest**; iOS manual steps
- [ ] Vercel env wiring; `not-found.tsx` and `error.tsx`
- [ ] Funnel analytics (PRD §14); Dependabot; preview deploys

### Accessibility
- [ ] `aria-label` audit for every icon-only button
- [ ] ≥44 px touch targets
- [ ] Reduced motion respected by map transitions and fog reveals
- [ ] WCAG AA contrast audit against the final palette

---

## Phase v1.5 — Depth

- [ ] **Live on-demand generation** — Valhalla on a small VPS. The first
      deliberate spend, against known demand
- [ ] 3D building `fill-extrusion` + `raster-dem` terrain, capability-gated
- [ ] Public collection discovery surface *(PRD Q6 — decide first)*
- [ ] Photos on walks — Storage, signed URLs, 1024 px, EXIF stripped
- [ ] Offline basemap (PMTiles makes this unusually easy — one cacheable file)
- [ ] Territory compaction: res-8 parent rows with 343-bit child bitmaps
- [ ] Second country — a data operation, not a code change
- [ ] Seasonal / time-of-day quest variation

---

## Phase v2 — Reach

- [ ] LLM-assisted lore drafting **under human review** — compresses sourced
      text only, **never originates a fact** (C4)
- [ ] `/admin/media`: batch generation with **hard per-day caps**, review,
      approve/reject, publish to Storage, attach to points and categories
- [ ] Notifications: opt-in, one category, frequency-capped, never nagging
- [ ] Native shell (Capacitor) **only if** evidence shows foreground-only
      capture is costing completions
- [ ] Heritage-body partnerships (PRD §16)
- [ ] Approach UCD re a commercial Dúchas licence (PRD Q10)

---

## Open questions

PRD §17. Summary:

| # | Question | Needed by |
|---|---|---|
| Q1 | Confirm Ireland + the v0.75 pilot region | v0.5 |
| Q2 | Fog at H3 res 11 or res 12? | v1 |
| Q3 | Tile count at res 11 (big, noisy) or res 9 (meaningful)? | v1 |
| Q4 | Townland unlock threshold — 15% coverage? | v1 |
| ~~Q5~~ | ~~Aesthetic direction~~ — settled: field survey | closed |
| Q6 | Public collections: browse surface, or link-sharing only? | v1.5 |
| Q7 | ODbL share-alike posture on the derived dataset | pre-launch |
| Q8 | Re-walk a quest for progression? *(proposed: yes, count points once)* | v1 |
| Q9 | Keep "Sidequest" as both the app and the 90-min tier? | v1 |
| Q10 | Approach UCD about a commercial Dúchas licence? | v1.5 |
| Q11 | Corpus target ≈ 12,000 quests — right? | v0.75 |
| Q12 | Is foreground-only tile capture acceptable? | v1.5 |

Settled, recorded so they aren't re-litigated:

| Decision | Outcome |
|---|---|
| Duration tiers | **Trot 15m · Stroll 45m · Sidequest 1.5h · Adventure 3h**, ±20% |
| "Run" | **Retired.** The attempt is a `walk`, and it never appears in the UI |
| Quest source | **Pre-built curated corpus** for v1; live generation is v1.5 |
| Map renderer | **MapLibre GL JS** — Leaflet can't do vector/pitch/3D |
| Tiles | **Self-built PMTiles**, z0–14 with overzoom, on Supabase Storage. £0 |
| Routing | **Valhalla offline**, corpus pre-built. No runtime routing cost |
| Places data | **OSM + Irish national open data in our own PostGIS.** Never a third-party places API |
| Chains | **Excluded in the pipeline**, multi-signal, with a human review band |
| Lore | **Sourced and cited only.** Dúchas is CC BY-NC → link out, never embed |
| Tiling | **H3 res 11** for fog; **townlands** for named zones |
| Quest vs walk | **Split** — it's what makes quests shareable and collectable |
| MVP spend | **£0 recurring** |
