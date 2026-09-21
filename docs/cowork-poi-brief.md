# Brief for a Cowork session: the Side Quest points dataset

Everything below the rule is the prompt. Paste it into a Cowork session, which
has web search and this machine does not, and set `COUNTY` on the first line.
One county per run.

Output goes to `data/points/<county-slug>.ndjson`; `npm run ingest:points`
reads every file in that folder and rebuilds the corpus.

**Why NDJSON and not one JSON array.** These runs are long. One object per
line means a session that stops halfway still leaves a usable file, where a
truncated array is a syntax error and the whole run is lost.

---

COUNTY: <put the county here, e.g. Clare>

You are building the points of interest dataset for Side Quest, a walking app
for Ireland. A point is somewhere worth walking to with something true and
interesting to say about it. The app anchors generated walking routes on these,
so a bad point sends a real person to a real place for no reason, and a dull
point wastes the one line of text they will read about it.

## What to produce

One NDJSON file for the county named above: one JSON object per line, no
wrapping array, no trailing commas, UTF-8, filename `<county-slug>.ndjson`.

**Volume.** This is a national dataset and thin coverage is the thing that
makes the app useless outside Dublin. Aim for:

| County size | Target points |
|---|---|
| Dublin, Cork, Galway, Antrim, Down | 350 to 500 |
| Kerry, Mayo, Donegal, Tipperary, Clare, Limerick, Wexford, Wicklow, Kilkenny, Waterford, Meath, Kildare, Tyrone, Londonderry | 200 to 350 |
| Everywhere else | 120 to 250 |

**Spread matters more than the total.** A county with 300 points all within
ten kilometres of the county town is worse than one with 150 spread properly.
Two rules:

1. **Every settlement over about 1,500 people gets at least 5 points**, and
   every town over 10,000 gets at least 20. Get the settlement list and
   populations from the CSO census of population small area or settlement
   tables, or from NISRA for the six northern counties. Work through them by
   name, do not eyeball a map.
2. **Rural ground counts.** Between the towns there are ringforts, holy wells,
   mass rocks, famine roads, castles, souterrains and mountain passes. A walker
   in a village of 400 people still deserves somewhere to go.

## Hard rules

These are not style preferences. Breaking one makes the record unusable.

1. **Never invent anything.** Every factual claim must come from a source you
   actually opened in this session. If you cannot source it, leave the field
   out. A point with a name and no lore beats a point with a plausible
   invented story. Do not infer a date, a founder or an etymology because it
   sounds right. This is the single most important rule and the one that would
   quietly ruin the dataset.
2. **Coordinates must be checked against a second source.** Decimal degrees,
   six places, WGS84. Ireland runs roughly lat 51.4 to 55.4, lng -10.6 to
   -5.4. A point in the sea, in the wrong county, or in the middle of a field
   half a kilometre from the thing it names is a defect. Much of the SMR is
   published in Irish Transverse Mercator (EPSG:2157) or Irish Grid
   (EPSG:29903): convert properly, do not approximate.
3. **Every `lore` entry carries a real `sourceName`, `sourceUrl` and
   `licence`.**
4. **Share-alike and non-commercial sources are linked, never quoted.**
   Wikipedia is CC BY-SA and Dúchas is CC BY-NC. Use them to *find* places and
   to check facts, never to fill `body`. For those, set `linkOnly: true`,
   leave `body` as an empty string, and put the URL in `sourceUrl`.
5. **British English. No em dashes anywhere, in any field.** Irish forms in
   `nameGa` only where a source gives one. Never translate one yourself.
6. **No commercial venues.** No shops, cafés, pubs, hotels or restaurants.
7. **Nothing you cannot legally reach.** If it is on private land with no
   public access and cannot be seen from a public road or right of way, leave
   it out. Say so in `tags` as `No entry` where a thing is visible but closed.

## Sources

Start at **data.gov.ie**. It runs CKAN, so the search API is the fast way in
rather than clicking around:

```
https://data.gov.ie/api/3/action/package_search?q=<terms>&rows=50
https://data.gov.ie/api/3/action/package_show?id=<dataset-name>
```

