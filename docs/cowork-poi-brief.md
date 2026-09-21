# Brief for a Cowork session: the Side Quest points dataset

Copy everything between the rules below into a Cowork session. It has web
search and this machine does not, which is the whole reason the job lives
there. One county per run.

The output lands in `data/points/<county>.ndjson` in this repo, and
`scripts/ingest-points.mjs` reads it from there.

---

You are building the points of interest dataset for Side Quest, a walking app
for Ireland. A point is somewhere worth walking to, with something true to say
about it. The walk generator anchors routes on these, so a bad point sends a
real person to a real place for no reason.

## The job

Produce **one NDJSON file for the county named in this run**: one JSON object
per line, no wrapping array, no trailing commas, UTF-8. Filename
`<county-slug>.ndjson`, for example `clare.ndjson`, `dublin.ndjson`.

Target **100 to 150 points for the county**. Fewer is fine for a small or
thinly recorded county. Do not pad to hit a number.

## Hard rules

These are not style preferences. Breaking one makes the record unusable.

1. **Never invent history.** Every factual claim must come from a source you
   actually opened in this session. If you cannot source it, leave the field
   out. A point with a name and no lore is better than a point with a
   plausible invented story. This is the single most important rule.
2. **Every `lore` entry carries its source.** `sourceName`, `sourceUrl` and
   `licence` are required and must be real.
3. **Share-alike and non-commercial sources are linked, never quoted.** If the
   text is Wikipedia (CC BY-SA) or Dúchas (CC BY-NC), set `linkOnly: true`,
   leave `body` as an empty string, and put the URL in `sourceUrl`. You may
   still use those pages to *find* a place and to check a fact against an open
   source. You may not copy their prose into `body`.
4. **Coordinates must be real and checked.** Decimal degrees, six places,
   WGS84. Ireland is roughly lat 51.4 to 55.4, lng -10.6 to -5.4. A point in
   the sea or in the wrong county is a defect. Cross-check against a second
   source where you can.
5. **British English.** No em dashes anywhere, in any field. Irish placenames
   carry their Irish form in `nameGa` where a source gives one, left out where
   none does. Do not translate one yourself.
6. **No chains and no commercial venues.** No shops, no cafés, no hotels, no
   restaurants. This app does not send people shopping.
7. **Nothing on private land without public access.** If you cannot walk to it
   or see it from a public road or right of way, leave it out.

## What counts as a point

In priority order. Work down the list until the county has enough.

1. **OPW heritage sites and National Monuments in state care.** Signed, open,
   usually with parking. These are the brown sign spots and every one belongs.
2. **NPWS national parks, nature reserves and designated sites** with public
   access.
3. **Upstanding archaeology** from the Archaeological Survey of Ireland: castles
   and tower houses, round towers, high crosses, dolmens and portal tombs,
   stone circles, cairns, monastic sites, holy wells, ringforts and cashels with
   something still standing. Skip records that are cropmarks, "site of", or
   levelled: there is nothing to go and see.
4. **Architectural heritage** from the National Inventory of Architectural
   Heritage rated Regional or above. The NIAH's own Description and Appraisal
   fields are professionally written, openly licensed, and are usually the best
   lore you will find. Edit them down, do not rewrite them into something they
   do not say.
5. **Landscape and water**: waterfalls, loughs with a shore path, sea stacks,
   named headlands, holy wells, mass rocks, famine roads, old railway lines and
   greenways.
6. **Urban texture**, for towns over about five thousand people: parks, notable
   bridges, churches, libraries, statues, mills and old industrial works, named
   terraces and squares. This is what makes a fifteen minute walk possible from
   somebody's front door, so do not skip it in the towns.

Aim for a spread across the county rather than a cluster round the county town.
A walker in a village needs something too.

## Sources, and what each is good for

