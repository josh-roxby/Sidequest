/** Generates the north Dublin fixture corpus into lib/data/mock/dublin.ts.
 *
 *  Run by hand when the anchors change:
 *
 *      node scripts/build-dublin.mjs
 *
 *  Why a script rather than typed coordinates: a route has to be a closed loop
 *  that starts and ends at its stated start, its drawn length has to equal the
 *  distance printed beside it, and every objective has to sit on the route
 *  that visits it. Those three do not survive hand editing. Here the loop is
 *  built as a wobbled circle round the anchor and the radius is converged
 *  until the drawn length matches, so the numbers on the screen are true of
 *  the line on the screen.
 *
 *  The anchors are real places in D03 and D09. The routes between them are
 *  fixture geography and are not surveyed paths: they are the right length in
 *  the right place, which is what a mock corpus owes you. The surveyed lines
 *  arrive with the dataset. docs/data-pipeline.md */
import { writeFileSync } from "node:fs";

const R = 6371000;
const rad = (d) => (d * Math.PI) / 180;
const distanceM = (a, b) => {
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

/** Deterministic noise, so re-running the script does not churn the diff. */
function rng(seed) {
  let h = 2166136261;
  for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
}

/** A closed loop of `n` points round a centre, radius wobbled so it reads as a
 *  route rather than a circle. Longitude is divided by cos(lat) so the loop is
 *  round on the ground rather than round in degrees. */
function loop(centre, radiusM, seed, n = 26) {
  const rand = rng(seed);
  const wob = Array.from({ length: n }, () => 0.72 + rand() * 0.56);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const r = radiusM * wob[i];
    const dLat = (r * Math.cos(t)) / 111320;
    const dLng = (r * Math.sin(t)) / (111320 * Math.cos(rad(centre.lat)));
    pts.push([+(centre.lng + dLng).toFixed(6), +(centre.lat + dLat).toFixed(6)]);
  }
  return pts;
}

const drawnLength = (path) => {
  let d = 0;
  for (let i = 1; i < path.length; i++) {
    d += distanceM({ lng: path[i - 1][0], lat: path[i - 1][1] },
      { lng: path[i][0], lat: path[i][1] });
  }
  return d;
};

/** Converge the radius until the drawn loop is the stated distance.
 *
 *  The loop is slid so that its first point lands exactly on the start, rather
 *  than the start being the centre it is drawn around: a walk begins on its
 *  route, not at the middle of it. Doing that the other way round left two
 *  spokes from the centre out to the ring and put every route 18% over its
 *  stated distance. */
function circleRoute(start, targetM, seed) {
  let r = targetM / (2 * Math.PI);
  let path = [];
  for (let i = 0; i < 80; i++) {
    const ring = loop(start, r, seed);
    const dLng = start.lng - ring[0][0], dLat = start.lat - ring[0][1];
    path = ring.map(([lng, lat]) => [+(lng + dLng).toFixed(6), +(lat + dLat).toFixed(6)]);
    path[0] = [+start.lng.toFixed(6), +start.lat.toFixed(6)];
    path.push(path[0]);
    const got = drawnLength(path);
    if (Math.abs(got - targetM) < 2) break;
    r *= targetM / got;
  }
  return path;
}

/** A closed route that actually passes through the places it claims to visit.
 *
 *  A quest links objectives to real points, and a fixture whose line goes
 *  nowhere near them is a lie the tests are right to catch. So the linked
 *  points are via points: the route runs start, via, via, start, each leg
 *  bowed outward by an amplitude that is converged until the total is the
 *  stated distance. Consecutive legs bow to opposite sides, so an out and back
 *  is a loop rather than the same line walked twice. */
