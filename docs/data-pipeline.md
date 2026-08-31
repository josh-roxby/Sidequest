# Building the Ireland dataset

| | |
|---|---|
| **Date** | 2026-08-31 |
| **Status** | Proposed — the plan behind PRD §11.4 and §16 |
| **Constraints** | PRD C1 (zero third-party spend) · C2 (we own the GIS) · C3 (no chains) · C4 (no invented history) |
| **Related** | [`PRD.md`](./PRD.md) |

> This is the document behind the question *"how would we build that initial
> dataset across all of Ireland, in refined passes, ensuring quality and
> availability, with no chains?"* Everything here runs on a laptop, uses
> open data, and costs nothing.

---

## 1. What we are building

One table of **points** covering Ireland, where every row is:

- **Categorised** into our taxonomy (PRD §9), not someone else's
- **Independent** — no chains, no franchises, no forecourt delis
- **Reachable** — from a public way, on foot, legally
- **Real** — visible on the ground, not a buried cropmark
- **Sourced** — provenance and licence tracked per row
- **Told** — a cited tale where one exists

Plus a **zone** layer (townlands and up) and a **quest corpus** built over
the top.

The pipeline is a sequence of **passes**. Each pass is idempotent, logs its
counts to `pipeline_runs`, and can be re-run alone. Nothing is destructive —
rows move between statuses, they don't get deleted.

**Key architectural choice:** all pipeline work happens in a **local
Postgres+PostGIS in Docker**. Only `published` rows are pushed to Supabase.
Raw extracts and intermediate tables are tens of gigabytes and have no
business on a production free tier.

```
Geofabrik ──┐
data.gov.ie ─┤
Logainm ─────┼──▶ local Postgres+PostGIS ──▶ passes 0–8 ──▶ published rows ──▶ Supabase
Wikidata ────┤        (Docker, laptop)                              │
OSM ─────────┘                                                       └──▶ PMTiles ──▶ Storage
```

---

## 2. Source register

Licences below were checked on 2026-08-31. **Re-verify before launch** —
this table is a compliance artefact, not a convenience.

### Verified

| Source | What it gives | Licence | Commercial |
|---|---|---|---|
| **OpenStreetMap** (Geofabrik Ireland + N. Ireland extract) | Base geometry, paths, roads, buildings, hospitality, many landmarks | **ODbL 1.0** | ✅ with attribution + database share-alike |
| **Archaeological Survey of Ireland / SMR** — National Monuments Service, via data.gov.ie | ~140k archaeological records: class, geometry, description | **CC BY 4.0** | ✅ |
| **NIAH** — National Inventory of Architectural Heritage, via data.gov.ie | Post-1700 buildings with **Description and Appraisal prose**, rating, classification | **data.gov.ie open, CC BY** | ✅ |
| **Logainm** — Placenames Database of Ireland | Townland/parish/barony names, **Irish forms and meanings**, JSON API | **CC BY 4.0** | ✅ |
| **Wikidata** | Identifiers, dates, images, cross-links | **CC0** | ✅ |
| **Dúchas** — National Folklore Collection, Schools' Collection | 1937–38 folklore, townland by townland | **CC BY-NC 4.0** | ❌ **non-commercial only** |
| **Wikipedia** | Prose articles | **CC BY-SA** | ⚠️ share-alike — link, don't embed |

### To verify before use

NPWS designated sites · Coillte forest recreation · OPW heritage sites ·
heritagemaps.ie · Waterways Ireland · townlands.ie boundary polygons
(OSM-derived, so presumed ODbL) · local-authority open data.

### The two findings that matter

**Dúchas is commercially blocked.** The Schools' Collection is the single
best "tale of a point" source for Ireland — schoolchildren recording local
folklore, indexed by townland — and CC BY-NC excludes commercial use. Given
PRD §16, the pipeline **must not depend on it**. v1 answer: **link out
only** (linking is not reuse). Longer term: approach UCD for a licence
(PRD Q10).

**NIAH ships prose.** The Description and Appraisal fields are professionally
written architectural descriptions — *already the tale*, under an open
licence. For built heritage this is the highest-value lore source in the
register and it needs no writing at all, only editing.

