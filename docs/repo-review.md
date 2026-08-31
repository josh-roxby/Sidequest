# Repo review — Side Quest

| | |
|---|---|
| **Date** | 2026-08-31 |
| **Commit** | `84f0d71` on `claude/geo-adventure-sidequest-prd-8zhqgm` |
| **Scope** | Full read of every source file. ~1,400 lines of app/component code. |
| **Companion** | [`PRD.md`](./PRD.md) |

---

## 1. Verdict

**The foundation is good and worth keeping. The product it implements is not
the product in the PRD.**

Concretely: the plumbing (Next 16 App Router, Supabase SSR auth with proper
cookie rotation, middleware route protection, RLS schema, CI, design tokens)
is well built, well commented, and above the quality bar you normally see at
this stage. Almost none of it needs to be thrown away.

But the **domain model** implements a different, simpler game: *drop a pin →
walk to a random point in a radius → complete a Mad-Libs prompt from a word
bank*. The PRD's game is: *choose a location → the server plans a route
around real categorised landmarks → objectives, territory, progression,
collections*. Those are different products with different data models.

So the work splits cleanly:

- **Keep** — auth, Supabase clients, middleware, CI, tokens, primitives,
  shell, `lib/geo.ts`, `lib/cn.ts`, `lib/env.ts`, `lib/walking.ts`.
- **Replace** — the quest domain (`data/types.ts`, `data/word-banks.ts`,
  `lib/quest.ts`, the `quests` table), Leaflet, the illustrated-map stand-in.
- **Strip** — mock data hardcoded into screens, and the more committed
  decorative assets, so the aesthetic can be re-decided (§6).

Nothing here is broken. It's a well-executed prototype of a scope that has
since grown.

---

## 2. What's actually here

```
app/         13 routes — landing, auth (login/signup/callback/signout),
             welcome carousel, and 5 app screens under (app)/
components/  22 components — shell (4), primitives (5), marks (4),
             illustrations (4), domain (5)
lib/         9 modules — supabase clients (3), geo, routing, quest,
             walking, auth, env, cn
hooks/       2 — use-live-location, use-project-storage
data/        2 — types, word-banks
supabase/    schema.sql — profiles, user_settings, quests + RLS + triggers
docs/        fog-of-war.md
```

Roughly 1,400 lines of TypeScript/TSX. Every file has been read.

---

## 3. Area-by-area assessment

### 3.1 Auth and session handling — **strong, keep**

`lib/supabase/{client,server,middleware}.ts` + `proxy.ts` + `lib/auth.ts`.

This is done properly. The `updateSession` helper touches `getUser()` on
every navigation so session cookies actually rotate — the comment explaining
why is correct and is the exact thing most implementations get wrong. The
`proxy.ts` migration to the Next 16 file convention is handled, with the
matcher correctly excluding `/api/*` so `/api/healthz` stays reachable when
Supabase env is broken. The four-case redirect matrix (anonymous → login,
un-onboarded → welcome, onboarded → home, post-signup → welcome) is complete
and readable.

`lib/env.ts` `required()` is a small thing done well: named-variable failure
messages read at call time rather than module load, so a misconfigured deploy
still serves routes that don't need Supabase.

The `NEXT_PUBLIC_AUTH_DISABLED` preview mode with a `DEMO_USER` stub is a
genuinely good call for reviewing UI without a project wired up.

**Gaps** (all in `TODO.md` already, all real):
- Email verification is **not** enforced — an unverified user reaches `/home`.
- No password reset.
- No magic link, no OAuth.
- No display-name field on signup, despite the DB trigger already reading
  `raw_user_meta_data->>'display_name'`. The backend is waiting for a form
  field that doesn't exist.

**One thing to watch:** onboarding state lives in `user_metadata`, read from
the JWT in middleware. Cheap and correct for that purpose. But
`user_metadata` is **user-writable** via `supabase.auth.updateUser`. Fine for
"have you seen the carousel". **Never** put `is_admin` there — the PRD's
admin gate must be a database column with RLS (PRD §8.14).

### 3.2 Database schema — **good shape, wrong domain**

`supabase/schema.sql`. Idempotent throughout, RLS on every table, policies
scoped to `auth.uid()`, an auto-profile trigger, `updated_at` triggers, and a
**partial unique index for one-active-quest-per-user** — that last one is a
nice piece of work and the pattern carries straight into the PRD's `runs`
table.

Problems, all consequences of the domain change:

| Issue | Detail |
|---|---|
| **No PostGIS** | Coordinates are bare `double precision` columns. There is no way to ask "POIs within 2 km" efficiently. This is the single most important upgrade — everything in generation depends on it. |
| **`quests` conflates two things** | It is simultaneously the quest definition and the attempt record. The PRD splits these into `sidequests` (durable, shareable) and `runs` (per-user attempt). Without that split, collections and sharing are impossible. |
| **Polylines as `jsonb` arrays** | `route jsonb` holding `[[lat,lng],…]`. Should be an encoded polyline string — 10–50× smaller and the format every mapping library reads natively. |
| **Word-bank columns on the row** | `action` / `item` / `descriptor` / `prompt_text` are the old generator's output shape baked into the schema. Replaced by `sidequest_objectives`. |
| **No `pois`, no territory, no collections, no unlocks** | The entire PRD data model beyond auth is absent. Expected — noting it for completeness. |

### 3.3 Geo and routing — **the maths is right, the vendor is not**

`lib/geo.ts` is careful work. `randomPointInRadius` uses `sqrt(random())` for
uniform area distribution rather than the naive uniform-radius version that
clusters at the centre — that's the correct implementation and most people
get it wrong. `distanceM` is a proper haversine. `midpointWaypoints` computes
a true perpendicular offset in metres with a `cos(lat)` correction for
longitude and a sensible clamp — and it is **exactly the primitive the PRD's
loop generation needs** (§8.5 step 4). Keep this file essentially as-is.

`lib/routing.ts` is structurally sound — round-trip planning with independent
out/return legs, `routed: false` propagated honestly when either leg falls
back. Two issues:

1. **It points at the public OSRM demo server**, which is explicitly not for
   production use. Already flagged in `TODO.md`; the PRD picks self-hosted
   Valhalla (§11.3).
2. `fetchWalkingRoute` swallows every error into a silent straight-line
   fallback. Correct behaviour, but there's no telemetry — you cannot
   currently tell how often users are being served a straight line instead of
   a route. That needs a metric before launch (PRD §14).

`lib/walking.ts` hardcodes 5 km/h. Fine as a placeholder; the PRD needs
terrain- and gradient-adjusted estimates.

### 3.4 Map layer — **must be replaced**

Two things exist and neither is the map:

- **Leaflet + react-leaflet** in `package.json`, plus `styles/map.css` and
  `@types/leaflet` — but **no component imports Leaflet anywhere**. It is an
  unused dependency. (The `map.css` comments about z-index isolation and the
  `#ddd` container background are good notes from real experience — worth
  keeping the knowledge, not the dependency.)
- **`components/illustrations/IllustratedMap.tsx`** — a hand-drawn SVG of a
  fictional map (cream paper, sage forest blobs, a lake, dotted route) with a
  400×700 viewBox, and `app/(app)/map/page.tsx` positioning pins at hardcoded
  percentages over it.

The illustrated map is honest about being a placeholder in its own comments,
and as a way to build the surrounding chrome without a map provider it did
its job. But the PRD requires vector styling, pitch/bearing, 3D
`fill-extrusion` and terrain — **none of which Leaflet can do at all**.

**Action: remove Leaflet, `@types/leaflet`, and react-leaflet. Adopt MapLibre
GL JS** (PRD §11.2). The surrounding layout — `MapTopBar`,
`MapSideControls`, `MapBottomCard` — was built to sit over any map surface
and survives the swap unchanged, which was good foresight.

### 3.5 Components — **solid, slightly ahead of the data**

The primitives (`Card`, `Button`, `Eyebrow`, `ProgressBar`, `Pill`) are
clean, typed, token-driven, and correctly sized. `Button` has proper
leading/trailing icon slots and variant handling. The shell (`PhoneFrame`,
`BottomNav`, `ScreenContainer`) is well factored.

Two observations:

- **`StatusBar` renders a fake 9:41 iOS status bar** with mock
  signal/wifi/battery glyphs. In a PWA the real status bar is right above it,
  so this renders a fake one under a real one. It's a design-mockup artefact.
  Delete it. (It is currently not imported by any screen, so this is free.)
- **`PhoneFrame`'s desktop treatment** — a 400px phone silhouette floating on
  a radial gradient — is a *presentation of a mobile design*, not a
  responsive web app. That's a legitimate choice for a mobile-first PWA, but
  it should be a deliberate one, not a default inherited from a mockup. Flag
  for the design pass.

### 3.6 Mock data hardcoded into screens — **the biggest real problem**

This is the issue most likely to cause trouble, because it's invisible until
someone believes it:

| Location | Fabricated value |
|---|---|
| `app/(app)/home/page.tsx` | `weather="62°F · partly sunny · light breeze"` — there is no weather integration anywhere in the repo |
| `app/(app)/home/page.tsx` | `level={7} title="Wanderer" xp={620} xpToNext={1000}` — no XP system exists |
| `app/(app)/map/page.tsx` | `walkName="Lakeside Loop"`, `distance="2.5 km"`, `duration="32 min"`, `progress={0.3}` |
| `app/(app)/quests/page.tsx` | An entire fake quest — "Find something purple", "+15 XP", a medallion, a working-looking "I found it!" button |
| `app/(app)/profile/page.tsx` | Badge grid rendered from nothing |

Every screen looks finished and is fully fabricated. `/journal` is the honest
one — it shows real zeros and says the grid lands here once entries exist.
That's the pattern all of them should follow.

**Action: replace all fabricated values with real empty states.** Zeros, "no
quests yet", "start your first walk". A screen that looks 90% done and is 0%
wired is worse than one that looks 40% done and is honest about it — it
misleads you about your own progress, and it will mislead anyone you show it
to.

### 3.7 Hooks — **one keeper, one to retire**

`use-live-location.ts` is good. `watchPosition` with high accuracy, proper
cleanup via `clearWatch`, and — importantly — **it guards against non-finite
coordinates**, which is a real iOS bug that produces `NaN` map crashes. Keep
it; add the max-jump jitter filter from `fog-of-war.md`.

`use-project-storage.ts` is a generic localStorage wrapper with a versioned
slot registry. The SSR hydration pattern is correct and the comment about the
ESLint false-positive is accurate. But: **nothing uses it**, and the PRD
routes local persistence through IndexedDB (territory, offline run cache) and
Supabase (everything else). localStorage is the wrong store for the territory
set — it's synchronous, string-only, and capped around 5 MB. Retire it rather
than let it become a second source of truth.

### 3.8 Docs — **`fog-of-war.md` is the best file in the repo**

Genuinely excellent. It separates live track / walk record / explored set as
three distinct concepts, compares H3 against a square raster grid on the axes
that matter, lands on H3 res 11 with reasoning, works through the
client/server/hybrid trade-off honestly, specifies the sync RPC, describes
the canvas compositing approach, and lists real open questions including GPS
jitter and second-device backfill.

The PRD adopts it wholesale and adds four things: per-country scoping,
derived coarse statistics via `cellToParent` rather than duplicate storage, a
concrete compaction path (res-8 parent rows with 343-bit child bitmaps), and
where fog does and doesn't render. **No changes needed to the document.**

### 3.9 CI and infra — **good, small gaps**

`.github/workflows/ci.yml` runs audit → lint → type-check → build on PRs to
`main`/`dev`, with concurrency cancellation and placeholder Supabase env for
the build. Correct and complete for what exists.

Missing, in priority order: **no tests and no test runner at all** (the
generation scorer, H3 quantiser, distance maths, and the collections RLS
policy all need them — the RLS policy especially, since it's the one
non-trivial policy in the system); no Dependabot/Renovate; no preview
deployment.

### 3.10 Loose ends

- **`Te.txt`** — a single empty file at the repo root from commit `009924d`.
  Delete.
- **`README.md`** describes the pin-and-wander concept and says "Map
  provider: TBD". Both now superseded.
- **`SideQuestDesign.md`** is referenced by `app/globals.css`,
  `PhoneFrame.tsx`, `MapBottomCard.tsx`, and `TODO.md` — **and does not exist
  in the repo.** Either commit it or stop citing it; right now four files
  point at a document nobody can read.
- `README.md` describes a `main` / `dev` branch layout, but the actual
  branches are `claude/*`. Worth reconciling.

---

## 4. Security review

| Check | Status |
|---|---|
| RLS enabled on all user tables | ✅ |
| Policies scoped to `auth.uid()` | ✅ |
| Service-role key absent from client code | ✅ — only `NEXT_PUBLIC_*` anon key is used |
| Session refresh on navigation | ✅ |
| Route protection in middleware | ✅ |
| `security definer` functions pin `search_path` | ✅ — `handle_new_user` sets it |
| Email verification enforced | ❌ unverified users reach `/home` |
| Admin gate | n/a — not built. **Must be a DB column, not `user_metadata`** (§3.1) |
| Secrets in repo | ✅ none; `.env.local.example` is placeholders only |
| Routing endpoint credentials | ✅ server-side only — keep it that way when Valhalla lands |

Nothing alarming. The email-verification gap is the only live issue, and it's
a one-line middleware change plus a UX flow.

---

## 5. Dependency audit