function viaRoute(start, vias, targetM, perLeg = 9) {
  const pts = [start, ...vias, start];
  const bearing = (a, b) => {
    const dLng = (b.lng - a.lng) * Math.cos(rad((a.lat + b.lat) / 2));
    return Math.atan2(dLng, b.lat - a.lat);
  };
  const build = (amp) => {
    const path = [];
    for (let leg = 0; leg < pts.length - 1; leg++) {
      const a = pts[leg], b = pts[leg + 1];
      const side = leg % 2 === 0 ? 1 : -1;
      const th = bearing(a, b) + Math.PI / 2;
      for (let i = 0; i < perLeg; i++) {
        const t = i / perLeg;
        const off = side * amp * Math.sin(Math.PI * t);
        const lat = a.lat + (b.lat - a.lat) * t + (off * Math.cos(th)) / 111320;
        const lng = a.lng + (b.lng - a.lng) * t
          + (off * Math.sin(th)) / (111320 * Math.cos(rad(a.lat)));
        path.push([+lng.toFixed(6), +lat.toFixed(6)]);
      }
    }
    path.push([+start.lng.toFixed(6), +start.lat.toFixed(6)]);
    path[0] = [+start.lng.toFixed(6), +start.lat.toFixed(6)];
    return path;
  };

  const floor = drawnLength(build(0));
  if (floor > targetM) {
    throw new Error(
      `route through its own points is ${Math.round(floor)}m, which is longer `
      + `than the stated ${targetM}m. Raise distanceM or drop a via.`);
  }
  let lo = 0, hi = Math.max(targetM, 400);
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (drawnLength(build(mid)) < targetM) lo = mid; else hi = mid;
  }
  return build((lo + hi) / 2);
}

/** Distance along a path to the point on it nearest `p`. */
function atAlong(path, p) {
  let acc = 0, best = 0, bestD = Infinity;
  for (let i = 1; i < path.length; i++) {
    const a = { lng: path[i - 1][0], lat: path[i - 1][1] };
    const b = { lng: path[i][0], lat: path[i][1] };
    const seg = distanceM(a, b);
    const d = distanceM(a, p);
    if (d < bestD) { bestD = d; best = acc; }
    acc += seg;
  }
  return Math.round(best);
}

/** The point on a route at `atM` along it, so an objective is never off it. */
function alongRoute(path, atM) {
  let acc = 0;
  for (let i = 1; i < path.length; i++) {
    const a = { lng: path[i - 1][0], lat: path[i - 1][1] };
    const b = { lng: path[i][0], lat: path[i][1] };
    const seg = distanceM(a, b);
    if (acc + seg >= atM) {
      const f = seg === 0 ? 0 : (atM - acc) / seg;
      return { lat: +(a.lat + (b.lat - a.lat) * f).toFixed(6),
        lng: +(a.lng + (b.lng - a.lng) * f).toFixed(6) };
    }
    acc += seg;
  }
  return { lat: path[0][1], lng: path[0][0] };
}

/* ---- the anchors ------------------------------------------------------- */