---

## 3. The passes

| Pass | Name | Output |
|---|---|---|
| 0 | Ingest | Raw source tables, unmodified |
| 1 | Normalise | One `pois_staging` shape across all sources |
| 2 | Deduplicate | One row per real-world place |
| 3 | **Reachability** | Only places you can legally, physically get to |
| 4 | **Visibility** | Only places that are actually *there* |
| 5 | **Chain exclusion** | No chains (C3) |
| 6 | Enrich | Tales, zones, images |
| 7 | Score | Quality, rarity, lore richness |
| 8 | Review & publish | Human gate, then push to production |

Passes 3, 4 and 5 are the ones that make this dataset different from a dump
of OSM. They are where the work is.

---

### Pass 0 — Ingest

Raw, unmodified, one table per source.

```
osmium tags-filter ireland-and-northern-ireland.osm.pbf \
  historic=* amenity=cafe,restaurant,pub,bar,fast_food \
  shop=bakery,farm,greengrocer natural=peak,cliff,wood,water \
  tourism=viewpoint,artwork leisure=nature_reserve \
  man_made=lighthouse,windmill,watermill waterway=waterfall \
  -o filtered.osm.pbf
osm2pgsql -d sidequest_build --output=flex ...
```

SMR, NIAH: CSV from data.gov.ie → `ogr2ogr` → PostGIS, reprojected from
Irish Transverse Mercator (**EPSG:2157**) to WGS84 (**EPSG:4326**). Getting
this projection wrong puts every monument in Ireland a few hundred metres
from where it is — check it explicitly with a known control point.

Logainm: JSON via the Gaois API, paged, cached to disk. Wikidata: one SPARQL
query per category against the public endpoint, cached.

Every raw table keeps its native identifiers untouched. Provenance starts
here.

### Pass 1 — Normalise

Map every source into one `pois_staging` shape: `source`, `source_ref`,
`name`, `name_ga`, `geom`, `raw_category`, `raw_attributes jsonb`.

Then map `raw_category` → our taxonomy through an explicit, version-
controlled **mapping table**, not a pile of `if` statements. Two reasons: the
mapping *is* the taxonomy and needs reviewing as data; and re-tagging after a
taxonomy change becomes an UPDATE, not a code deploy.

Unmapped raw categories land in a review queue rather than being silently
dropped — that queue is how the taxonomy learns what Ireland actually has.

### Pass 2 — Deduplicate

The same holy well appears in OSM, SMR, and possibly Wikidata. Match on:

1. **Spatial proximity** — within 50 m (150 m for large sites like abbeys)
2. **Fuzzy name** — `pg_trgm` similarity > 0.6 on normalised names
3. **Shared identifier** — `wikidata_id`, or an OSM `ref:*` tag pointing at
   an SMR number

Two of three signals merges the rows. **Source precedence for merged
fields:**

| Field | Wins |
|---|---|
| Geometry | OSM (surveyed on the ground, usually most current) |
| Archaeological classification | SMR (it is the authority) |
| Architectural description | NIAH (it is the authority) |
| Irish name and meaning | Logainm |
| Identifiers, images | Wikidata |

The merged row keeps **all** source references — provenance is a list, not a
single value. This is what makes the dataset defensible later (PRD §16).

### Pass 3 — Reachability

**Ireland has no general right to roam.** A large share of recorded
monuments sit in private fields. Sending a user to one is a trespass, a
safety problem, and a fast way to lose the goodwill of farmers and heritage
bodies alike.

A point is **reachable** only if:

- It is within **60 m** of a way that is publicly walkable — OSM `highway`
  of `footway`, `path`, `track`, `bridleway`, `residential`, `unclassified`,
  `tertiary` and similar, excluding anything tagged `access=private` or
  `access=no`; **or**
- It lies inside a polygon of known public access — OPW site, national park,
  Coillte recreation forest, nature reserve, public park, `access=yes`.

Everything else is set `status='excluded'` with `exclusion_reason =
'unreachable'`. **Not deleted** — reachability changes as OSM improves, and
this becomes a re-check queue.

