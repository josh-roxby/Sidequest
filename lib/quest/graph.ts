import { distanceM } from "../geo.ts";
import type { LatLng } from "../data/types.ts";
import type { Path } from "./route.ts";

/** A walkable graph, built from whatever lines it is handed.
 *
 *  Side Quest cannot reach a routing service and cannot ship a street dataset:
 *  every OSM endpoint is blocked from the machine this is built on, and the
 *  licence question aside, a national street graph is not a thing to embed in a
 *  web bundle. But the map is already holding the answer. The basemap tiles
 *  carry the `transportation` layer, which is the roads and the paths, and
 *  MapLibre has them parsed in memory for everything on screen. So the router
 *  reads the map rather than the network.
 *
 *  What that buys: routes that follow pavements and park paths instead of
 *  cutting through terraces. What it costs: the graph only covers ground the
 *  map has loaded, and vector tiles are simplified and cut at tile edges, so
 *  the joins are approximate. Both are why every entry point here can say "no"
 *  and let the caller fall back to plain geometry. A worse line is better than
 *  no walk.
 *
 *  Nothing in this file touches MapLibre. It takes polylines and answers
 *  questions about them, which is what makes it testable without a map. */

/** Nodes within this many metres of each other are the same node.
 *
 *  Tiles are cut at their boundaries and the same street arrives as two lines
 *  whose ends nearly, but not exactly, coincide. Without stitching, every tile
 *  edge is a wall the router cannot cross. Two metres is wider than the error
 *  and narrower than the gap between two real streets. */
const WELD_M = 2;

/** Rounded to about a metre, which is the grid the welding works on. */
const key = (lng: number, lat: number) => `${lng.toFixed(5)},${lat.toFixed(5)}`;

export interface Graph {
  /** Node id to its position. */
  nodes: Map<string, LatLng>;
  /** Node id to its neighbours and the metres between them. */
  edges: Map<string, { to: string; m: number }[]>;
}

export const graphSize = (g: Graph) => g.nodes.size;

/** Where two streets cross, in a vector tile, is nowhere at all.
 *
 *  This is the thing that makes routing on tiles hard, and it is not obvious
 *  until you look at the data: a tile stores each way as its own line, and
 *  simplification drops every vertex that sits on a straight run. A mile of
 *  straight road arrives as two points, its far end and its near end, and the
 *  six streets joining it in between leave no trace. The tile is a picture of a
 *  network, not the network.
 *
 *  So the crossings have to be put back. Every pair of segments is tested, and
 *  where two cross, both are split at the crossing point so they share a
 *  vertex, which is what makes them a junction once `buildGraph` welds
 *  coincident points together.
 *
 *  `levels` keeps a bridge from joining the road beneath it. Two lines only
 *  cross if they are on the same level, which is what `brunnel` and `layer`
 *  are for in the schema. Without it the router walks off a flyover.
 *
 *  Bucketed by a coarse cell, because the honest version of "every pair" on a
 *  few thousand segments is a freeze. */
