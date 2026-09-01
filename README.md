# Side Quest

Turn a walk into a local adventure. Share your location, see Ireland as a
stylised map we built ourselves, pick how long you have — **Trot (15m),
Stroll (45m), Sidequest (1.5h), Adventure (3h)** — and get a walking loop
anchored to real places worth knowing about.

**Nothing on the map is a chain.** Every café, pub and restaurant is
independent, by pipeline rule. Every point can tell you its **tale** —
sourced, cited history and Irish placename lore, never invented. Walking
reveals map territory permanently, unlocks townlands, advances category
progression, and fills a personal history. Quests curate into shareable
collections.

Two constraints shape everything: **no third-party service spend to reach
MVP**, and **we own the data**.

**Start here:** [`docs/PRD.md`](./docs/PRD.md) — the full product
requirements, data model, and architecture decisions.

## Status

Front end reface, running on mock data. There is no database: migrations are
written to `supabase/migrations/` and deliberately unapplied, auth is off, and
every screen reads through `lib/data`, which defaults to a mock source. See
[`docs/reface-plan.md`](./docs/reface-plan.md) and `CLAUDE.md`.

```bash
npm install && npm run dev     # nothing else to configure
```

## Docs

| Doc | What it covers |
|---|---|
| [`docs/PRD.md`](./docs/PRD.md) | Product requirements, features, data model, architecture, release plan |
| [`docs/data-pipeline.md`](./docs/data-pipeline.md) | How the Ireland dataset gets built — sources, licences, refinement passes, chain exclusion |
| [`docs/repo-review.md`](./docs/repo-review.md) | Full code review, security audit, strip-back plan, order of work |
| [`docs/design-system.md`](./docs/design-system.md) | Tokens, the square frame, navigation, illustration, patterns |
| [`docs/ux-loops.md`](./docs/ux-loops.md) | Every screen as a loop: states, gestures, motion, edges |
| [`docs/reface-plan.md`](./docs/reface-plan.md) | The current front end phase and its constraints |
| [`docs/fog-of-war.md`](./docs/fog-of-war.md) | H3 territory storage architecture |
| [`TODO.md`](./TODO.md) | Live punch list by release phase |

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript strict
- Tailwind v4 — tokens via `:root` + `@theme inline` in `app/globals.css`
- Supabase — Auth, Postgres + RLS, Storage. **PostGIS required** (not yet enabled)
- Fraunces (display) + Plus Jakarta Sans (body) via `next/font`
- Lucide React for system icons

Decided, not yet implemented (rationale in PRD §11). Every line is
self-hosted or free-tier — **£0 recurring to MVP**:

- **Map:** MapLibre GL JS rendering vector tiles we build ourselves, shipped
  as one PMTiles archive on Supabase Storage. *Leaflet is currently a
  dependency and is being removed.*
- **Routing:** Valhalla in Docker, run **offline** to pre-build the quest
  corpus. No routing server in production. *Currently points at the public
  OSRM demo, which is not for production.*
- **Places:** OpenStreetMap plus Irish national open data (SMR, NIAH,
  Logainm) ingested into our own PostGIS. Never a third-party places API.
- **Territory:** H3 hexagons at res 11 for fog; **townlands** for named zones.

## Getting started

```bash
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

npm install
npm run dev
```

Then run `supabase/schema.sql` in your Supabase project's SQL editor.

To review the UI without a Supabase project, set `NEXT_PUBLIC_AUTH_DISABLED=1`
— auth checks are skipped and pages render with a stub user.

```bash
npm run lint        # eslint
npm run type-check  # tsc --noEmit
npm run build
```

## Branches

`main` is the release line and carries everything. Feature work happens on
`claude/*` branches and merges back into `main`.

There is no `dev` branch. An earlier revision of this README described a
`main` / `dev` split that was never actually set up.

## Licensing note

Licences verified 2026-08-31 (full register in
[`docs/data-pipeline.md`](./docs/data-pipeline.md) §2):

- **OpenStreetMap** — ODbL. Attribution and database share-alike. The
  share-alike posture on our derived dataset needs legal review pre-launch.
- **Archaeological Survey of Ireland (SMR)**, **NIAH**, **Logainm** —
  CC BY 4.0 / data.gov.ie open. Commercial use fine with attribution.
- **Wikidata** — CC0.
- **Wikipedia** — CC BY-SA. Link out, don't embed.
- **Dúchas / Schools' Collection** — **CC BY-NC 4.0: non-commercial only.**
  Link out, never embed. A publish check enforces this.
