-- Side Quest — extensions.
-- NOT APPLIED. See CLAUDE.md: migrations are written and committed, applying
-- them to a project is a TODO.md item awaiting approval.

create extension if not exists postgis;      -- ST_DWithin, GiST indexes on points
create extension if not exists pg_trgm;      -- place-name search, chain name matching