Search terms worth running: `archaeological survey`, `national monuments`,
`sites and monuments record`, `architectural heritage`, `NIAH`, `protected
structures`, `heritage`, `walking trails`, `placenames`, `settlements`.

**Do not trust any specific URL I give you.** Dataset paths move. Resolve the
current resource through the CKAN API or the dataset page, and if something
404s, search for it rather than guessing a variant.

| Source | What it gives | Licence | Quote in `body`? |
|---|---|---|---|
| Archaeological Survey of Ireland / SMR, National Monuments Service (data.gov.ie, archaeology.ie, the Historic Environment Viewer) | ~140k monument records: class, position, description | CC BY 4.0 | Yes, attributed |
| NIAH, buildingsofireland.ie | Post-1700 buildings with **written Description and Appraisal**. The best prose in the whole register and it needs editing, not writing | CC BY | Yes, attributed |
| Logainm.ie (Gaois) | Irish forms, placename meanings, townlands | CC BY 4.0 | Yes, attributed |
| OpenStreetMap (Overpass API) | Positions, parks, bridges, trails, `historic=*`, `tourism=attraction` | ODbL | Yes, attributed |
| Wikidata | Dates, identifiers, coordinates to cross-check | CC0 | Yes |
| NPWS (npws.ie) | National parks, nature reserves, designated sites | Open, verify | Check the page |
| OPW (heritageireland.ie) | State heritage sites, the ones with car parks and signs | Verify | Check the page |
| Heritage Council, heritagemaps.ie | County heritage inventories | Verify | Check |
| Sport Ireland / National Trails Office | Waymarked ways and looped walks | Verify | Check |
| CSO and NISRA | Settlement names and populations, for the coverage rule | Open | Not lore |
| Wikipedia | **Finding** places, checking facts | CC BY-SA | **No.** `linkOnly` |
| Dúchas, National Folklore Collection | **Finding** stories | CC BY-NC | **No.** `linkOnly` |

For the six northern counties the equivalents are the **Northern Ireland
Sites and Monuments Record** and the **NI Historic Environment Division**
listed buildings database, via opendatani.gov.uk and communities-ni.gov.uk.

Overpass is the quickest way to sweep a county for what the official registers
miss. A query shape that works:

```
[out:json][timeout:180];
area["name"="County Clare"]["admin_level"~"6|5"]->.a;
(
  node(area.a)["historic"];
  way(area.a)["historic"];
  node(area.a)["tourism"="attraction"];
  node(area.a)["natural"="waterfall"];
  way(area.a)["leisure"="park"];
);
out center tags;
```

## What counts as a point

In priority order.

1. **OPW and state heritage sites, NPWS parks and reserves.** Signed, open,
   parked. Every one belongs.
2. **Upstanding archaeology**: castles, tower houses, round towers, high
   crosses, dolmens and portal tombs, stone circles, cairns, monastic sites,
   holy wells, cashels and ringforts with something still standing. **Skip
   anything recorded as levelled, "site of", or cropmark only.** There is
   nothing to go and see and sending somebody to an empty field is the fastest
   way to lose their trust.
3. **Architectural heritage** rated Regional or above in the NIAH.
4. **Landscape and water**: waterfalls, lough shores with a path, sea stacks,
   headlands, beaches, mountain passes, forest parks, greenways, famine roads,
   disused railway lines.
5. **Urban texture**, in every town: parks, bridges, churches, libraries,
   statues, market houses, mills, old industrial works, named terraces and
   squares, town walls, harbours. This is what makes a fifteen minute walk
   possible from somebody's front door, and it is the part most likely to get
   skipped. Do not skip it.
6. **Where something happened**: battle sites, birthplaces, wreck sites,
   famine graveyards, places in a well known song or poem. Say plainly when a
   location is traditional or disputed rather than asserting it.

## The record