| Source | Use it for | Licence | In `body`? |
|---|---|---|---|
| Archaeological Survey of Ireland / SMR, via data.gov.ie or archaeology.ie | Class, position, description of monuments | CC BY 4.0 | Yes, with attribution |
| National Inventory of Architectural Heritage (buildingsofireland.ie) | Post-1700 buildings, **written appraisals** | CC BY | Yes, with attribution |
| Logainm.ie | Irish forms and placename meanings | CC BY 4.0 | Yes, with attribution |
| OpenStreetMap | Positions, parks, bridges, paths | ODbL | Yes, with attribution |
| Wikidata | Dates, identifiers, cross-links | CC0 | Yes |
| OPW (heritageireland.ie) | State sites, opening arrangements | Verify per page | Check first |
| Wikipedia | **Finding** places and checking facts | CC BY-SA | **No.** `linkOnly: true` |
| Dúchas / National Folklore Collection | **Finding** stories | CC BY-NC | **No.** `linkOnly: true` |

Prefer an open source for the prose even when a closed one is better written.

## The record

```json
{
  "id": "p-clare-dysert-odea",
  "name": "Dysert O'Dea",
  "nameGa": "Díseart Uí Dheá",
  "county": "Clare",
  "townland": "Dysert",
  "category": "Monastic site",
  "group": "sacred",
  "lat": 52.905123,
  "lng": -9.073456,
  "blurb": "A round tower stump, a high cross and a Romanesque doorway in one field.",
  "tags": ["Upstanding remains", "Free", "12th century"],
  "lore": [
    {
      "kind": "archaeology",
      "title": "The doorway and the cross",
      "body": "One sourced paragraph, forty words or more, in plain British English. Say what is there and why it matters. Do not pad.",
      "sourceName": "Archaeological Survey of Ireland",
      "sourceUrl": "https://www.archaeology.ie/...",
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
- `name`: what a local would call it. Not the survey's record number.
- `nameGa`: omit the field entirely if no source gives one.
- `county`: full name, no "Co.". Northern counties included: this is the
  island, not the state.
- `townland`: the townland or, in a town, the district. Logainm has these.
- `category`: a short human noun phrase: "Ringfort", "Round tower", "Country
  house", "Waterfall", "Holy well", "Sea wall". Title case, not a code.
- `group`: exactly one of: `fort`, `sacred`, `ancient`, `water`, `green`,
  `height`, `built`, `table`. Use `table` only for a place to sit and eat that
  is not a business, such as a picnic area.
- `lat` / `lng`: decimal degrees, six places.
- `blurb`: **one sentence**, under about 90 characters, saying what it is
  before you have been. Concrete, not promotional. "A wall built to scour the
  harbour that accidentally made an island" rather than "a fascinating
  historical landmark".
- `tags`: two to four short chips. Useful ones: `Free`, `Paid entry`,
  `Guided`, `Upstanding remains`, `Coastal`, `Level walking`, `Steep`,
  `Waterside`, `No entry`, `Street`, and a century such as `12th century`.
- `lore`: **one to three entries**. At least one must be non-`linkOnly` with a
  real `body`, unless the only thing you can source is a link, in which case
  one `linkOnly` entry alone is acceptable and honest.
- `lore[].kind`: exactly one of: `archaeology`, `architecture`, `placename`,
  `fact`, `reference`. Use `reference` for `linkOnly` entries.
- `lore[].body`: 40 to 90 words. Plain, specific, and true. No "nestled", no
  "steeped in history", no "must-see".

## Before you hand the file over

Check all of these and say in your reply that you did:

- Every line parses as JSON on its own.
- Every `id` is unique within the file.
- Every `lat`/`lng` is inside Ireland and inside the right county.
- No two points sit within 50m of each other with similar names. Merge them.
- Every `lore` entry has a `sourceName`, a `sourceUrl` that resolves, and a
  `licence`.
- Every `linkOnly: true` entry has an empty `body`.
- No em dashes anywhere in the file.
- No commercial venues.
- Count the points and report the number, and list any part of the county you
  could not find anything for.

Report honestly. A county with 60 good points is a better result than 150 with
invented lore in it, and a gap you name is a gap somebody can fill.
