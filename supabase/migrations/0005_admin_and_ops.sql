-- Admin, moderation, pipeline bookkeeping. NOT APPLIED.

-- is_admin is a COLUMN, writable only by the service role. It is never in
-- user_metadata, which the user can write via supabase.auth.updateUser.
-- docs/PRD.md §8.14.
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists home_country text;
alter table public.profiles add column if not exists unit_system text not null default 'metric';
alter table public.profiles add column if not exists avatar_url text;

create table if not exists public.chain_denylist (
  id         uuid primary key default gen_random_uuid(),
  pattern    text not null,
  match_kind text not null check (match_kind in ('name','brand','domain','operator')),
  note       text
);

create table if not exists public.chain_allowlist (
  id         uuid primary key default gen_random_uuid(),
  pattern    text not null,
  match_kind text not null check (match_kind in ('name','brand','domain','operator')),
  note       text
);

create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  target_kind text not null check (target_kind in ('poi','quest','lore','collection')),
  target_id   uuid not null,
  reason      text not null,
  body        text,
  status      text not null default 'open' check (status in ('open','actioned','dismissed')),
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at  timestamptz not null default now()
);

create table if not exists public.pipeline_runs (
  id          uuid primary key default gen_random_uuid(),
  pass        text not null,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  counts      jsonb not null default '{}'::jsonb,
  notes       text
);

create table if not exists public.admin_audit (
  id         bigserial primary key,
  actor_id   uuid not null references auth.users(id) on delete cascade,
  action     text not null,
  target     text not null,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