function planarise(lines: Path[], levels: number[]): Path[] {
  const CELL = 0.0008;                       // about 90m, wider than any segment
  type Seg = { line: number; i: number; ax: number; ay: number; bx: number; by: number };
  const buckets = new Map<string, Seg[]>();
  const cuts: Map<number, Map<number, number[]>> = new Map();

  const segs: Seg[] = [];
  lines.forEach((line, li) => {
    for (let i = 1; i < line.length; i++) {
      segs.push({ line: li, i: i - 1, ax: line[i - 1][0], ay: line[i - 1][1], bx: line[i][0], by: line[i][1] });
    }
  });

  for (const s of segs) {
    const x0 = Math.floor(Math.min(s.ax, s.bx) / CELL), x1 = Math.floor(Math.max(s.ax, s.bx) / CELL);
    const y0 = Math.floor(Math.min(s.ay, s.by) / CELL), y1 = Math.floor(Math.max(s.ay, s.by) / CELL);
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        const k = `${x},${y}`;
        (buckets.get(k) ?? buckets.set(k, []).get(k)!).push(s);
      }
    }
  }

  const note = (line: number, i: number, t: number) => {
    if (t <= 1e-9 || t >= 1 - 1e-9) return;   // already an endpoint
    const byLine = cuts.get(line) ?? cuts.set(line, new Map()).get(line)!;
    const list = byLine.get(i) ?? byLine.set(i, []).get(i)!;
    list.push(t);
  };

  for (const group of buckets.values()) {
    for (let a = 0; a < group.length; a++) {
      for (let b = a + 1; b < group.length; b++) {
        const p = group[a], q = group[b];
        if (p.line === q.line) continue;
        if (levels[p.line] !== levels[q.line]) continue;
        const rx = p.bx - p.ax, ry = p.by - p.ay;
        const sx = q.bx - q.ax, sy = q.by - q.ay;
        const denom = rx * sy - ry * sx;
        if (Math.abs(denom) < 1e-15) continue;            // parallel
        const t = ((q.ax - p.ax) * sy - (q.ay - p.ay) * sx) / denom;
        const u = ((q.ax - p.ax) * ry - (q.ay - p.ay) * rx) / denom;
        if (t < 0 || t > 1 || u < 0 || u > 1) continue;   // they do not actually meet
        note(p.line, p.i, t);
        note(q.line, q.i, u);
      }
    }
  }

  if (cuts.size === 0) return lines;

  return lines.map((line, li) => {
    const byLine = cuts.get(li);
    if (!byLine) return line;
    const out: Path = [line[0]];
    for (let i = 1; i < line.length; i++) {
      const ts = byLine.get(i - 1);
      if (ts) {
        for (const t of [...new Set(ts)].sort((x, y) => x - y)) {
          out.push([
            +(line[i - 1][0] + (line[i][0] - line[i - 1][0]) * t).toFixed(6),
            +(line[i - 1][1] + (line[i][1] - line[i - 1][1]) * t).toFixed(6),
          ]);
        }
      }
      out.push(line[i]);
    }
    return out;
  });
}

/** Build a walkable graph from polylines in lng/lat order.
 *
 *  `levels` is one number per line: lines only cross where their levels match,
 *  which keeps a bridge from joining the road under it. Omitted means
 *  everything is at ground level, which is the right default for a set of lines
 *  that carries no such information. */
export function buildGraph(lines: Path[], levels?: number[]): Graph {
  lines = planarise(lines, levels ?? lines.map(() => 0));

  const nodes = new Map<string, LatLng>();
  const edges = new Map<string, { to: string; m: number }[]>();

  const node = (lng: number, lat: number): string => {
    const k = key(lng, lat);
    if (!nodes.has(k)) nodes.set(k, { lat, lng });
    return k;
  };
  const link = (a: string, b: string, m: number) => {
    if (a === b) return;
    for (const [from, to] of [[a, b], [b, a]] as const) {
      const list = edges.get(from) ?? [];
      /* Streets double back and tiles repeat their edges, so the same pair
         arrives more than once. Keep the shorter, which is the one that is
         actually the way through. */
      const seen = list.find((e) => e.to === to);
      if (seen) { seen.m = Math.min(seen.m, m); continue; }
      list.push({ to, m });
      edges.set(from, list);
    }
  };

  for (const line of lines) {
    for (let i = 1; i < line.length; i++) {
      const [alng, alat] = line[i - 1];
      const [blng, blat] = line[i];
      const a = node(alng, alat);
      const b = node(blng, blat);
      link(a, b, distanceM({ lat: alat, lng: alng }, { lat: blat, lng: blng }));
    }
  }

  weld(nodes, edges);
  return { nodes, edges };
}

/** Join node pairs that are within `WELD_M` of each other but were not the same
 *  rounded coordinate, which is what stitches one street back together across a
 *  tile boundary. */
function weld(nodes: Map<string, LatLng>, edges: Map<string, { to: string; m: number }[]>): void {
  /* Bucketed by a coarse cell so this is not every node against every other:
     at a few thousand nodes the quadratic version is seconds, which is a
     freeze in the middle of pressing a button. */
  const CELL = 0.0002;  // about 22m, comfortably wider than the weld radius
  const buckets = new Map<string, string[]>();
  for (const [id, p] of nodes) {
    const b = `${Math.round(p.lng / CELL)},${Math.round(p.lat / CELL)}`;
    (buckets.get(b) ?? buckets.set(b, []).get(b)!).push(id);
  }

  for (const [id, p] of nodes) {
    const bx = Math.round(p.lng / CELL), by = Math.round(p.lat / CELL);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (const other of buckets.get(`${bx + dx},${by + dy}`) ?? []) {
          if (other <= id) continue;
          const q = nodes.get(other)!;
          const m = distanceM(p, q);
          if (m > WELD_M) continue;
          for (const [a, b] of [[id, other], [other, id]] as const) {
            const list = edges.get(a) ?? [];
            if (!list.some((e) => e.to === b)) { list.push({ to: b, m }); edges.set(a, list); }
          }
        }
      }
    }
  }
}

