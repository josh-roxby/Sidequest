# Side Quest

A peaceful walking companion. Drop a pin, take a wander, complete small
acts of curiosity, and reveal a quietly gamey map of the world around you.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript strict
- Tailwind v4 (tokens via `@theme` in `app/globals.css`)
- Fonts: Fraunces (display) + Plus Jakarta Sans (body) via `next/font`
- Supabase (auth + Postgres + RLS)
- Lucide React for system icons; custom SVG marks for distinctive glyphs
- Map provider: TBD (Mapbox GL recommended — see `docs/fog-of-war.md` and `TODO.md`)

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
