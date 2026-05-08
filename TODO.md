# Side Quest — TODO

Living checklist of everything left to ship. Tick items as you go; add new
sections as scope grows. Authoritative source of truth for "what's left" —
keep `README.md` lean and link here.

---

## Done

### Foundations
- [x] Next.js 15 App Router + React 19 + TypeScript strict + Tailwind v4
- [x] Design tokens from design doc §2 (cream/sage/lavender palette, shadows, radii, motion)
- [x] Fonts loaded via `next/font`: Fraunces (display) + Plus Jakarta Sans (body)
- [x] `lib/cn.ts` className concatenator
- [x] `prefers-reduced-motion` global guard

### Supabase
- [x] Browser / server / middleware clients with session refresh
- [x] SQL schema: profiles / user_settings / quests + RLS + auto-profile trigger
- [x] One-active-quest-per-user partial unique index

### Auth & onboarding
- [x] /login + /signup pages restyled to new tokens (cards on cream)
- [x] /auth/callback (`exchangeCodeForSession`)
- [x] /auth/signout
- [x] Middleware route protection: `/home`, `/map`, `/quests`, `/journal`, `/profile`, `/welcome` require auth
- [x] Onboarding gate via `auth.user_metadata.onboarding_completed` (read in middleware, written by `/welcome` server action)
- [x] /welcome step-based carousel (5 steps, dots indicator, keyboard arrows, skip)

### Shell
- [x] `<PhoneFrame>` (full-bleed mobile, 400px desktop frame on radial paper bg)
- [x] `<StatusBar>` (9:41 mock with signal/wifi/battery glyphs)
- [x] `<BottomNav>` floating pill, sage active state, lucide icons
- [x] `<ScreenContainer>` with 128px bottom padding

### Primitives
- [x] `<Card>` with `soft` (24px) / `lg` (28px) variants
- [x] `<Button>` with primary / secondary / ghost / toggleOn variants + leading/trailing icon slots
- [x] `<Eyebrow>` 10px Jakarta 600 0.12em tracking
- [x] `<ProgressBar>` 1.5px sage track + primary→light gradient
- [x] `<Pill>` neutral / primary / lavender / gold tones

### Marks & illustrations
- [x] `<CompassMark>` placeholder logo
- [x] `<FlowerMedallion>` 80px gradient disc with petal layers
- [x] `<ShieldBadge>` with leaf/compass/flower/tree/star/door motifs × sage/gold/moss/lavender tones, locked variant
- [x] `<PinLeaf>` / `<PinFlower>` / `<PinDoor>` map pins
- [x] `<Landscape>` painted-style hero fallback
- [x] `<Backpack>` for the Your Journey card
- [x] `<Illustration src fallback />` swap pattern (img with onError → SVG fallback)

### Screens (visual scaffolds; data still mocked)
- [x] Landing `/` with landscape hero + sign-in / sign-up CTAs
- [x] `/welcome` onboarding carousel
- [x] `/home` (the Journey screen): header, hero card, journey card, primary + secondary CTAs, inspiration card
- [x] `/map` stub
- [x] `/quests` with current-quest hero (medallion + reward + progress + CTA) + history placeholder
- [x] `/journal` with stats bar + grid placeholder
- [x] `/profile` with hero, badges grid (locked), lifetime stats, sign out

### Architecture docs
- [x] `docs/fog-of-war.md` — H3 hex storage, hybrid client+server source-of-truth, render approach, proposed schema, open questions

### Infra
- [x] `dev` and remote tracking branches set up (`main` blocked by proxy — set up via GitHub UI / first PR merge)

---

## Up next

### Auth polish
- [ ] Display-name field on signup (write to `user_metadata.display_name`; the schema trigger already reads it)
- [ ] Password reset flow (`resetPasswordForEmail` + `/auth/update-password`)
- [ ] Magic-link sign-in option
- [ ] OAuth providers (Google / GitHub)
- [ ] Email verification gate before granting `/home` access (currently middleware lets unverified through)
- [ ] Friendly error mapping for Supabase auth errors

### Onboarding follow-ups
- [ ] Replace step visuals with painted assets when illustrator delivers (medallion variants, landscape variants, badge close-ups)
- [ ] Swipe gestures (touch + pointer drag) — pull in Framer Motion when we add it
- [ ] Optional "import from previous prototype" step if we want to migrate localStorage of beta testers
- [ ] Pin-setup step folded into the flow OR routed-to right after carousel completes (currently lands on /home)
- [ ] Privacy ack lives inside the carousel (currently absent — the previous prototype had a one-time blocking modal)

### Map screen + GPS
- [ ] Decide map provider (Mapbox GL JS recommended — see design doc §9.3)
- [ ] Custom Mapbox style: cream paper base `--map-paper`, parks `--map-park`, water `--map-water`, white roads, no labels in v1
- [ ] `<QuestMap>` wrapper with hoisted icons, FitTo helper, polyline rendering (out solid moss, return dotted)
- [ ] iOS pitfalls bake-in: NaN coord guards, `getBounds()` avoidance, `requestAnimationFrame` defer on pin-set, pre-load map module
- [ ] PinSetup with My location / Tap on map / diagnostics panel
- [ ] Top distance pill + filter button (per design doc §5.2)
- [ ] Right-column floating controls: navigation arrow, layers, locate-me
- [ ] Bottom card with eyebrow, walk name, distance/time/difficulty row, progress bar, End Walk button
- [ ] Live "you are here" dot via `useLiveLocation`

