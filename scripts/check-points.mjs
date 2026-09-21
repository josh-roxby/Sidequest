#!/usr/bin/env node
/** Checking a county file before it is trusted.
 *
 *  The Cowork brief ends with a list of things the session must verify. A list
 *  somebody is asked to verify is a list somebody skips, so this checks the
 *  same things mechanically and refuses the file if they do not hold.
 *
 *  Every rule here is in `docs/cowork-poi-brief.md`. If they disagree, the
 *  brief is the specification and this is the bug.
 *
 *    node scripts/check-points.mjs data/points/clare.ndjson
 *    node scripts/check-points.mjs            # every file in data/points/
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const COUNTIES = new Set([
  "Antrim", "Armagh", "Carlow", "Cavan", "Clare", "Cork", "Derry", "Londonderry",
  "Donegal", "Down", "Dublin", "Fermanagh", "Galway", "Kerry", "Kildare",
  "Kilkenny", "Laois", "Leitrim", "Limerick", "Longford", "Louth", "Mayo",
  "Meath", "Monaghan", "Offaly", "Roscommon", "Sligo", "Tipperary", "Tyrone",
  "Waterford", "Westmeath", "Wexford", "Wicklow",
]);
const GROUPS = new Set(["fort", "sacred", "ancient", "water", "green", "height", "built", "table"]);
const KINDS = new Set(["archaeology", "architecture", "placename", "fact", "reference"]);

/* Generous, because the island's extremes are further out than people expect:
   Malin Head is above 55.3 and the Blaskets past -10.5. */
const BOUNDS = { south: 51.3, north: 55.5, west: -10.8, east: -5.3 };

/** Words that mean the writer had nothing to say. */
const FILLER = [
  "nestled", "steeped in history", "must-see", "must see", "hidden gem",
  "picturesque", "breathtaking", "stunning", "iconic", "rich history",
  "a testament to", "boasts",
];

/* Whole words. Substring matching flagged "Archbishop's palace" as a shop,
   which is the sort of false positive that teaches somebody to skim past the
   warnings. */
const COMMERCIAL = /\b(hotel|restaurant|caf[eé]|pub|bar|shop|shopping centre|takeaway|guesthouse|hostel)\b/i;

