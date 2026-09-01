# Side Quest

A walking app for Ireland. Pick how long you have, get a loop anchored to
real places worth knowing about, walk it, reveal territory permanently.

Read [`docs/PRD.md`](./docs/PRD.md) before making product decisions. Read
[`docs/design-system.md`](./docs/design-system.md) before touching any
component.

## Current phase

Front end reface on mock data. See [`docs/reface-plan.md`](./docs/reface-plan.md).

**Hard constraints for this phase.** Breaking one of these is a defect, not a
judgement call.

- **Do not apply database migrations.** Write them to `supabase/migrations/`,
  leave them unapplied. Applying them is a `TODO.md` item awaiting approval.
- **Do not deploy Supabase functions or create tables.**
- **Auth stays off.** No route requires a session and no redirect fires.
- **Screens never import Supabase.** They read through `lib/data`, which
  selects an implementation from `NEXT_PUBLIC_DATA_MODE` and defaults to
  mock.
- **No fabricated data in screens.** If something is not wired, it shows its
  empty state. A screen that looks finished and is connected to nothing is
  worse than one that looks unfinished.

## Design rules

The full system is in `docs/design-system.md`. These three are the ones that
get broken by accident.

1. **Three radii exist**, all set from tokens, never from a Tailwind radius
   utility: `--r-sm` 6px on controls, `--r-md` 10px on surfaces, `--r-full`
   on identity and map objects (avatars, tabs, markers). A `rounded-lg` in a
   diff is a defect.
2. **Every number is mono.** Distances, durations, counts, coordinates, XP,
   dates, percentages. JetBrains Mono with tabular figures. Prose is Archivo.
3. **Eight pixels.** Every floating surface sits `--gutter` from the screen
   edge. Frames, the thumb block, toasts, map controls. No other inset value.

Two more worth knowing before you build a screen.

- **Navigation is one button.** A 56px square in the thumb corner on every
  screen. Tap opens the square drawer (a `Frame`, so its dismiss lands back on
  the same square). Press and hold fans three tiles and you drag to one: up-left
  Map, up Quests, left Inventory. Nothing is hold-only.
- **Frames are squares, not drawers.** They scale from the thumb corner and
  never touch the bottom of the screen. Two ratios, 1:1 and 1:1.28, and no
  full screen sheet.

## Stack

Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4 with tokens
in `app/globals.css`, Supabase for auth and Postgres when it is switched on.

Decided and not yet built: MapLibre GL JS over self built PMTiles, Valhalla
offline for the quest corpus, our own PostGIS places dataset. Rationale in
PRD section 11. Costs nothing recurring, which is a hard product constraint.

## Layout

```
app/            routes. (app) group is the shell, everything else is public
components/
  primitives/   Action, Button, Card, Tabs, Field, Chip, Stat, Marks, States
  shell/        NavButton, NavDrawer, Frame, RankHeader, Screen, PhoneFrame
  map/          MapCanvas (pan, zoom, rotate, hex tiles)
  domain/       per feature composition
lib/
  data/         the read interface. mock/ and supabase/ implement it
  geo.ts        haversine, uniform point in radius, perpendicular waypoints
  map/hex.ts    axial hex tiling, the stand-in for H3
  nav.ts        the destination list, shared by the drawer and the shortcut
  fog/          H3 quantiser and local store, when it lands
supabase/
  migrations/   written, not applied
docs/           PRD, design system, UX loops, reface plan, data pipeline
```

## Commands

Illustration lives in `/public/plates/` and is referenced by key, never
inlined as SVG path data, so the whole layer can be swapped without touching
a component. Every slot holds its own space before the asset exists.

```bash
npm run dev
npm run lint
npm run type-check
npm run build
```

## Conventions

- British English in copy and comments. Irish placenames carry their Irish
  form where the dataset has one.
- No em dashes in interface copy or documentation prose.
- Comments explain why, not what. The existing comments in `lib/env.ts` and
  `lib/supabase/middleware.ts` are the standard to match.
- Distances are metric by default, written in mono, uppercase unit.
  Durations read `45 MIN` and `1H 30`.
- Never call a walk a journey.
- Chrome is never selectable. Buttons, labels, nav glyphs, headings and the
  canvas carry `user-select: none`. Prose opts back in with `.selectable`.
- Anything that owns a drag carries `.gesture` (`touch-action: none`) so the
  browser never competes with it.

## Things that will bite you

- `proxy.ts` is the Next 16 name for middleware. The matcher deliberately
  excludes `/api/*` so the health probe stays reachable when env is broken.
- Onboarding state lives in `user_metadata` because middleware reads it from
  the JWT. That is fine for onboarding. **Never put `is_admin` there**, it is
  user writable via `updateUser`. Admin is a database column with row level
  security.
- `useLiveLocation` guards non finite coordinates. That is a real iOS bug,
  not defensive noise. Keep it.
- Geolocation is never called on page load. Only a button press fires the
  browser prompt. See `docs/ux-loops.md` section B-2.
