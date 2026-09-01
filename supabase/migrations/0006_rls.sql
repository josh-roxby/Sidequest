-- Row level security. NOT APPLIED.
-- Every user-owned table: own rows only, no exceptions. Reference data is
-- read-only to authenticated users and written only by the service role.

alter table public.countries        enable row level security;
alter table public.zones            enable row level security;
alter table public.poi_categories   enable row level security;
alter table public.pois             enable row level security;
alter table public.poi_lore         enable row level security;
alter table public.quests           enable row level security;
alter table public.quest_objectives enable row level security;
alter table public.walks            enable row level security;
alter table public.walk_objectives  enable row level security;
alter table public.explored_cells   enable row level security;
alter table public.user_zones       enable row level security;
alter table public.poi_visits       enable row level security;
alter table public.collections      enable row level security;
alter table public.collection_items enable row level security;
alter table public.unlock_rules     enable row level security;
alter table public.user_unlocks     enable row level security;
alter table public.chain_denylist   enable row level security;
alter table public.chain_allowlist  enable row level security;
alter table public.reports          enable row level security;
alter table public.pipeline_runs    enable row level security;
alter table public.admin_audit      enable row level security;

-- Reference data: readable by anyone signed in, never writable from a client.
do $$
declare t text;
begin
  foreach t in array array['countries','zones','poi_categories','unlock_rules'] loop
    execute format('drop policy if exists "%1$s: read" on public.%1$I', t);
    execute format('create policy "%1$s: read" on public.%1$I for select using (true)', t);
  end loop;
end $$;

drop policy if exists "pois: read published" on public.pois;
create policy "pois: read published" on public.pois
  for select using (status = 'published');

drop policy if exists "poi_lore: read published" on public.poi_lore;
create policy "poi_lore: read published" on public.poi_lore
  for select using (published);

-- The one genuinely non-trivial policy in the system: a quest is visible if it
-- is published, or you made it, or it sits in a collection that is not private.
-- This needs a test. docs/PRD.md §10.
drop policy if exists "quests: read visible" on public.quests;
create policy "quests: read visible" on public.quests
  for select using (
    status = 'published'
    or created_by = auth.uid()
    or exists (
      select 1
      from public.collection_items ci
      join public.collections c on c.id = ci.collection_id
      where ci.quest_id = quests.id and c.visibility <> 'private'
    )
  );

drop policy if exists "quest_objectives: read visible" on public.quest_objectives;
create policy "quest_objectives: read visible" on public.quest_objectives
  for select using (
    exists (select 1 from public.quests q where q.id = quest_id)
  );

-- User-owned tables.
do $$
declare t text;
begin
  foreach t in array array['walks','explored_cells','user_zones','poi_visits','user_unlocks'] loop
    execute format('drop policy if exists "%1$s: own" on public.%1$I', t);
    execute format($f$create policy "%1$s: own" on public.%1$I
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id)$f$, t);
  end loop;
end $$;

drop policy if exists "collections: read visible" on public.collections;
create policy "collections: read visible" on public.collections
  for select using (owner_id = auth.uid() or visibility <> 'private');

drop policy if exists "collections: write own" on public.collections;
create policy "collections: write own" on public.collections
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "reports: insert own" on public.reports;
create policy "reports: insert own" on public.reports
  for insert with check (auth.uid() = reporter_id);

-- Admin-only tables. is_admin is a column on profiles, never user metadata.
do $$
declare t text;
begin
  foreach t in array array['chain_denylist','chain_allowlist','pipeline_runs','admin_audit'] loop
    execute format('drop policy if exists "%1$s: admin" on public.%1$I', t);
    execute format($f$create policy "%1$s: admin" on public.%1$I
      for all using (exists (
        select 1 from public.profiles p where p.id = auth.uid() and p.is_admin
      ))$f$, t);
  end loop;
end $$;