### Fog of war (see `docs/fog-of-war.md`)
- [ ] Add `h3-js` dep; write `lib/fog/h3.ts` quantiser
- [ ] IndexedDB local store `lib/fog/local-store.ts`
- [ ] Canvas overlay component with watercolour reveal
- [ ] `explored_cells` Postgres table + RLS + `append_explored` RPC
- [ ] End-of-walk sync; app-load hydration
- [ ] GPS jitter filter (max-jump-per-sample) before quantising
- [ ] Achievements hooks for "X km² uncovered"

### Quest map flow (the original lab logic)
- [ ] Wire `lib/routing.ts` `planRoundTrip` into the new Mapbox map (currently OSRM-only; can run alongside Mapbox Directions)
- [ ] Server actions for begin / reroll-quest / reroll-route / complete / abandon
- [ ] Reconcile localStorage prototype data → Supabase on first sign-in (one-shot import)
- [ ] Optimistic UI for quest finish / reroll
- [ ] Realtime subscription on `quests` for cross-device sync (optional)

### Journal
- [ ] 2-column discovery grid (4:3 thumbs)
- [ ] `<DiscoveryThumb>` SVG fallback while painted photos are absent
- [ ] Per-entry detail sheet
- [ ] Search (full-text or naive substring)
- [ ] Stats bar wired to real counts

### Profile
- [ ] Display-name editor
- [ ] Real badge unlock rules (tied to quest completions, distance, streaks)
- [ ] Lifetime stats wired to `quests` aggregates
- [ ] Settings sub-screen (notifications, units, privacy)

### Photos & CV
- [ ] v1: user-confirmed photo on "I found it!" → camera → save to journal
- [ ] Storage: Supabase Storage bucket with signed URLs, 1024px max, EXIF stripped
- [ ] v2: iNaturalist API for plant/animal classification (optional)
- [ ] v3: AI quest summary (Claude vision)

### Quest content system
- [ ] Move word banks → Postgres `quest_prompts` table with `id / prompt / category / difficulty / xp / region_tag / season_tag`
- [ ] Daily rotation deterministic by `user_id + date`
- [ ] Contextual hints (city vs countryside) using OSM/Mapbox features around current pin

### State & data layer (when scope grows)
- [ ] Zustand for in-progress walk state (route, fog buffer, position) — design doc §9.2
- [ ] TanStack Query for server-backed data (quests, journal, badges)
- [ ] Framer Motion for screen-fade and progress reveals
- [ ] shadcn/ui primitives where helpful (Dialog, Sheet, Tabs)

### Production hardening
- [ ] Replace public OSRM demo with Mapbox Directions / GraphHopper / self-hosted OSRM
- [ ] CI: lint + type-check + build on PR (GitHub Actions)
- [ ] Vercel project + env wiring (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, optional `OSRM_BASE_URL`, Mapbox keys)
- [ ] PWA manifest + apple-touch-icon set
- [ ] Service worker (passthrough first, then offline tile cache)
- [ ] `not-found.tsx` and `error.tsx` boundaries

### Accessibility (per design doc §8)
- [ ] `aria-label` audit for icon-only buttons (notifications, search, settings, locate-me, layers, etc.)
- [ ] Touch-target verification (≥44px hit area on all interactive)
- [ ] Reduced-motion: confirm carousel transitions, progress reveals respect the global guard
- [ ] Colour-contrast audit against WCAG AA on text on tinted surfaces

### Painted asset slots (design doc §7)
- [ ] `/public/illustrations/logo-compass.svg`
- [ ] `/public/illustrations/landscape-home.png` (720×340)
- [ ] `/public/illustrations/backpack.png` (200×200 transparent)
- [ ] `/public/illustrations/medallions/{flower-purple,tree-orange,butterfly,bird,door}.png`
- [ ] `/public/illustrations/badges/{sage-leaf,moss-leaf,gold-star,gold-flower,sage-compass,lavender-door}.png`
- [ ] `/public/illustrations/avatars/luna-green.png`

### Stretch
- [ ] Background location for screen-locked walks (requires native shell)
- [ ] Streaks
- [ ] Friend leaderboards
- [ ] Custom user-defined word banks
- [ ] Multiple saved start pins (named — "home", "office", "dad's")
- [ ] Share-a-quest deep link (read-only public view)

---

## Open decisions (from design doc §11)

| Decision | Status | Notes |
|---|---|---|
| Map provider final pick | Open | Mapbox GL recommended; MapLibre at scale |
| CV ambition | Deferred to v2 | Skip for MVP |
| Achievements rules | Deterministic to start | Inferred later |
| Social / sharing | Excluded from MVP | Re-evaluate post-launch |
| Painted illustration pipeline | Pending | Brief illustrator early |
| Notifications | Open | Daily-quest vs streak-nag vs silent |
| Offline mode strategy | Pending | See `docs/fog-of-war.md` for the explored-set side |