/** The nearest node to a place, or null if nothing is near enough to be the
 *  same place. A walk that starts 300m from where you are standing, because
 *  that was the closest the graph came, is worse than one drawn freehand. */
export function nearestNode(g: Graph, p: LatLng, withinM = 150): string | null {
  let best: string | null = null;
  let bestM = withinM;
  for (const [id, q] of g.nodes) {
    const m = distanceM(p, q);
    if (m < bestM) { bestM = m; best = id; }
  }
  return best;
}

/** A* between two nodes.
 *
 *  `penalty` multiplies the cost of an edge without changing its length, which
 *  is how the return leg of a loop is pushed onto different streets: the way
 *  home is still allowed to reuse the way out, it just has to be worth it. */
export function shortestPath(
  g: Graph, from: string, to: string,
  penalty?: (a: string, b: string) => number,
): string[] | null {
  if (from === to) return [from];
  const goal = g.nodes.get(to);
  if (!goal || !g.nodes.has(from)) return null;

  const h = (id: string) => distanceM(g.nodes.get(id)!, goal);
  const cameFrom = new Map<string, string>();
  const cost = new Map<string, number>([[from, 0]]);
  /* A sorted array rather than a heap. The graph is a few thousand nodes of one
     neighbourhood, not a country, and a heap here would be more code to get
     wrong than it saves. */
  const open: { id: string; f: number }[] = [{ id: from, f: h(from) }];
  const done = new Set<string>();

  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const { id } = open.shift()!;
    if (id === to) {
      const out = [id];
      let cur = id;
      while (cameFrom.has(cur)) { cur = cameFrom.get(cur)!; out.unshift(cur); }
      return out;
    }
    if (done.has(id)) continue;
    done.add(id);

    for (const e of g.edges.get(id) ?? []) {
      if (done.has(e.to)) continue;
      const step = e.m * (penalty?.(id, e.to) ?? 1);
      const next = (cost.get(id) ?? Infinity) + step;
      if (next >= (cost.get(e.to) ?? Infinity)) continue;
      cost.set(e.to, next);
      cameFrom.set(e.to, id);
      open.push({ id: e.to, f: next + h(e.to) });
    }
  }
  return null;
}

export const pathOf = (g: Graph, ids: string[]): Path =>
  ids.map((id) => {
    const p = g.nodes.get(id)!;
    return [+p.lng.toFixed(6), +p.lat.toFixed(6)] as [number, number];
  });

export function lengthOf(g: Graph, ids: string[]): number {
  let m = 0;
  for (let i = 1; i < ids.length; i++) m += distanceM(g.nodes.get(ids[i - 1])!, g.nodes.get(ids[i])!);
  return m;
}

const edgeKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

/** Out to a place and back again, on real ways.
 *
 *  Two shapes, and the difference is the whole point of asking which one you
 *  want. A line goes out and returns along the same ways, which is what "there
 *  and back" means and is the right answer when one route is the good one. A
 *  loop comes home a different way: the return is routed again with the
 *  outward edges made expensive, so it takes other streets wherever other
 *  streets exist and falls back to retracing only where there is genuinely no
 *  other way. */
export function outAndBack(
  g: Graph, from: LatLng, to: LatLng, shape: "loop" | "line",
): { path: Path; metres: number } | null {
  return routeVia(g, from, [to], shape);
}

/** A walk that calls at each of these places in turn and then comes home.
 *
 *  `outAndBack` is this with a single stop. The general form exists because a
 *  written walk is a sequence of places and most of its length lives in the
 *  wandering between them: routing only to the furthest keeps the destination
 *  and throws the walk away. The shore walk is eleven kilometres and names a
 *  wall three away.
 *
 *  Stops are taken in the order given. No attempt is made to reorder them into
 *  a shorter tour, because the order a walk visits its places in is part of
 *  what somebody wrote down, not a problem to be optimised. */
