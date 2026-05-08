# Side Quest — TODO

Living checklist of everything left to ship. Tick items as you go; add new
sections as scope grows. Authoritative source of truth for "what's left" —
keep `README.md` lean and link here.

---

## Done

- [x] Project scaffold (Next.js 15 App Router, TypeScript strict, Tailwind v4)
- [x] Supabase clients wired (browser, server, middleware) + session refresh
- [x] Auth route protection: anonymous users redirected from `/quest`, signed-in users redirected from `/login` and `/signup`
- [x] Initial SQL schema (`supabase/schema.sql`): profiles / user_settings / quests + RLS + auto-profile trigger + one-active-quest constraint
- [x] Core lib helpers from the design doc: `lib/geo.ts`, `lib/quest.ts`, `lib/routing.ts`, `lib/walking.ts`
- [x] Word banks: `data/word-banks.ts` with `pool()` and mode-aware concat
- [x] Type definitions verbatim from doc: `data/types.ts`
- [x] `use-live-location` hook
- [x] `use-project-storage` local-first hook
- [x] Map CSS overrides (`isolation: isolate` + dark bg + live-marker)
- [x] Login / signup / callback / signout routes (server actions + `exchangeCodeForSession`)
- [x] `dev` and `main` branches set up

---

## Blocked on design infra

These are wired up to design tokens that currently hold placeholder values
in `app/globals.css`. Replace tokens, then component work below unblocks.

- [ ] Final design tokens (`--bg`, `--surface`, `--ink`, `--mute*`, `--line*`, `--accent*`, `--ok`, `--warn`, font stacks)
- [ ] Card primitive (with `hover` variant)
- [ ] Button primitive (`variant: primary | ghost | ...`, `leadingIcon`)
- [ ] Tab / Tabs set (used in pin-setup and the radius/mode picker)
- [ ] Eyebrow (small mono uppercase label)
- [ ] Tag (square tag with `variant: ok | warn | accent | mute`)
- [ ] Slider for the radius picker
- [ ] Floating bottom nav with `<NavSecondary>` portal slot — *or* swap for a sticky in-page action bar inside `<ActiveQuestView>`

---

## Auth & account

- [ ] Magic-link sign-in option (in addition to password)
- [ ] OAuth providers (Google / GitHub) — just wire `signInWithOAuth`
- [ ] Password reset flow (`resetPasswordForEmail` + `/auth/update-password` page)
- [ ] Profile page: display name editor, sign-out
- [ ] Email verification gate before granting `/quest` access (currently middleware lets unverified through)
- [ ] Rate-limit signup via Supabase auth settings + captcha on the form
- [ ] Friendly error mapping for Supabase auth errors (currently raw `error.message` shown)

---

## Quest map flow

- [ ] `<QuestMap>` Leaflet wrapper with hoisted icons (PIN / TARGET / TAP_PREVIEW / LIVE), `FitTo` helper, polyline render (out solid green, return dotted accent)
- [ ] Dynamic-import the map module with `ssr: false`
- [ ] Pre-load map module on page mount to avoid PWA OOM on iOS after geolocation prompt
- [ ] `<PinSetup>`: My location / Tap on map tabs + diagnostics panel (permission state, secure context, geo API, display mode, origin)
- [ ] iOS geolocation error mapping (codes 1/2/3 + permission caching note)
- [ ] `requestAnimationFrame` defer on pin-set callback
- [ ] NaN/Infinity coord guard at every entry point
- [ ] Privacy modal (one-time, blocking) — copy mentions Supabase + OSRM
- [ ] Radius slider (0.5–25 km, log-ish stops)
- [ ] Mode tabs (city / countryside / mixed)
- [ ] `beginQuest` wired to `planRoundTrip` with parallel fetch + fallback flag
- [ ] Fullscreen `<ActiveQuestView>` with prompt overlay at `z-[1000]`
- [ ] Quest reroll (sync, prompt-only)
- [ ] Route reroll (async, refetch routes; both reroll buttons disable while pending)
- [ ] Abandon (red X) and Complete (green check) actions
- [ ] Live "you are here" dot via `useLiveLocation` (`zIndexOffset={1000}`)

---

## Cloud sync (Supabase)

The local-first hook is in. Cloud sync is the next layer.

- [ ] `lib/supabase/queries.ts` — `getUserSettings`, `upsertUserSettings`, `listQuests`, `insertQuest`, `updateQuest`, `clearHistory`
- [ ] Server actions for begin / reroll / complete / abandon
- [ ] Reconcile `localStorage` → Supabase on first sign-in (one-shot import)
- [ ] Optimistic UI for quest finish / reroll (stale-while-revalidate via `revalidatePath`)
- [ ] Realtime subscription on `quests` for cross-device sync (optional)
- [ ] Conflict resolution rule when local and remote diverge (last-write-wins is fine for v1)

---

## History

- [ ] `/history` page (server-rendered list from `quests` table)
- [ ] Quest card variants by status (completed / abandoned)
- [ ] Single-click "Clear" link (no modal — matches the destructive-action pattern from the doc)
- [ ] Pagination once `> HISTORY_LIMIT` (50) — though Supabase has no hard cap, keep it server-side
- [ ] Export to GPX / JSON

---

## Routing & tiles (production hardening)

- [ ] Replace public OSRM demo with Mapbox Directions / GraphHopper / self-hosted OSRM (`OSRM_BASE_URL` env var already plumbed through)
- [ ] Replace CARTO Dark Matter (non-commercial) with a paid tile provider OR self-host OSM tiles
- [ ] Cache routing responses by `(origin, target)` rounded coords — saves quota on rerolls that pick a similar target
- [ ] Service-worker passthrough; later add tile caching with strict invalidation

---

## Polish & infra

- [ ] PWA manifest + apple-touch-icon set
- [ ] Service worker (passthrough first, then offline tile cache)
- [ ] `next/image` OG image
- [ ] `not-found.tsx` and `error.tsx` boundaries
- [ ] CI: lint + type-check + build on PR (GitHub Actions)
- [ ] Vercel project + env wiring (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OSRM_BASE_URL`)
- [ ] Privacy copy reviewed (Supabase + OSRM disclosed; localStorage explained)
- [ ] Telemetry decision (none / Plausible / PostHog) — privacy modal must reflect choice

---

## iOS pitfalls (bake in from day one)

These are the issues that cost days last time. Verify each is handled:

- [ ] `_map.layerPointToLatLng` crash avoided — never call `getBounds()` on a detached Leaflet layer; compute bounds manually from lat/lng deltas
- [ ] White flash on zoom-out fixed via `.leaflet-container { background: var(--bg); isolation: isolate; }` (already in `styles/map.css`)
- [ ] Leaflet pane z-indexes don't outrank chrome — same `isolation: isolate` line
- [ ] Geolocation permission caching surfaced via diagnostics panel
- [ ] PWA OOM mitigation: pre-load map module on page mount + defer pin-set by one animation frame
- [ ] NaN/Infinity coordinate guards at every geolocation entry
- [ ] Background tracking pauses on lock — accept (or add native shell as a stretch)

---

## Stretch

- [ ] Background location for screen-locked walks (requires native shell)
- [ ] Streaks / achievements
- [ ] Photo attachments per quest (Supabase Storage bucket + RLS-bound paths)
- [ ] Friend leaderboards
- [ ] Custom user-defined word banks
- [ ] Multiple saved start pins (named — "home", "office", "dad's")
- [ ] Share-a-quest deep link (read-only public view)
