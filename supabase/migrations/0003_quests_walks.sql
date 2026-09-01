-- Quests are durable and shareable. Walks are one person's attempt at one.
-- The split is what makes collections and sharing possible at all.
-- docs/PRD.md §6. NOT APPLIED.

create table if not exists public.quests (
  id                uuid primary key default gen_random_uuid(),
  country_iso2      text not null references public.countries(iso2) on delete cascade,
  tier              text not null check (tier in ('trot','stroll','sidequest','adventure')),
  start_geom        geography(Point, 4326) not null,
  zone_id           uuid references public.zones(id) on delete set null,
  title             text not null,
  flavour           text,
  difficulty        text,
  distance_m        numeric not null,
  est_duration_s    integer not null,
  ascent_m          numeric,
  -- Never suppressed to make a quest look better. docs/ux-loops.md §D-2.
  honesty           text[] not null default '{}',
  route_polyline    text not null,
  return_polyline   text,
  routed            boolean not null default false,
  generator_version text not null,
  seed              bigint not null,
  tags              text[] not null default '{}',
  status            text not null default 'draft'
                    check (status in ('draft','published','retired')),
  created_by        uuid references auth.users(id) on delete set null,
  visibility        text not null default 'private'
                    check (visibility in ('private','unlisted','public')),
  created_at        timestamptz not null default now()
);
create index if not exists quests_start_idx on public.quests using gist (start_geom);
create index if not exists quests_tier_idx on public.quests (country_iso2, tier)
  where status = 'published';

create table if not exists public.quest_objectives (
  id                  uuid primary key default gen_random_uuid(),
  quest_id            uuid not null references public.quests(id) on delete cascade,
  ordinal             integer not null,
  poi_id              uuid references public.pois(id) on delete set null,
  geom                geography(Point, 4326) not null,
  required            boolean not null default true,
  kind                text not null default 'reach',
  prompt              text,
  completion_radius_m integer not null default 40,
  unique (quest_id, ordinal)
);

create table if not exists public.walks (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  quest_id       uuid not null references public.quests(id) on delete restrict,
  status         text not null check (status in ('active','completed','abandoned')),
  started_at     timestamptz not null default now(),
  completed_at   timestamptz,
  distance_m     numeric not null default 0,
  duration_s     integer not null default 0,
  -- The only replayable path we store, and individually deletable from the
  -- journal. docs/PRD.md §13.
  track_polyline text,
  tiles_gained   integer not null default 0,
  xp_awarded     integer not null default 0,
  flagged        boolean not null default false
);
create index if not exists walks_user_idx on public.walks (user_id, started_at desc);
-- One active walk per user. Partial index keeps it cheap and ignores history.
create unique index if not exists walks_one_active_per_user
  on public.walks (user_id) where status = 'active';

create table if not exists public.walk_objectives (
  walk_id             uuid not null references public.walks(id) on delete cascade,
  objective_id        uuid not null references public.quest_objectives(id) on delete cascade,
  completed_at        timestamptz not null default now(),
  verified_lat        double precision not null,
  verified_lng        double precision not null,
  verified_accuracy_m numeric,
  primary key (walk_id, objective_id)
);
