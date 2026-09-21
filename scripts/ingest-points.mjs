#!/usr/bin/env node
/** Turning gathered county files into something the app can read.
 *
 *  The corpus in `lib/data/mock/` is hand written and imported straight into
 *  the bundle, which is fine at fifty points and impossible at eight thousand:
 *  fifty points is already seventy six kilobytes of TypeScript, so the whole
 *  island would be twelve megabytes of JavaScript that every walker downloads
 *  to find out what is at the end of their own road.
 *
 *  So gathered points are data rather than code. One file per county under
 *  `public/data/points/`, plus an index carrying each county's bounding box,
 *  and the app fetches only the counties near the walker. Dublin alone is a
 *  couple of hundred kilobytes; the whole country is never loaded at once.
 *
 *    npm run ingest:points
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { checkFile } from "./check-points.mjs";

const SRC = "data/points";
const OUT = "public/data/points";

/** Fields the app actually reads. Anything else in a gathered record is
 *  working material for the session that produced it and is dropped here, so
 *  the file the walker downloads carries nothing they will never see. */
function toPoint(p) {
  const out = {
    id: p.id,
    name: p.name,
    category: p.category,
    group: p.group,
    townland: p.townland ?? p.settlement ?? "",
    county: p.county,
    tags: Array.isArray(p.tags) ? p.tags : [],
    blurb: p.blurb,
    visited: false,
    lat: p.lat,
    lng: p.lng,
    lore: (p.lore ?? []).map((l) => ({
      kind: l.kind,
      title: l.title ?? "",
      body: l.linkOnly ? "" : (l.body ?? ""),
      sourceName: l.sourceName ?? "",
      sourceUrl: l.sourceUrl ?? "",
      licence: l.licence ?? "",
      linkOnly: Boolean(l.linkOnly),
    })),
  };
  if (p.nameGa) out.nameGa = p.nameGa;
  if (p.settlement) out.settlement = p.settlement;
  return out;
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

if (!existsSync(SRC)) {
  console.error(`no ${SRC}/ to read. See docs/cowork-poi-brief.md.`);
  process.exit(1);
}
const files = readdirSync(SRC).filter((f) => f.endsWith(".ndjson"));
if (files.length === 0) {
  console.error(`no county files in ${SRC}/. See docs/cowork-poi-brief.md.`);
  process.exit(1);
}

/* Checked first, and nothing is written if anything fails. A half ingested
   dataset is worse than none: the app would show some of a county and give no
   sign that the rest was refused. */
let blocked = 0;
const accepted = [];
for (const f of files) {
  const path = join(SRC, f);
  const r = checkFile(path);
  if (r.problems.length) {
    blocked += r.problems.length;
    console.error(`\n${path}: ${r.problems.length} problems, not ingesting`);
    for (const p of r.problems.slice(0, 10)) console.error(`  ${p}`);
    if (r.problems.length > 10) console.error(`  ... and ${r.problems.length - 10} more`);
    continue;
  }
  const points = readFileSync(path, "utf8").split("\n")
    .filter((l) => l.trim()).map((l) => JSON.parse(l));
  accepted.push({ path, points });
}
if (blocked > 0) {
  console.error(`\n${blocked} problems across the files above. Run npm run check:points and fix them.`);
  process.exit(1);
}

/* By county rather than by file, so two files covering one county merge and a
   file covering two counties splits. What the session called the file is not
   the app's business. */
const byCounty = new Map();
for (const { points } of accepted) {
  for (const p of points) {
    if (!byCounty.has(p.county)) byCounty.set(p.county, []);
    byCounty.get(p.county).push(p);
  }
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const index = [];
let totalBytes = 0;
let totalPoints = 0;

for (const [county, raw] of [...byCounty].sort()) {
  /* An id can only appear once across the whole dataset, and the last one
     written wins, so two sessions covering the same ground converge rather
     than doubling it up. */
  const unique = [...new Map(raw.map((p) => [p.id, p])).values()];
  const points = unique.map(toPoint);

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const file = `${slug(county)}.json`;
  const body = JSON.stringify(points);
  writeFileSync(join(OUT, file), body);

  index.push({
    county,
    file,
    count: points.length,
    /* West, south, east, north. The app loads a county only when this box is
       within reach of the walker, which is what keeps the download small. */
    bbox: [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
  });
  totalBytes += body.length;
  totalPoints += points.length;
  const dropped = raw.length - unique.length;
  console.log(`${county.padEnd(14)} ${String(points.length).padStart(5)} points  ${String(Math.round(body.length / 1024)).padStart(5)} kB`
    + (dropped ? `  (${dropped} duplicate ids merged)` : ""));
}

writeFileSync(join(OUT, "index.json"), JSON.stringify(index));
console.log(`\n${totalPoints} points, ${Math.round(totalBytes / 1024)} kB across ${index.length} counties, written to ${OUT}/`);

/* A county the walker might plausibly load in one go. Past this it is worth
   splitting a county by district before it is worth anything else. */
const heaviest = index.reduce((a, b) => (a.count > b.count ? a : b), index[0]);
if (heaviest && heaviest.count > 2000) {
  console.log(`\n${heaviest.county} has ${heaviest.count} points in one file. Worth splitting by district.`);
}
