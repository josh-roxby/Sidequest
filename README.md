# Side Quest

Turn a walk into a generated adventure. Share your location, see your country
as a stylised map, and get a **sidequest** — a walking loop anchored to real
places worth seeing. Walking it reveals map territory permanently, advances
category progression ("visit 5 castles"), and writes a permanent history.
Save quests into shareable collections.

**Start here:** [`docs/PRD.md`](./docs/PRD.md) — the full product
requirements, data model, and architecture decisions.

## Status

Early. The auth, schema, CI, and design-system foundations are built; the
product domain is being rebuilt against the PRD. The current screens are
visual scaffolds and several still render placeholder data — see
[`docs/repo-review.md`](./docs/repo-review.md) §3.6.

## Docs

| Doc | What it covers |
|---|---|
| [`docs/PRD.md`](./docs/PRD.md) | Product requirements, features, data model, architecture, release plan |
| [`docs/repo-review.md`](./docs/repo-review.md) | Full code review, security audit, strip-back plan, order of work |
| [`docs/fog-of-war.md`](./docs/fog-of-war.md) | H3 territory storage architecture |
| [`TODO.md`](./TODO.md) | Live punch list by release phase |

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript strict
- Tailwind v4 — tokens via `:root` + `@theme inline` in `app/globals.css`
- Supabase — Auth, Postgres + RLS, Storage. **PostGIS required** (not yet enabled)
- Fraunces (display) + Plus Jakarta Sans (body) via `next/font`
- Lucide React for system icons

Decided, not yet implemented (rationale in PRD §11):

- **Map:** MapLibre GL JS, MapTiler tiles, PMTiles self-host as the cost
  escape hatch. *Leaflet is currently a dependency and is being removed.*
- **Routing:** self-hosted Valhalla. *Currently points at the public OSRM
  demo, which is not for production.*
- **POI data:** OSM ingested into our own PostGIS, never a third-party API on
  the request path.
- **Territory:** H3 hexagons, resolution 11.

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

Active development is on `claude/*` feature branches. The `main` / `dev`
release line described in earlier revisions is not currently in use.

## Licensing note

Map and POI data will be OpenStreetMap-derived (ODbL: attribution and
share-alike), with Wikidata (CC0) and Wikipedia (CC BY-SA) enrichment.
Attribution is mandatory and the share-alike posture needs review before any
public launch — see PRD §11.4 and §13.