```json
{
  "id": "p-clare-dysert-odea",
  "name": "Dysert O'Dea",
  "nameGa": "Díseart Uí Dheá",
  "county": "Clare",
  "townland": "Dysert",
  "settlement": "Corofin",
  "category": "Monastic site",
  "group": "sacred",
  "lat": 52.905123,
  "lng": -9.073456,
  "blurb": "A round tower stump, a high cross and a Romanesque doorway in one field.",
  "tags": ["Upstanding remains", "Free", "12th century"],
  "lore": [
    {
      "kind": "archaeology",
      "title": "Twelve apostles and a bishop",
      "body": "One sourced paragraph of forty to ninety words, in plain British English. Say the thing a local would tell you, not what the eye can already see.",
      "sourceName": "Archaeological Survey of Ireland",
      "sourceUrl": "https://...",
      "licence": "CC BY 4.0",
      "linkOnly": false
    },
    {
      "kind": "reference",
      "title": "Battle of Dysert O'Dea, 1318",
      "body": "",
      "sourceName": "Wikipedia",
      "sourceUrl": "https://en.wikipedia.org/wiki/Battle_of_Dysert_O%27Dea",
      "licence": "CC BY-SA 4.0",
      "linkOnly": true
    }
  ]
}
```

**Field rules.**

- `id`: `p-<county-slug>-<name-slug>`, lowercase, hyphens, unique in the file.
- `name`: what a local calls it, not the survey's record number.
- `nameGa`: omit the field entirely if no source gives one.
- `county`: full name, no "Co.". All 32, north and south.
- `townland`: the townland, from Logainm. Omit if you genuinely cannot find it.
- `settlement`: the town or village it belongs to, for the coverage rule. Omit
  for open country.
- `category`: a short human noun phrase in title case. "Ringfort", "Round
  tower", "Waterfall", "Market house". Not a code and not a survey class.
- `group`: exactly one of `fort`, `sacred`, `ancient`, `water`, `green`,
  `height`, `built`, `table`. Use `table` only for a picnic area or similar
  that is not a business.
- `lat` / `lng`: decimal degrees, six places.
- `blurb`: **one sentence, under 90 characters**, saying what it is before you
  have been. Concrete and specific. "A wall built to scour the harbour that
  accidentally made an island" rather than "a fascinating historic landmark".
- `tags`: two to four short chips. `Free`, `Paid entry`, `Guided`, `Upstanding
  remains`, `Coastal`, `Level walking`, `Steep`, `Waterside`, `No entry`,
  `Street`, and a century such as `12th century`.
- `lore`: one to three entries. At least one non-`linkOnly` with a real `body`,
  unless a link is genuinely all you can source.
- `lore[].kind`: one of `archaeology`, `architecture`, `placename`, `fact`,
  `reference`. Use `reference` for `linkOnly`.
- `lore[].body`: 40 to 90 words. **This is the product.** It should be the
  thing somebody repeats in the pub afterwards: who built it and why it went
  wrong, what the name actually means, what happened here, what it was before.
  Not a description of what is visible, which the walker can see for
  themselves. No "nestled", no "steeped in history", no "must-see".

## How to work

Do not try to hold the whole county in one pass. Work in rounds and append to
the file as you go, so an interrupted run still leaves everything found so far:

1. Pull the settlement list with populations. Write it down.
2. Sweep the official registers for the county: OPW, NPWS, SMR, NIAH.
3. Run Overpass for the county and reconcile against what you already have.
4. Go settlement by settlement, largest first, until each clears its quota.
5. Fill the rural gaps: look for any 10km square of the county with nothing in
   it and go and find something there.

## Before you hand it over

Check each of these and say in your reply that you did:

- Every line parses as JSON on its own.
- Every `id` is unique.
- Every coordinate is inside Ireland and inside the right county.
- No two points within 50m of each other with similar names. Merge them.
- Every `lore` entry has a source name, a URL that resolves, and a licence.
- Every `linkOnly: true` entry has an empty `body`.
- No em dashes. No commercial venues.

Then report: the total count, the count per settlement against its quota, and
**any part of the county you could not find anything for**. A county with 150
good points and an honest list of gaps is a far better result than 400 with
invented lore in it. The gaps are how the next run knows where to go.