const POINTS = [
  {
    id: "p-casino-marino", name: "Casino at Marino", nameGa: "Casaíno Mhaire Nó",
    category: "Country house", group: "built", townland: "Marino",
    lat: 53.3692, lng: -6.2286, visited: true,
    blurb: "A garden temple that is sixteen rooms pretending to be one.",
    tags: ["Upstanding remains", "Paid entry", "Guided", "18th century"],
    lore: [
      ["architecture", "One room from outside, sixteen within",
        "Built for the Earl of Charlemont between 1758 and 1775 as a garden pavilion. The exterior reads as a single Doric room. Inside there are sixteen, on three floors, with the roof drained through the columns and the chimneys hidden in the urns."],
      ["placename", "Marino",
        "From the Italian, named by Charlemont after the coastal landscape he had travelled through on his Grand Tour. One of the few placenames in Dublin that is neither Irish nor English in origin."],
    ],
  },
  {
    id: "p-bull-wall", name: "The Bull Wall", nameGa: "Múr an Bhulla",
    category: "Sea wall", group: "water", townland: "Clontarf",
    lat: 53.3628, lng: -6.1608, visited: false,
    blurb: "A wall built to scour the harbour that accidentally made an island.",
    tags: ["Coastal", "Free", "Level walking", "19th century"],
    lore: [
      ["fact", "The wall that built Bull Island",
        "Completed in 1825 to force the tide to scour a channel into Dublin port. It worked, and it also slowed the water on its northern side enough that sand began to drop out of it. Bull Island has been growing there ever since and did not exist before the wall."],
      ["fact", "A biosphere by accident",
        "The island the wall made is now a UNESCO biosphere reserve, and the only one in the world that lies inside a capital city."],
    ],
  },
  {
    id: "p-st-annes", name: "St Anne's Park", nameGa: "Páirc Naomh Áine",
    category: "Demesne", group: "green", townland: "Raheny",
    lat: 53.3735, lng: -6.1740, visited: false,
    blurb: "A Guinness demesne with follies scattered through the trees.",
    tags: ["Free", "Level walking", "Follies", "Rose garden"],
    lore: [
      ["fact", "Guinness ground",
        "Bought by Benjamin Lee Guinness in 1835 and extended by his son Arthur into a demesne of some five hundred acres. The house burned in 1943 and was demolished; the follies its owners built across the grounds were left where they stood."],
      ["placename", "Naomh Áine",
        "From a holy well dedicated to St Anne, which sat in the grounds and gave the demesne its name."],
    ],
  },
  {
    id: "p-botanic", name: "National Botanic Gardens", nameGa: "Na Garraithe Náisiúnta Lus",
    category: "Gardens", group: "green", townland: "Glasnevin",
    lat: 53.3725, lng: -6.2717, visited: false,
    blurb: "Curvilinear glasshouses by a Dublin ironmaster, still standing.",
    tags: ["Free", "Level walking", "Glasshouses", "19th century"],
    lore: [
      ["architecture", "Turner's curvilinear range",
        "The great curved glasshouses were built by Richard Turner of Ballsbridge between 1843 and 1869. Turner also built the Palm House at Kew, and the range here is the earlier and more inventive of the two."],
      ["placename", "Glas Naíon",
        "Commonly read as the stream of the infants, though the older reading is the green of Naeidhe, a personal name. The Tolka runs along the northern edge of the gardens."],
    ],
  },
  {
    id: "p-santry-demesne", name: "Santry Demesne", nameGa: "Diméin Seantrabh",
    category: "Demesne", group: "green", townland: "Santry",
    lat: 53.3950, lng: -6.2400, visited: false,
    blurb: "Avenues of a vanished house, kept as a park.",
    tags: ["Free", "Level walking", "Woodland", "Demesne"],
    lore: [
      ["fact", "The house that is not there",
        "Santry Court was built for the Barry family around 1703, burned in 1947 and was demolished in 1959. The avenues, the walled garden and the lines of the demesne survive as the shape of the park."],
      ["placename", "Seantrabh",
        "The old tribe or the old settlement, from sean, old. The name is recorded well before the Norman arrival."],
    ],
  },
  {
    id: "p-fairview", name: "Fairview Park", nameGa: "Páirc Fhionnradhairc",
    category: "Reclaimed ground", group: "water", townland: "Fairview",
    lat: 53.3640, lng: -6.2380, visited: false,
    blurb: "Parkland that was tidal mudflat inside living memory.",
    tags: ["Free", "Level walking", "Reclaimed", "20th century"],
    lore: [
      ["fact", "Made ground",
        "This was the foreshore of the Tolka estuary until the 1900s, when the slob lands were reclaimed with city refuse and laid out as a park. The old shoreline runs along the line of Fairview Strand, which is why the street is called a strand and is nowhere near the sea."],
    ],
  },
];

