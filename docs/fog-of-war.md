# Fog of War — storage architecture

Working note. The goal here is to pick a representation for "where the
user has been" that survives a) walks lasting hours offline, b) cross-device
sync, c) cheap reveal rendering at 60fps, and d) doesn't accumulate
unbounded GPS tracks per user. The design doc §9.5 already sketched the
options; this is the deeper pass.

---

## What we actually need to store

Three concepts, often conflated, that should stay separate in the schema:

| Concept | What it is | Lifetime | Purpose |
|---|---|---|---|
| **Live track** | The raw GPS samples for the current walk | Per-walk, ephemeral | Live route line, pace calc, snap-to-route |
| **Walk record** | A simplified polyline for a completed walk | Per-walk, kept | Journal map, "replay this walk", per-walk distance |
| **Explored set** | Aggregate "everywhere the user has been" | Forever, additive | Fog reveal, achievements ("Wandered 10km²"), region stats |

The fog overlay only needs the explored set. Walk records are a separate
question — they'd be stored as compressed polylines on the `quests` /
`walks` row and don't drive the fog mask.

This separation is what keeps the fog data small. We never aggregate raw
tracks; we aggregate **cells**.

---

## Cell representation: H3 vs square grid

Both options sketched in the design doc are coordinate-aligned grids.
Two main choices:

### Square grid (uint8 raster)

- **Cell**: e.g. 10m × 10m at the equator, indexed by floor((lat - origin) / step), floor((lng - origin) / step).
- **Storage**: a sparse map of `{tileX, tileY} → bitfield` works in IndexedDB, but server-side you end up either with a big array of bigints or a packed bitmap per region.
- **Render**: each visited tile becomes a rect on the canvas; with a soft brush over each, you get the watercolour reveal.
- **Math hazard**: tile size is correct only at the equator; in higher latitudes a square in lat/lng degrees is rectangular on the ground. Has to be compensated for or the fog reveal looks stretched.

### H3 hexagonal index (recommended)

- **Cell**: H3 resolution 11 ≈ 30m diameter, resolution 12 ≈ 11m. Each cell is a 64-bit integer.
- **Storage**: a `Set<bigint>` of explored cells. Trivially small even for heavy users.
- **Cross-device sync**: just a list of integers; no coordinate-system gotchas.
- **Render**: convert visited cells to GeoJSON polygons via `cellToBoundary` and paint as a single canvas erase mask.
- **Math hazard**: none worth worrying about; H3 handles latitude scaling.
- **Library**: [h3-js](https://github.com/uber/h3-js), Apache-2.0, tiny WASM payload.

H3 wins on every axis we care about. The only reason to prefer a raster
grid is if we want extremely fast batch-paint of millions of cells, which
isn't the scale we're aiming for.

**Pick: H3 resolution 11 (~30m). Drop to res 12 only if 30m bands feel
chunky on the reveal — scale-up means 7× more cells per area, evaluate in
playtesting.**

---

## Source-of-truth: client-only / server-only / hybrid

Three options:

| | Client-only (IndexedDB) | Server-only (Postgres) | Hybrid |
|---|---|---|---|
| Walk while offline | ✓ | ✗ | ✓ |
| Cross-device sync | ✗ | ✓ | ✓ |
| Reveal latency | instant | network roundtrip | instant |
| Storage cost | free | per-row | per-row |
| Privacy | best (data never leaves device) | weakest | tunable |
| Failure mode | losing the device wipes progress | server hiccup interrupts walk | both must agree |

Hybrid is the right answer for this product:

1. **During a walk**: the client owns the explored set. New cells are
   written to IndexedDB the moment GPS reports them, and revealed on
   the canvas the same frame.
2. **On walk-end**: client diffs the new cells against the last known
   server state and posts the delta.
3. **On app load (any device)**: client pulls the full explored set and
   hydrates IndexedDB. After that, walk-time writes stay local until the
   next end-of-walk sync.

This means the fog reveal is always instant (local), the user can walk
in airplane mode, and switching devices never silently loses progress.

---

## Privacy posture

We deliberately store **only the cells**, never the raw GPS samples,
in the explored-set table. A list of 30m hex IDs is dramatically less
identifying than a per-second track:

- It can't be replayed as a route.
- It doesn't reveal direction or speed.
- It doesn't reveal pause locations (sitting on a bench for an hour
  contributes the same single cell as walking through).