export function routeVia(
  g: Graph, from: LatLng, stops: LatLng[], shape: "loop" | "line",
  targetM?: number,
): { path: Path; metres: number } | null {
  const first = nearestNode(g, from);
  if (!first) return null;

  /* Consecutive stops that land on the same node are one stop. A written walk
     often names the park it starts in, and a leg from a place to itself has no
     route. */
  const seq = [first];
  for (const s of stops) {
    const n = nearestNode(g, s);
    if (!n) return null;
    if (n !== seq[seq.length - 1]) seq.push(n);
  }
  if (seq.length < 2) return null;

  const out: string[] = [];
  for (let i = 1; i < seq.length; i++) {
    const leg = shortestPath(g, seq[i - 1], seq[i]);
    if (!leg || leg.length < 2) return null;
    out.push(...(out.length === 0 ? leg : leg.slice(1)));
  }

  const retrace = (legs: string[] = out) => {
    const ids = [...legs, ...[...legs].reverse().slice(1)];
    return { path: pathOf(g, ids), metres: lengthOf(g, ids) };
  };
  const last = seq[seq.length - 1];

  if (shape === "line") {
    /* A there and back is twice the way out, so its length is settled by where
       it goes rather than by how it comes home: there is no return leg to
       stretch. What a short one can do is carry on past its last stop before
       turning, which is what "out the promenade and back" describes anyway. */
    const outM = lengthOf(g, out);
    const owed = targetM === undefined ? 0 : targetM / 2 - outM;
    if (owed <= outM * 0.1) return retrace();

    const beyondLast = distanceField(g, last);
    const fromStart = distanceField(g, first);
    let beyond: string | null = null;
    let bestErr = Infinity;
    for (const [id, a] of beyondLast) {
      const b = fromStart.get(id);
      /* Further out than the stop it carries on past, rather than back towards
         home: a node the right distance from the turn is just as likely to be
         behind it, and turning early is not walking further. */
      if (b === undefined || b < outM) continue;
      const err = Math.abs(a - owed);
      if (err < bestErr) { bestErr = err; beyond = id; }
    }
    if (!beyond || bestErr > owed * 0.4) return retrace();
    const tail = shortestPath(g, last, beyond);
    if (!tail || tail.length < 2) return retrace();
    return retrace([...out, ...tail.slice(1)]);
  }

  const used = new Set<string>();
  for (let i = 1; i < out.length; i++) used.add(edgeKey(out[i - 1], out[i]));
  /* Four times the cost. High enough to send the return down a parallel street
     rather than back up the same one, low enough that a walk out a dead end
     still gets home rather than failing. */
  const avoid = (skip: Set<string>) => (x: string, y: string) =>
    (skip.has(edgeKey(x, y)) ? 4 : 1);

  const direct = shortestPath(g, last, first, avoid(used));
  if (!direct || direct.length < 2) return retrace();

  const finish = (legs: string[][]) => {
    const ids = legs.reduce((acc, leg) => acc.concat(acc.length ? leg.slice(1) : leg), []);
    return { path: pathOf(g, ids), metres: lengthOf(g, ids) };
  };

  /* The way home, stretched to the length the walk promises.
   *
   *  Shortest paths between the places a walk names are shorter than the walk,
   *  and for a written one they are much shorter: its length lives in a meander
   *  somebody chose, and routing every leg the short way deletes it. A stroll
   *  round Santry came back at 1.6km against the 2.9km on its card, which is not
   *  the same walk and not the tier it is filed under.
   *
   *  So the return leg is allowed to wander: a node is picked where the distance
   *  from the last stop plus the distance home makes up whatever length is still
   *  owed, and the walk goes home through it. Two distance fields and a scan,
   *  which is the standard way to ask for a circuit of a given length. */
  const owed = targetM === undefined ? 0 : targetM - lengthOf(g, out);
  if (targetM === undefined || owed <= lengthOf(g, direct) * 1.15) {
    return finish([out, direct]);
  }

  const fromLast = distanceField(g, last);
  const fromStart = distanceField(g, first);
  let via: string | null = null;
  let bestErr = Infinity;
  for (const [id, a] of fromLast) {
    const b = fromStart.get(id);
    if (b === undefined) continue;
    const err = Math.abs(a + b - owed);
    if (err < bestErr) { bestErr = err; via = id; }
  }
  if (!via || bestErr > owed * 0.4) return finish([out, direct]);

  const legA = shortestPath(g, last, via, avoid(used));
  if (!legA || legA.length < 2) return finish([out, direct]);
  /* The second half avoids the first half as well, so the detour is a loop out
     and round rather than a spur walked twice. */
  const alsoUsed = new Set(used);
  for (let i = 1; i < legA.length; i++) alsoUsed.add(edgeKey(legA[i - 1], legA[i]));
  const legB = shortestPath(g, via, first, avoid(alsoUsed));
  if (!legB || legB.length < 2) return finish([out, direct]);

  return finish([out, legA, legB]);
}

