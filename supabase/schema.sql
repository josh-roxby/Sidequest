-- Side Quest — Supabase schema
-- Paste into the SQL editor of a fresh Supabase project, or run via the
-- Supabase CLI (supabase db push). Idempotent: each block is guarded so
-- re-running on an existing database is safe.

-- ================================================================
-- 1. Profiles (one row per auth.users entry)
-- ================================================================

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own"   on public.profiles;
drop policy if exists "profiles: update own" on public.profiles;

create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user is created.
-- Pulls display_name from auth.user_metadata if the signup form set it,
-- otherwise leaves it null for the user to fill in later.
--
-- Onboarding state is intentionally NOT stored here: it lives in
-- auth.users.raw_user_meta_data->>'onboarding_completed' so middleware
-- can read it from the JWT without an extra query. See
-- app/welcome/actions.ts for the writer.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
    values (
      new.id,
      nullif(new.raw_user_meta_data->>'display_name', '')
    )
    on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ================================================================
-- 2. User settings (mirrors SideQuestData minus history)
-- ================================================================

create table if not exists public.user_settings (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  pin_lat              double precision,
  pin_lng              double precision,
  pin_set_at           timestamptz,
  radius_km            numeric not null default 2,
  mode                 text    not null default 'mixed' check (mode in ('city','countryside','mixed')),
  privacy_acknowledged boolean not null default false,
  updated_at           timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "user_settings: read own"   on public.user_settings;
drop policy if exists "user_settings: insert own" on public.user_settings;
drop policy if exists "user_settings: update own" on public.user_settings;

create policy "user_settings: read own"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "user_settings: insert own"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "user_settings: update own"
  on public.user_settings for update
  using (auth.uid() = user_id);

-- ================================================================
-- 3. Quests (history + currently-active quest)
-- ================================================================

create table if not exists public.quests (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  started_at         timestamptz not null,
  completed_at       timestamptz,
  status             text not null check (status in ('active','completed','abandoned')),

  origin_lat         double precision not null,
  origin_lng         double precision not null,
  target_lat         double precision not null,
  target_lng         double precision not null,

  distance_m         numeric not null,
  return_distance_m  numeric,
  routed             boolean not null default false,

  -- Polylines stored as jsonb arrays of [lat, lng] pairs to match the
  -- Quest.route / Quest.returnRoute shape in data/types.ts.
  route              jsonb not null,
  return_route       jsonb,

  mode               text not null check (mode in ('city','countryside','mixed')),
  action             text not null,
  item               text not null,
  descriptor         text not null,
  prompt_text        text not null,

  created_at         timestamptz not null default now()
);

create index if not exists quests_user_started_at_idx
  on public.quests (user_id, started_at desc);

-- Only one quest per user can be in `active` status at a time. Partial
-- unique index keeps the constraint cheap and ignores completed rows.
create unique index if not exists quests_one_active_per_user_idx
  on public.quests (user_id)
  where status = 'active';

alter table public.quests enable row level security;

drop policy if exists "quests: read own"   on public.quests;
drop policy if exists "quests: insert own" on public.quests;
drop policy if exists "quests: update own" on public.quests;
drop policy if exists "quests: delete own" on public.quests;

create policy "quests: read own"
  on public.quests for select
  using (auth.uid() = user_id);

create policy "quests: insert own"
  on public.quests for insert
  with check (auth.uid() = user_id);

create policy "quests: update own"
  on public.quests for update
  using (auth.uid() = user_id);

create policy "quests: delete own"
  on public.quests for delete
  using (auth.uid() = user_id);

-- ================================================================
-- 4. updated_at maintenance
-- ================================================================

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists user_settings_touch_updated_at on public.user_settings;
create trigger user_settings_touch_updated_at
  before update on public.user_settings
  for each row execute function public.touch_updated_at();