The walk-record table (per-quest polyline) is where the higher-resolution
trace lives, and it's user-deletable from the journal. Privacy modal copy
should make that distinction explicit.

---

## Proposed schema (Supabase, additive)

Not committed to `supabase/schema.sql` yet — flagged in `TODO.md` to land
when we start implementing. Sketch:

```sql
-- One row per (user, cell). Additive. Insertions can race safely
-- because of the natural primary key.
create table public.explored_cells (
  user_id     uuid    not null references auth.users(id) on delete cascade,
  h3_cell     bigint  not null,                  -- res 11 cell id
  first_seen  timestamptz not null default now(),
  walk_id     uuid    references public.quests(id) on delete set null,
  primary key (user_id, h3_cell)
);

create index explored_cells_user_idx on public.explored_cells (user_id);

alter table public.explored_cells enable row level security;

create policy "explored_cells: read own"
  on public.explored_cells for select
  using (auth.uid() = user_id);

create policy "explored_cells: insert own"
  on public.explored_cells for insert
  with check (auth.uid() = user_id);
```

We'd also extend `quests` with `walk_polyline jsonb` for the per-walk
trace.

### Sync RPC

```sql
create or replace function public.append_explored(
  cells       bigint[],
  source_walk uuid default null
)
returns int
language sql
security definer
as $$
  with ins as (
    insert into public.explored_cells (user_id, h3_cell, walk_id)
    select auth.uid(), unnest(cells), source_walk
    on conflict do nothing
    returning 1
  )
  select coalesce(count(*), 0)::int from ins;
$$;
```

Returns the number of *new* cells unlocked, which the UI uses to drive
the post-walk celebration ("you uncovered 142 new paths today").

---

## Render approach

A canvas overlay above the Mapbox GL canvas, redrawn on view change:

1. On view change (`moveend`): query the user's explored cells whose
   bounds intersect the visible bbox (client-side filter on the in-memory
   set is fine; with H3 there's a `polygonToCells` helper for the bbox).
2. For each cell in view, draw a soft-edged white circle at the cell's
   centroid, sized to the screen-projected diameter, into an offscreen
   canvas at low resolution (e.g. half display).
3. Composite that offscreen canvas onto a full-screen "fog" canvas using
   `globalCompositeOperation = 'destination-out'`.
4. Blur the result a few px, then draw on top of the map at 65% opacity.

Watercolour edge: the design doc suggests SVG `feTurbulence` +
`feDisplacementMap` on the fog texture — that goes on the same overlay
once the basic version is shipping.

For walk-time reveal we don't redraw the whole mask each frame: we just
erase a single soft circle at the user's current position into the
existing fog buffer. Nominally O(1) per GPS sample.

---

## Open questions

- Do we render fog only on the Map screen, or also on the small map
  thumbnails in the journal? (Probably yes for journal hero map, no for
  per-walk thumbnails.)
- "Region" achievements ("Explored 1km² of city X") need a city
  polygon dataset. Defer to v2.
- Streak rules: revealing a *new* cell counts toward streak; revisiting
  doesn't. The RPC returns the count of inserts so this is cheap.
- How to handle GPS jitter: a single bad sample shouldn't reveal a cell
  300m away. Apply a max-jump-per-sample filter (~30m at walking pace,
  configurable upward at running pace) before quantising to H3.
- Backfill: if the user installs on a second device, fetching the full
  explored set for a heavy user is the worst case. Sketch: paginate by
  inserted-after timestamp, cache locally, only re-fetch the tail.

---

## What ships first (when we're ready)

1. h3-js + an H3 quantiser in `lib/fog/h3.ts`.
2. IndexedDB store for the local explored set (`lib/fog/local-store.ts`).
3. Walk-time integration: feed `useLiveLocation` into the H3 quantiser,
   write new cells.
4. Canvas overlay component on the Map screen.
5. End-of-walk sync via the `append_explored` RPC.
6. App-load hydration from the server.

This is a self-contained 1-2 week chunk and can sit behind a feature flag
until we like the feel.
