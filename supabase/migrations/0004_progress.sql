-- Territory, visits, progression. NOT APPLIED.

-- Cells, never raw tracks. A res-11 cell set cannot be replayed as a route and
-- reveals no speed, direction or dwell time. docs/fog-of-war.md.
create table if not exists public.explored_cells (
  user_id      uuid not null references auth.users(id) on delete cascade,
  h3_cell      bigint not null,
  country_iso2 text not null,
  first_seen   timestamptz not null default now(),
  walk_id      uuid references public.walks(id) on delete set null,
  primary key (user_id, h3_cell)
);

create table if not exists public.user_zones (
  user_id      uuid not null references auth.users(id) on delete cascade,
  zone_id      uuid not null references public.zones(id) on delete cascade,
  coverage_pct numeric not null default 0,
  unlocked_at  timestamptz,
  primary key (user_id, zone_id)
);

create table if not exists public.poi_visits (
  user_id          uuid not null references auth.users(id) on delete cascade,
  poi_id           uuid not null references public.pois(id) on delete cascade,
  first_visited_at timestamptz not null default now(),
  visit_count      integer not null default 1,
  primary key (user_id, poi_id)
);

create table if not exists public.collections (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  slug         text not null unique,
  title        text not null,
  description  text,
  visibility   text not null default 'private'
               check (visibility in ('private','unlisted','public')),
  country_iso2 text,
  item_count   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.collection_items (
  collection_id uuid not null references public.collections(id) on delete cascade,
  quest_id      uuid not null references public.quests(id) on delete cascade,
  ordinal       integer not null,
  note          text,
  primary key (collection_id, quest_id)
);

-- Unlocks ship as data, not deploys. Inserting a rule requires a retroactive
-- evaluation pass: a user who already has five castles gets the badge.
create table if not exists public.unlock_rules (
  id          uuid primary key default gen_random_uuid(),
  type        text not null,
  params      jsonb not null default '{}'::jsonb,
  label       text not null,
  description text,
  badge_key   text not null,
  xp_reward   integer not null default 0,
  active      boolean not null default true
);

create table if not exists public.user_unlocks (
  user_id     uuid not null references auth.users(id) on delete cascade,
  rule_id     uuid not null references public.unlock_rules(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  walk_id     uuid references public.walks(id) on delete set null,
  primary key (user_id, rule_id)
);
