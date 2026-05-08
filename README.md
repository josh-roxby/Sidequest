# Side Quest

A walking app. Drop a pin, pick a radius, get a random target inside it, and
walk a perpendicular-waypoint loop while completing a small generated quest
("Photograph an unusual cloud", "Listen for a fragrant hedgerow"). Local-first
with optional cloud sync via Supabase.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript strict
- Tailwind v4
- Supabase (auth + Postgres for cloud-synced quest history)
- Leaflet 1.9 + react-leaflet 5 (CARTO Dark Matter tiles)
- OSRM walking-route geometry (swap for a paid provider in production)

## Getting started

```bash
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

npm install
npm run dev
```

Then run `supabase/schema.sql` in your Supabase project's SQL editor to
create the auth-linked tables and RLS policies.

## Branch layout

- `main` — release line; only merge from `dev` once green.
- `dev` — active integration branch; feature branches merge here.

## What's here / what's left

See [`TODO.md`](./TODO.md) for the live punch list.
