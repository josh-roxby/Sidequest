# Migrations

**None of these have been applied.** Writing them is done; applying them to a
Supabase project is a `TODO.md` item awaiting sign-off. See `CLAUDE.md`.

| File | Covers |
|---|---|
| `0001_extensions.sql` | PostGIS and pg_trgm |
| `0002_reference.sql` | countries, zones, categories, points, lore |
| `0003_quests_walks.sql` | the quest / walk split and objectives |
| `0004_progress.sql` | territory, visits, collections, unlocks |
| `0005_admin_and_ops.sql` | admin flag, chain lists, reports, audit |
| `0006_rls.sql` | row level security for everything above |

`supabase/schema.sql` is the previous schema, still describing the retired
pin-and-word-bank model. It is left in place until these are applied, then
deleted.

## Before applying

1. Read `0006_rls.sql` closely. The quest visibility policy is the only
   non-trivial one and it needs a test written against it first.
2. `0005` alters `public.profiles`, which already exists. Check the current
   table before running it.
3. Apply in order. `0006` depends on every table above it existing.
