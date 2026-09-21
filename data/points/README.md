# County point files

One NDJSON file per county, produced by a Cowork session running
[`docs/cowork-poi-brief.md`](../../docs/cowork-poi-brief.md). One JSON object
per line, no wrapping array.

They live here rather than in `lib/data/mock/` because they are gathered
rather than written: the machine this repo is built on cannot reach
data.gov.ie, Logainm, Wikidata or any OSM endpoint, so the corpus in
`lib/data/mock/dublin.ts` is hand placed and covers Dublin 3 and 9 only.
These files are how the rest of the country gets in.

```bash
npm run check:points                      # every file here
npm run check:points data/points/clare.ndjson
npm run ingest:points                     # build what the app reads
```

Nothing is ingested until it passes. The checker enforces the same rules the
brief asks for, because a list somebody is asked to verify is a list somebody
skips: coordinates inside the right county, sources and licences on every
piece of lore, share-alike text linked rather than quoted, no near duplicates,
no invented filler.

## What ingest produces

`public/data/points/<county>.json`, one file per county, plus an `index.json`
carrying each county's bounding box and count. That folder is generated and
git ignored; these NDJSON files are the source.

The app loads a county only when its box is within reach of where the walker
actually is, so somebody in Fairview downloads Dublin and nothing else. The
whole island is several megabytes and is never fetched at once. `lib/data/mock/
gathered.ts` does the loading and `merge` there decides what happens when a
gathered place duplicates a hand placed one: the gathered one wins, because it
is surveyed rather than placed from memory.