For borderline cases we also compute the **walking distance from the nearest
public way** using the offline Valhalla instance, not the straight line. A
monument 40 m from a road as the crow flies but on the far side of a river is
not 40 m away.

Expect this pass to remove a *large* fraction of SMR — that is the pass
working, not failing.

### Pass 4 — Visibility

Most SMR records are not things you can see. "Fulacht fiadh" is usually a
grass-covered mound at best; "souterrain" is underground; many entries are
literally "site of" a thing that is gone.

A point is **visible** if:

- Its class is on a **visible-classes allowlist** — castle, tower house,
  round tower, high cross, dolmen, stone circle, standing stone, church
  ruin, holy well, cairn, martello tower, and similar upstanding remains; or
- Its SMR or NIAH description contains upstanding-remains language and not
  removal language (`"no visible trace"`, `"site of"`, `"removed"`,
  `"levelled"`, `"destroyed"` → excluded); or
- OSM independently maps it, which is strong evidence someone stood there
  and saw it.

Otherwise `exclusion_reason = 'not_visible'`.

This pass is the difference between "312 ringforts near you" that are mostly
invisible bumps in private fields, and 40 that are genuinely worth walking to.
**Progression denominators are computed after passes 3 and 4**, so
*"Ringforts: 3 of 47"* means 47 you can actually reach and see.

### Pass 5 — Chain exclusion

C3, mechanised. Each hospitality point gets a **`chain_confidence` in
0–1** from independent signals, with the evidence kept in `chain_signals
jsonb` so a human reviewer can see *why*.

| Signal | Confidence | Note |
|---|---|---|
| Match on curated **denylist** | **1.00** | Definitive |
| OSM `brand:wikidata` present | 0.95 | OSM's own chain marker — the strongest automatic signal |
| `brand` tag present | 0.85 | |
| Normalised name at **≥4** distinct locations nationally | 0.90 | |
| …at 3 locations | 0.60 | → review band |
| …at 2 locations | 0.30 | Often a genuine local with two shops |
| Shared `website` domain across ≥3 points | 0.85 | Catches franchises trading under varied names |
| `operator` appearing ≥5 times | 0.80 | |
| Inside a supermarket or petrol forecourt polygon | 0.90 | Deli counters, forecourt coffee |
| Match on curated **allowlist** | **forced 0** | Protects the local bakery with three shops |

Signals combine as `1 - Π(1 - cᵢ)`, so several weak signals accumulate.

**Name normalisation** before frequency counting: lowercase; strip
punctuation and diacritics; drop leading "the"; strip legal suffixes
(ltd, teo, t/a); and **strip a trailing place name** that matches a zone —
so "Costa Coffee Galway", "Costa Coffee Ennis" and "Costa Coffee" collapse to
one name and trip the frequency signal.

**Thresholds:**

| Band | Action |
|---|---|
| `< 0.35` | **Publish** |
| `0.35 – 0.70` | **Human review** in the admin console |
| `> 0.70` | **Auto-exclude**, `exclusion_reason='chain'` |

The denylist is seeded by running the frequency analysis over the whole
country and reviewing the top ~200 names by location count — which finds the
chains empirically rather than from anyone's memory, including the Irish
ones a non-local list would miss. Maintained thereafter in the admin console.

**A chain in production is a P1 bug** with a one-tap user report straight to
the review queue.

### Pass 6 — Enrich

**Zones.** Point-in-polygon every point into its townland, and cascade
parish/barony/county from the zone hierarchy. Townland boundaries from
townlands.ie / OSM (verify licence); names, Irish forms and **meanings** from
Logainm.

**Tales.** Build `poi_lore` rows, each with source, URL, licence and
attribution:

| Kind | From | Notes |
|---|---|---|
| `archaeology` | SMR class + description | Often terse; edit for readability, never for content |
| `architecture` | NIAH Description + Appraisal | Already good prose. Trim, don't rewrite |
| `placename` | Logainm | *"Ballynacally — Baile na Coille, the town of the wood."* The highest-coverage tale in the dataset: **every** point has a townland, so every point has at least one |
| `fact` | Wikidata | Dates, builders, materials |
| `reference` | Wikipedia | **Link only** — CC BY-SA share-alike |
| `folklore` | Dúchas | **Link only** — CC BY-NC |
| `editorial` | Us | Human-written, or LLM-compressed from the above **under review** (C4) |