| Package | Verdict |
|---|---|
| `next` 16.2.6, `react` 19 | ✅ current |
| `@supabase/ssr`, `@supabase/supabase-js` | ✅ correct pair |
| `lucide-react` | ✅ keep |
| `leaflet`, `react-leaflet`, `@types/leaflet` | ❌ **unused — remove.** Replace with `maplibre-gl` |
| `tailwindcss` v4 | ✅ |
| `typescript` 6 | ✅ strict mode on |

**To add:** `maplibre-gl`, `h3-js`, `zustand`, `@tanstack/react-query`,
`framer-motion` (last three only when a screen needs them), and a test runner
(Vitest + Playwright).

---

## 6. The strip-back

You asked for the repo to end up "fairly stripped and refined" so the ideal
aesthetic can be revised. Here is the concrete plan, split by risk. **This
review recommends it; nothing in this category has been executed yet beyond
the trivial cleanups in §7** — the design work is yours to decide on.

### Strip now (no design judgement required)

- All fabricated data in screens → honest empty states (§3.6).
- `components/shell/StatusBar.tsx` → delete. Fake OS chrome (§3.5).
- `Te.txt` → delete.
- Leaflet + `react-leaflet` + `@types/leaflet` + `styles/map.css` → remove
  with the MapLibre swap.
- `hooks/use-project-storage.ts` → retire (§3.7).
- The `/public/illustrations/*` asset slots in `TODO.md` — that list commits
  to a painted-illustration pipeline (medallions, badges, avatars,
  landscapes) before the aesthetic is decided. Hold it.

### Reduce to swappable primitives (design-neutral refactor)

- **`IllustratedMap`** → keep as a `<MapPlaceholder>` behind a flag until
  MapLibre is styled, then delete. Do not evolve it.
- **`FlowerMedallion`, `ShieldBadge`, `Pins`, `Landscape`, `Backpack`** →
  these encode a specific style (painted, botanical, soft-gradient) in code.
  Reduce to a single `<Icon name>` / `<Badge tone state>` interface backed by
  a swappable asset map, so changing the art direction is changing a
  directory, not editing SVG paths across five components.
- **`PhoneFrame`'s desktop silhouette** → make it a deliberate decision, not
  a default (§3.5).

### Keep regardless of aesthetic

The token architecture in `app/globals.css` is genuinely good and is
**aesthetic-neutral infrastructure**: `:root` custom properties bridged into
Tailwind v4 via `@theme inline`, so every colour, shadow, radius, and motion
duration is one-file swappable. The current *values* are a cream/sage/lavender
palette that may not survive the design pass — but the *structure* is exactly
right and should not be touched. Changing the aesthetic should be editing
~40 lines of `:root`, and thanks to this it is.

Same for: the primitives' APIs, the shell composition, and the
`prefers-reduced-motion` global guard.

---

## 7. What was changed in this pass

Deliberately minimal — this pass is planning, not refactoring.

- `docs/PRD.md` — new, the full product requirements document.
- `docs/repo-review.md` — new, this document.
- `TODO.md` — rewritten against the PRD's scope and phases, including the
  admin media-generation page as a deferred, gated item.
- `README.md` — updated to describe the actual product and current state.
- `Te.txt` — deleted.

**No application code, schema, or dependency was changed.** The strip-back in
§6 and the schema migration in §3.2 are the next pieces of work and should be
their own commits.

---

## 8. Recommended order of work

1. **Decide the aesthetic** (PRD Q5). It blocks the strip-back's second tier
   and nothing else — so it can run in parallel with 2–4.
2. **Strip-back, tier one** (§6). Half a day. Makes the repo honest.
3. **PostGIS + schema migration** to the `sidequests`/`runs`/`pois` model
   (PRD §10). Everything downstream depends on it.
4. **POI ingestion pipeline** + Ireland loaded and categorised (PRD §9,
   §11.4). This is the long pole and should start early — it's a data
   problem, not a code problem, and data problems take longer than expected.
5. **MapLibre swap** + a first custom country-locked style (PRD §11.2, §8.3).
6. **Valhalla stood up**, `lib/routing.ts` repointed (PRD §11.3).
7. **Generation service** — candidate scoring, loop routing, composition
   (PRD §8.5). The heart of the product; give it the most time.
8. **Location priming + capture** (PRD §8.2). Highest-risk funnel step.
9. **Run flow** — trail, live position, server-verified objectives (§8.6–8.8).
10. **Fog of war** end to end (§8.10, `fog-of-war.md`).
11. **Progression + unlocks** as data-driven rules (§8.11).
12. **Collections**, private and unlisted (§8.12). Write the RLS test.
13. **Auth gaps** — verification, reset, magic link (§3.1). Can slot in
    anywhere; don't let it block the loop.