const metres = (a, b) => {
  const R = 6371000, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

export function checkFile(path) {
  const problems = [];
  const warnings = [];
  const raw = readFileSync(path, "utf8");
  const lines = raw.split("\n").map((l, i) => ({ n: i + 1, text: l }))
    .filter((l) => l.text.trim().length > 0);

  const points = [];
  for (const { n, text } of lines) {
    let p;
    try {
      p = JSON.parse(text);
    } catch (e) {
      problems.push(`line ${n}: not valid JSON on its own (${e.message})`);
      continue;
    }
    points.push({ n, p });
  }

  const seenIds = new Map();
  const bySettlement = new Map();

  for (const { n, p } of points) {
    const at = (msg) => problems.push(`line ${n} (${p.id ?? p.name ?? "no id"}): ${msg}`);
    const warn = (msg) => warnings.push(`line ${n} (${p.id ?? p.name ?? "no id"}): ${msg}`);

    for (const f of ["id", "name", "county", "category", "group", "blurb"]) {
      if (typeof p[f] !== "string" || !p[f].trim()) at(`missing ${f}`);
    }
    if (typeof p.id === "string") {
      if (!/^p-[a-z0-9-]+$/.test(p.id)) at(`id "${p.id}" is not p-<slug>`);
      if (seenIds.has(p.id)) at(`id "${p.id}" also used on line ${seenIds.get(p.id)}`);
      else seenIds.set(p.id, n);
    }
    if (typeof p.county === "string" && !COUNTIES.has(p.county)) {
      at(`county "${p.county}" is not one of the 32`);
    }
    if (!GROUPS.has(p.group)) at(`group "${p.group}" is not a known group`);

    if (typeof p.lat !== "number" || typeof p.lng !== "number") {
      at("lat/lng missing or not numbers");
    } else if (p.lat < BOUNDS.south || p.lat > BOUNDS.north
      || p.lng < BOUNDS.west || p.lng > BOUNDS.east) {
      at(`at ${p.lat},${p.lng}, which is not in Ireland`);
    }

    if (typeof p.blurb === "string" && p.blurb.length > 90) {
      warn(`blurb is ${p.blurb.length} characters, over the 90 asked for`);
    }
    if (!Array.isArray(p.tags) || p.tags.length < 2 || p.tags.length > 4) {
      warn(`${Array.isArray(p.tags) ? p.tags.length : "no"} tags, wanted two to four`);
    }

    if (!Array.isArray(p.lore) || p.lore.length < 1) {
      at("no lore, so there is nothing to say about it");
    } else {
      if (p.lore.length > 3) warn(`${p.lore.length} lore entries, wanted at most three`);
      let hasBody = false;
      for (const [i, l] of p.lore.entries()) {
        const where = `lore[${i}]`;
        if (!KINDS.has(l?.kind)) at(`${where} kind "${l?.kind}" is not a known kind`);
        if (!l?.sourceName) at(`${where} has no sourceName`);
        if (typeof l?.sourceUrl !== "string" || !/^https?:\/\//.test(l.sourceUrl)) {
          at(`${where} has no usable sourceUrl`);
        }
        if (!l?.licence) at(`${where} has no licence`);
        if (l?.linkOnly) {
          if (l.body && l.body.trim()) at(`${where} is linkOnly but carries a body, which is a licence problem`);
        } else {
          hasBody = true;
          const w = words(l?.body ?? "");
          if (w < 40) at(`${where} body is ${w} words, under the 40 asked for`);
          else if (w > 110) warn(`${where} body is ${w} words, over the 90 asked for`);
        }
      }
      if (!hasBody && p.lore.every((l) => l.linkOnly)) {
        warn("everything is linkOnly, so the walker gets a link and no words");
      }
    }

    const all = JSON.stringify(p);
    if (all.includes("—")) at("contains an em dash");
    const lower = all.toLowerCase();
    for (const f of FILLER) if (lower.includes(f)) warn(`uses "${f}"`);
    if (typeof p.category === "string" && COMMERCIAL.test(p.category)) {
      warn(`category "${p.category}" looks like a commercial venue`);
    }

    const key = p.settlement ?? "(open country)";
    bySettlement.set(key, (bySettlement.get(key) ?? 0) + 1);
  }

  /* Near duplicates. Bucketed so this stays quick on a few thousand points. */
  const CELL = 0.002;
  const buckets = new Map();
  for (const { n, p } of points) {
    if (typeof p.lat !== "number" || typeof p.lng !== "number") continue;
    const bx = Math.floor(p.lng / CELL), by = Math.floor(p.lat / CELL);
    for (let x = bx - 1; x <= bx + 1; x++) {
      for (let y = by - 1; y <= by + 1; y++) {
        const k = `${x},${y}`;
        if (!buckets.has(k)) buckets.set(k, []);
        buckets.get(k).push({ n, p });
      }
    }
  }
  const flagged = new Set();
  for (const group of buckets.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i], b = group[j];
        if (a.p.id === b.p.id) continue;
        const pair = [a.p.id, b.p.id].sort().join("|");
        if (flagged.has(pair)) continue;
        if (metres(a.p, b.p) > 50) continue;
        const sa = slug(a.p.name ?? ""), sb = slug(b.p.name ?? "");
        if (sa.includes(sb) || sb.includes(sa)) {
          flagged.add(pair);
          warnings.push(`${a.p.id} and ${b.p.id} are within 50m and named alike: merge them`);
        }
      }
    }
  }

  return { path, count: points.length, problems, warnings, bySettlement };
}

/* Imported by the ingest as well as run on its own, so the two can never
   disagree about what a good record is. */
const invokedDirectly = process.argv[1]
  && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (!invokedDirectly) { /* exported only */ } else {

const args = process.argv.slice(2);
const dir = "data/points";
const files = args.length > 0
  ? args
  : existsSync(dir)
    ? readdirSync(dir).filter((f) => f.endsWith(".ndjson")).map((f) => join(dir, f))
    : [];

if (files.length === 0) {
  console.error(`nothing to check. Put county files in ${dir}/ or name one on the command line.`);
  process.exit(1);
}

let bad = 0;
let total = 0;
for (const f of files) {
  const r = checkFile(f);
  total += r.count;
  const head = `${r.path}  ${r.count} points`;
  console.log(`\n${head}\n${"-".repeat(head.length)}`);

  if (r.problems.length) {
    bad += r.problems.length;
    console.log(`  ${r.problems.length} must be fixed:`);
    for (const p of r.problems.slice(0, 40)) console.log(`    ${p}`);
    if (r.problems.length > 40) console.log(`    ... and ${r.problems.length - 40} more`);
  }
  if (r.warnings.length) {
    console.log(`  ${r.warnings.length} worth a look:`);
    for (const w of r.warnings.slice(0, 20)) console.log(`    ${w}`);
    if (r.warnings.length > 20) console.log(`    ... and ${r.warnings.length - 20} more`);
  }
  if (!r.problems.length && !r.warnings.length) console.log("  clean");

  const settlements = [...r.bySettlement].sort((a, b) => b[1] - a[1]);
  console.log(`  spread over ${settlements.length} settlements, thinnest:`);
  for (const [name, n] of settlements.slice(-5).reverse()) console.log(`    ${String(n).padStart(4)}  ${name}`);
}

console.log(`\n${total} points across ${files.length} file${files.length === 1 ? "" : "s"}`);
if (bad > 0) {
  console.log(`${bad} problems. Fix these before ingesting.`);
  process.exit(1);
}
console.log("Nothing blocking.");
}