const QUESTS = [
  {
    id: "q-bull-island", plate: "quest-bull-island", startName: "Clontarf Road",
    start: { lat: 53.3625, lng: -6.2050 },
    title: "Bull Island and the Wall",
    flavour: "Out the promenade to the wooden bridge, over onto the island, back along the strand.",
    tier: "sidequest", shape: "line", surface: "made", ascentM: 8,
    distanceM: 6200, durationMin: 90, townland: "Clontarf",
    honesty: ["Exposed the whole way", "Wind off the bay is the whole story"],
    encounters: [
      ["point", "The Bull Wall", "The wall that made the island"],
      ["view", "Howth across the water"],
      ["terrain", "Soft sand on the strand", "Firmer near the water"],
      ["food", "A kiosk at the wooden bridge", "Hours unverified"],
    ],
    objectives: [
      ["The Bull Wall", "p-bull-wall", true, 2400],
      ["Dollymount Strand", null, false, 4100],
    ],
  },
  {
    id: "q-marino-fairview", plate: "quest-marino", startName: "Fairview",
    start: { lat: 53.3640, lng: -6.2380 },
    title: "Marino and the Slob Lands",
    flavour: "Through the park that was a mudflat, up to a garden temple that hides sixteen rooms.",
    tier: "stroll", shape: "loop", surface: "made", ascentM: 22,
    distanceM: 3100, durationMin: 48, townland: "Fairview",
    honesty: ["One busy road crossing", "Casino grounds close at dusk"],
    encounters: [
      ["point", "The Casino at Marino", "Sixteen rooms in one"],
      ["point", "Fairview Park", "Reclaimed from the tide"],
      ["terrain", "Pavement throughout"],
    ],
    objectives: [
      ["Fairview Park", "p-fairview", true, 900],
      ["Casino at Marino", "p-casino-marino", true, 2100],
    ],
  },
  {
    id: "q-st-annes", plate: "quest-st-annes", startName: "Raheny",
    start: { lat: 53.3735, lng: -6.1740 },
    title: "St Anne's Follies",
    flavour: "The Guinness demesne, its rose garden, and the follies left standing in the trees.",
    tier: "stroll", shape: "loop", surface: "unpaved", ascentM: 18,
    distanceM: 3300, durationMin: 50, townland: "Raheny",
    honesty: ["Soft underfoot after rain", "Follies are unfenced ruins"],
    encounters: [
      ["point", "St Anne's Park", "A demesne without its house"],
      ["view", "The rose garden"],
      ["terrain", "Woodland paths"],
    ],
    objectives: [
      ["St Anne's Park", "p-st-annes", true, 1200],
      ["The Herculanean temple", null, false, 2600],
    ],
  },
  {
    id: "q-glasnevin", plate: "quest-glasnevin", startName: "Glasnevin",
    start: { lat: 53.3725, lng: -6.2717 },
    title: "Glasnevin Glasshouses",
    flavour: "Turner's curved glass, then the Tolka path along the northern wall.",
    tier: "stroll", shape: "loop", surface: "made", ascentM: 14,
    distanceM: 2700, durationMin: 42, townland: "Glasnevin",
    honesty: ["Gardens close before dusk", "Glasshouses are seasonal"],
    encounters: [
      ["point", "The curvilinear range", "Built by Richard Turner"],
      ["terrain", "River path, can flood"],
      ["food", "A tea room inside the gates"],
    ],
    objectives: [
      ["National Botanic Gardens", "p-botanic", true, 700],
      ["The Tolka path", null, false, 1900],
    ],
  },
  {
    id: "q-santry", plate: "quest-santry", startName: "Santry",
    start: { lat: 53.3950, lng: -6.2400 },
    title: "Santry Demesne",
    flavour: "The avenues of a house that burned, and the walled garden that outlived it.",
    tier: "stroll", shape: "loop", surface: "unpaved", ascentM: 12,
    distanceM: 2900, durationMin: 44, townland: "Santry",
    honesty: ["Muddy after rain", "Some avenues are unlit"],
    encounters: [
      ["point", "Santry Demesne", "A demesne without its house"],
      ["terrain", "Woodland and avenue"],
      ["view", "The walled garden"],
    ],
    objectives: [
      ["Santry Demesne", "p-santry-demesne", true, 800],
      ["The walled garden", null, false, 1800],
    ],
  },
];

/* ---- emit -------------------------------------------------------------- */

const q = (s) => JSON.stringify(s);
const lines = [];
lines.push(`/* Generated by scripts/build-dublin.mjs. Do not edit by hand: the routes are
   converged so each drawn length equals its stated distanceM, and editing a
   coordinate silently breaks that. Change the anchors in the script and run it
   again. */`);
