-- Reference data: countries, zones, categories, points, lore.
-- Read-only to authenticated users; written only by the pipeline via the
-- service role. NOT APPLIED.

create table if not exists public.countries (
  iso2       text primary key,
  name       text not null,
  geom       geography(MultiPolygon, 4326) not null,
  bbox       jsonb not null
);

-- Ireland's ~61,000 townlands are the human-readable territory layer. They sit
-- BESIDE the H3 tiles, not instead of them: hexagons do the fog, townlands
-- give progression a place-name vocabulary. docs/PRD.md §8.10.
create table if not exists public.zones (
  id           uuid primary key default gen_random_uuid(),
  country_iso2 text not null references public.countries(iso2) on delete cascade,
  kind         text not null check (kind in ('townland','parish','barony','county')),
  name         text not null,
  name_ga      text,
  name_meaning text,
  parent_id    uuid references public.zones(id) on delete set null,
  geom         geography(MultiPolygon, 4326) not null,
  area_m2      numeric not null
);
create index if not exists zones_geom_idx on public.zones using gist (geom);
create index if not exists zones_parent_idx on public.zones (parent_id);

create table if not exists public.poi_categories (
  id                          text primary key,
  "group"                     text not null,
  label                       text not null,
  rarity_weight               numeric not null default 1,
  independent_only            boolean not null default false,
  default_completion_radius_m integer not null default 40,
  default_dwell_s             integer not null default 180,
  icon_key                    text not null
);

create table if not exists public.pois (
  id                    uuid primary key default gen_random_uuid(),
  country_iso2          text not null references public.countries(iso2) on delete cascade,
  zone_id               uuid references public.zones(id) on delete set null,
  category_id           text not null references public.poi_categories(id),
  name                  text not null,
  name_ga               text,
  geom                  geography(Point, 4326) not null,
  completion_radius_m   integer not null default 40,
  dwell_s               integer not null default 180,
  quality_score         numeric not null default 0,
  lore_richness         numeric not null default 0,
  -- Publish below 0.35, human review 0.35–0.70, auto-exclude above.
  -- docs/data-pipeline.md §5.
  chain_confidence      numeric not null default 0,
  chain_signals         jsonb   not null default '{}'::jsonb,
  independent           boolean not null default true,
  opening_hours         text,
  availability_checked_at timestamptz,
  source                text not null,
  source_ref            text not null,
  osm_type              text,
  osm_id                bigint,
  wikidata_id           text,
  status                text not null default 'draft'
                        check (status in ('draft','published','excluded','closed')),
  exclusion_reason      text,
  created_at            timestamptz not null default now(),
  unique (source, source_ref)
);
create index if not exists pois_geom_idx on public.pois using gist (geom);
create index if not exists pois_published_idx on public.pois (country_iso2, category_id)
  where status = 'published';

-- Every published row carries a source, a URL and a licence. A model may
-- compress sourced text; it may never originate a fact. docs/PRD.md §8.12.
create table if not exists public.poi_lore (
  id               uuid primary key default gen_random_uuid(),
  poi_id           uuid not null references public.pois(id) on delete cascade,
  kind             text not null check (kind in
                     ('archaeology','architecture','placename','fact','reference','folklore','editorial')),
  title            text not null,
  body             text,
  source_name      text not null,
  source_url       text not null,
  licence          text not null,
  attribution_text text not null,
  -- Share-alike and non-commercial sources render as an outbound link and
  -- must not carry body text. Duchas is CC BY-NC, so this is enforced here
  -- rather than trusted to the reader. docs/data-pipeline.md §2.
  link_only        boolean not null default false,
  confidence       numeric not null default 1,
  reviewed_by      uuid,
  reviewed_at      timestamptz,
  published        boolean not null default false,
  constraint lore_link_only_has_no_body check (not link_only or body is null),
  constraint lore_published_has_source check (not published or length(source_url) > 0)
);
create index if not exists poi_lore_poi_idx on public.poi_lore (poi_id) where published;