/** The share of a route's steps that cover ground it has already covered.
 *
 *  A there and back walks every edge exactly twice, so half its steps are
 *  repeats and it scores 0.5: that is the ceiling for a route that goes
 *  somewhere and returns, not 1. A true loop scores near 0. Anything in
 *  between is a loop that had to retrace part of itself, usually because there
 *  was only one way through. */
export function overlap(path: Path): number {
  if (path.length < 3) return 1;
  const seen = new Set<string>();
  let repeats = 0, total = 0;
  for (let i = 1; i < path.length; i++) {
    const k = edgeKey(key(path[i - 1][0], path[i - 1][1]), key(path[i][0], path[i][1]));
    total++;
    if (seen.has(k)) repeats++; else seen.add(k);
  }
  return total === 0 ? 1 : repeats / total;
}

/** Shortest walking distance from one node to every node it can reach.
 *
 *  Dijkstra rather than A*, because there is no single destination: the
 *  question is "what is half a walk away", and the answer is a field. */
export function distanceField(g: Graph, from: string): Map<string, number> {
  const dist = new Map<string, number>([[from, 0]]);
  const open: { id: string; d: number }[] = [{ id: from, d: 0 }];
  const done = new Set<string>();
  while (open.length) {
    open.sort((a, b) => a.d - b.d);
    const { id, d } = open.shift()!;
    if (done.has(id)) continue;
    done.add(id);
    for (const e of g.edges.get(id) ?? []) {
      const next = d + e.m;
      if (next >= (dist.get(e.to) ?? Infinity)) continue;
      dist.set(e.to, next);
      open.push({ id: e.to, d: next });
    }
  }
  return dist;
}

/** A walk of about the length asked for, on real ways, turning where there is
 *  something worth turning at.
 *
 *  Routing out to the nearest point and back gives whatever distance the
 *  streets happen to give, which is how a stroll comes out four hundred metres
 *  long. The length has to lead. So the turning point is chosen by how far away
 *  it is *on foot*, half the walk out, and among the candidates at roughly that
 *  distance the one nearest something worth seeing wins.
 *
 *  `near` are places worth turning at. Passing none is allowed and simply
 *  produces a walk of the right length through open ground. */
export function routeOfLength(
  g: Graph, from: LatLng, targetM: number, shape: "loop" | "line", near: LatLng[] = [],
): { path: Path; metres: number; turn: LatLng } | null {
  const start = nearestNode(g, from);
  if (!start) return null;

  const dist = distanceField(g, start);
  const half = targetM / 2;

  /* Score every reachable node on how close half the round trip is to half the
     walk, then pull it towards anything worth reaching. The bonus is capped so
     a point can break a tie between two nodes at the right distance but cannot
     drag the walk to the wrong length to reach one. */
  const scored: { id: string; score: number }[] = [];
  for (const [id, d] of dist) {
    if (d < 80) continue;                       // not a walk
    const lengthErr = Math.abs(d - half) / half;
    if (lengthErr > 0.35) continue;             // too far off to rescue
    const p = g.nodes.get(id)!;
    const toPoint = near.length
      ? Math.min(...near.map((q) => distanceM(p, q)))
      : Infinity;
    const bonus = Number.isFinite(toPoint) ? Math.min(0.25, toPoint / 1200) : 0.25;
    scored.push({ id, score: lengthErr + bonus });
  }
  if (scored.length === 0) return null;
  scored.sort((a, b) => a.score - b.score);

  /* A line's length is exactly twice the way out, so the best candidate is the
     answer. A loop comes home another way and is therefore longer than twice,
     by an amount only routing can tell us, so the top few are tried. */
  let best: { path: Path; metres: number; turn: LatLng } | null = null;
  for (const { id } of scored.slice(0, shape === "line" ? 1 : 8)) {
    const r = outAndBack(g, from, g.nodes.get(id)!, shape);
    if (!r) continue;
    if (!best || Math.abs(r.metres - targetM) < Math.abs(best.metres - targetM)) {
      best = { ...r, turn: g.nodes.get(id)! };
    }
  }
  return best;
}