The placename tale is the quiet win here. Coverage of good archaeological
prose is patchy; coverage of *"here is what this place's name means"* is
close to total, and it is exactly the kind of thing that makes a walk feel
like it has a story.

**Images.** Wikimedia Commons via Wikidata — **check each image's licence
individually**. Commons is not uniformly free. Store the licence and the
required credit alongside the URL, or don't store the image.

### Pass 7 — Score

| Score | Inputs |
|---|---|
| `quality_score` | Source authority, geometry precision, name presence, reachability margin, OSM edit recency, image presence |
| `lore_richness` | Count and kind of published lore rows, weighted by confidence |
| `rarity_weight` | From the category, adjusted by count within the county |
| `availability_confidence` | Hospitality only — see §4 |

`quality_score` and `lore_richness` drive quest scoring (PRD §8.5 step 3),
so **curation effort compounds directly into quest quality**: the more we
write, the better the generated quests get, with no algorithm change.

### Pass 8 — Review and publish

Nothing reaches production unreviewed in a category we haven't yet
calibrated.

- **Full review**: everything in the chain band; all `editorial` lore; a
  sample of every new category until its error rate is under a threshold.
- **Sampled review**: 1-in-50 of automatically-accepted rows, to keep an
  honest error estimate.
- Publish sets `status='published'` and pushes to Supabase.

Then build the quest corpus over the published set (PRD §8.5), review the
quests themselves on a map, and publish those.

**Measure the review workload in the pilot region before scaling
nationally.** If Clare and Galway city take 40 hours, Ireland is a
budgetable ~400 hours; if they take 400, the automation thresholds need
rethinking before we find that out the hard way.

---

## 4. Availability and freshness

Heritage doesn't move. **Cafés close.** Hospitality is the only genuinely
volatile part of the dataset and it needs its own handling.

**`availability_confidence`** per hospitality point:

- OSM `opening_hours` present → +0.3
- Edited in OSM within 12 months → +0.3
- Website present and resolving → +0.2
- No closure report in 6 months → +0.2

**Rules that follow from it:**

1. **A food stop is never a required objective.** PRD §8.8. If it's shut, the
   quest still completes. This single rule removes most of the risk.
2. Below 0.5 confidence, the point is shown with "hours unverified — check
   before you go" and never used as a quest's only hospitality point.
3. **In-app reporting** — "closed down" / "wrong place" / "it's a chain" —
   feeds `reports`, and two independent closure reports auto-demote the point
   to review.
4. Monthly OSM refresh re-scores availability. Points unedited for 3+ years
   with no website drift downward on their own.
5. Seasonal points (a café at a beach car park) get a season window and are
   suppressed outside it.

We are **not** scraping opening hours from anywhere. It violates C1 in
spirit, the terms of most sources in fact, and it is the kind of shortcut
that is invisible until diligence (PRD §16).

---

## 5. Zones and the quest corpus

**Zones.** Ireland's ~61,000 **townlands** are the smallest land division and
almost all carry meaning-bearing Irish names. They become the human-readable
territory layer (PRD §8.10), sitting beside the H3 tiles rather than
replacing them: hexagons for the fog, townlands for the sentence *"you have
explored 14 townlands in Co. Clare."*

Ingest boundaries → simplify for rendering (keep full precision for
point-in-polygon) → join Logainm names and meanings → build the
townland → parish → barony → county hierarchy.

**Corpus.** With published points and zones in place, run the offline
builder (PRD §8.5):

```
for anchor in start_anchors:          # ~1,500 nationally
  for tier in [trot, stroll, sidequest, adventure]:
    for variant in 1..2:
      candidates = points_in_reach_annulus(anchor, tier)
      scored     = score(candidates)          # rarity × quality × lore × new territory
      loop       = valhalla_round_trip(anchor, pick(scored), tier)
      if within_tolerance(loop, tier) and passes_safety(loop):
        stage_quest(loop, objectives(loop), status='draft')
```

Order of ~12,000 quests. Built on a laptop in hours, reviewed on a map,
published to Postgres. **Zero runtime routing cost, forever.**