lines.push(`import type { Point, Quest } from "../types.ts";`);
lines.push("");
lines.push("export const DUBLIN_POINTS: Point[] = [");
for (const p of POINTS) {
  lines.push(`  {`);
  lines.push(`    plate: ${q("poi-" + p.id.replace(/^p-/, ""))}, id: ${q(p.id)}, name: ${q(p.name)}, nameGa: ${q(p.nameGa)},`);
  lines.push(`    blurb: ${q(p.blurb)}, visited: ${p.visited}, tags: ${q(p.tags)},`);
  lines.push(`    category: ${q(p.category)}, group: ${q(p.group)}, townland: ${q(p.townland)},`);
  lines.push(`    lat: ${p.lat}, lng: ${p.lng},`);
  lines.push(`    lore: [`);
  for (const [kind, title, body] of p.lore) {
    lines.push(`      { kind: ${q(kind)}, title: ${q(title)},`);
    lines.push(`        body: ${q(body)},`);
    lines.push(`        sourceName: "Fixture", sourceUrl: "", licence: "", linkOnly: false },`);
  }
  lines.push(`    ],`);
  lines.push(`  },`);
}
lines.push("];");
lines.push("");
lines.push("export const DUBLIN_QUESTS: Quest[] = [");
const byId = new Map(POINTS.map((p) => [p.id, p]));
for (const t of QUESTS) {
  /* Only points the route has to reach out to. One that sits on the start is
     already on the route, and making it a via would fold the loop in half. */
  const vias = [];
  for (const [, pointId] of t.objectives.map((o) => [o[0], o[1]])) {
    if (!pointId) continue;
    const p = byId.get(pointId);
    if (!p) throw new Error(`${t.id} links ${pointId}, which is not a point`);
    const far = distanceM(t.start, p) > 250
      && vias.every((v) => distanceM(v, p) > 250);
    if (far) vias.push({ lat: p.lat, lng: p.lng, id: pointId });
  }
  const path = vias.length
    ? viaRoute(t.start, vias, t.distanceM)
    : circleRoute(t.start, t.distanceM, t.id);
  const got = Math.round(drawnLength(path));
  if (Math.abs(got - t.distanceM) > 25) {
    throw new Error(`${t.id} draws ${got}m against a stated ${t.distanceM}m`);
  }
  console.log(`${t.id.padEnd(18)} target ${t.distanceM}m  drawn ${got}m  ${path.length} points  ${vias.length} via`);
  lines.push(`  {`);
  lines.push(`    plate: ${q(t.plate)}, start: { lat: ${t.start.lat}, lng: ${t.start.lng} }, startName: ${q(t.startName)}, id: ${q(t.id)},`);
  lines.push(`    encounters: [`);
  for (const [kind, label, detail] of t.encounters) {
    lines.push(`      { kind: ${q(kind)}, label: ${q(label)}${detail ? `, detail: ${q(detail)}` : ""} },`);
  }
  lines.push(`    ], tier: ${q(t.tier)}, shape: ${q(t.shape)}, surface: ${q(t.surface)}, ascentM: ${t.ascentM},`);
  lines.push(`    title: ${q(t.title)},`);
  lines.push(`    flavour: ${q(t.flavour)},`);
  lines.push(`    distanceM: ${t.distanceM}, durationMin: ${t.durationMin}, startsAwayM: 0, townland: ${q(t.townland)},`);
  lines.push(`    honesty: ${q(t.honesty)},`);
  lines.push(`    objectives: [`);
  t.objectives.forEach(([label, pointId, required, atM], i) => {
    /* A linked objective sits on its point, exactly, and its distance along
       is read off the route rather than asserted. An unlinked one is a moment
       on the walk, so it is placed at the distance it claims. */
    const p = pointId ? byId.get(pointId) : null;
    const at = p ? { lat: p.lat, lng: p.lng } : alongRoute(path, atM);
    const along = p ? atAlong(path, p) : atM;
    lines.push(`      { id: ${q("o-" + (i + 1))}, pointId: ${pointId ? q(pointId) : "null"}, label: ${q(label)}, required: ${required}, reached: false, atM: ${along}, lat: ${at.lat}, lng: ${at.lng} },`);
  });
  lines.push(`    ],`);
  lines.push(`    path: [`);
  for (let i = 0; i < path.length; i += 3) {
    lines.push("      " + path.slice(i, i + 3).map((p) => `[${p[0]}, ${p[1]}]`).join(", ") + ",");
  }
  lines.push(`    ],`);
  lines.push(`  },`);
}
lines.push("];");
lines.push("");

writeFileSync(new URL("../lib/data/mock/dublin.ts", import.meta.url), lines.join("\n"));
console.log("wrote lib/data/mock/dublin.ts");