---

## 6. Tooling — all free, all local

| Job | Tool |
|---|---|
| OSM filtering | `osmium-tool` |
| OSM → Postgres | `osm2pgsql` (flex output) |
| CSV/shapefile → Postgres, reprojection | GDAL `ogr2ogr` |
| Pipeline database | Postgres + PostGIS in Docker |
| Ad-hoc analysis over extracts | DuckDB + spatial extension |
| Routing | Valhalla in Docker, Ireland extract |
| Vector tiles | `planetiler` or `tilemaker` → `.pmtiles` |
| Pass orchestration | Plain SQL migrations + Node/Python scripts, in-repo |
| Publish to production | Supabase CLI / service-role client |

No managed service. No subscription. One laptop and a few hours of compute
per full rebuild.

**Everything in-repo under `pipeline/`**, versioned with the app, so a full
rebuild is one command and the dataset is reproducible from source. That
reproducibility is itself part of the asset — an unreproducible dataset is a
liability.

---

## 7. Volume expectations

Order-of-magnitude, to be replaced with real counts after pass 0.

| Stage | Approx. rows |
|---|---|
| SMR raw | ~140,000 |
| NIAH raw | ~50,000 |
| OSM heritage + nature | ~40,000 |
| OSM hospitality | ~18,000 |
| After dedupe | ~200,000 |
| **After reachability (pass 3)** | **~60,000** |
| **After visibility (pass 4)** | **~25,000** |
| **Hospitality after chain exclusion (pass 5)** | **~12,000** |
| **Published points** | **~35,000** |
| Townlands | ~61,000 |
| Quests | ~12,000 |

The large drop across passes 3 and 4 is the entire point. A 200,000-row dump
of everything ever recorded is worthless to a walker; 35,000 places you can
reach, see, and learn something about is a product.

---

## 8. Refresh

| Cadence | Job |
|---|---|
| Monthly | OSM re-extract; re-run passes 0–7; diff report; new/changed rows to review |
| Monthly | Logainm delta via API (their own recommendation) |
| Quarterly | SMR / NIAH re-download — slow-moving |
| Quarterly | PMTiles basemap rebuild |
| Continuous | User reports → review queue |
| On demand | Taxonomy change → pass 1 re-tag only |

Refreshes **never overwrite human decisions.** Review outcomes, editorial
lore, denylist and allowlist entries live in tables the pipeline reads and
does not write. A rebuild that discards curation would destroy the asset it
exists to create.

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| **Review workload is far larger than estimated** | Pilot region first (PRD v0.75) measures it before national scale |
| **Reachability filter is too strict** — good places dropped | Excluded rows are kept with reasons; tune the threshold and re-run; user "this is reachable" reports |
| **…too loose** — user sent onto private land | Bias strict; every objective needs a public-way link; one-tap trespass report; treat as P1 |
| **Chain slips through** | Multi-signal scoring + review band + user reports; empirical denylist seeding |
| **Dúchas dependency creeps in** | Licence recorded per row; a publish check rejects any NC-licensed body text |
| **EPSG:2157 → 4326 error** | Explicit control-point test in the pass-0 test suite |
| **ODbL share-alike on the derived table** | Legal review pre-launch (PRD Q7) |
| **Wikimedia image licences assumed** | Store the licence or don't store the image |
| **Rebuild destroys curation** | Human decisions live in tables the pipeline only reads |

---

## 10. First steps

1. Stand up local Postgres+PostGIS and Valhalla in Docker.
2. Pull the Geofabrik Ireland extract; run pass 0 for OSM only.
3. Pull SMR and NIAH from data.gov.ie; verify the EPSG:2157 reprojection
   against a known monument.
4. Build the taxonomy mapping table (PRD §9) and run pass 1.
5. Run the **national name-frequency analysis** over OSM hospitality and
   review the top 200 by location count — this seeds the chain denylist
   empirically, and it is a genuinely interesting afternoon.
6. Prototype passes 3 and 4 on **one county** and eyeball the survivors
   against local knowledge. This is the honesty check on the whole approach:
   if the survivors in a county you know well are places you'd actually walk
   to, the pipeline works.
