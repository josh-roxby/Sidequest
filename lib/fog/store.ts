/** The ground this walker has covered.
 *
 *  H3 cells at `RES_FINEST`, which is about 76m across, recorded as the walker
 *  enters them. This is the product's one promise that outlives a walk: pick
 *  how long you have, walk it, keep the ground you covered. Until now nothing
 *  kept it, so somebody could walk five kilometres, close the app, and find
 *  that it never happened.
 *
 *  Local storage rather than a table, because the migrations are unapplied and
 *  because this is honestly device-shaped for now: it needs no account, costs
 *  nothing, and works with no signal, which matters on a walk. It moves to
 *  Postgres with the rest of the walker's record. `TODO.md`.
 *
 *  A set rather than a list, because entering the same cell twice is the
 *  normal case on a loop and the second time is not news. */

const KEY = "sq.visited";

/** A cap, so a heavy walker's storage does not grow without limit. Ten
 *  thousand cells at 76m is a lot of ground, several hundred square
 *  kilometres, and well past the point where this belongs in a database. The
 *  oldest go first, which is the wrong answer in the long run and the right
 *  one for a browser. */
const CAP = 10_000;

function read(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    /* Private mode, a full quota, or something else under this key. None of
       them are worth taking a walk down for. */
    return [];
  }
}

export function visitedCells(): string[] {
  return read();
}

/** Adds cells and answers with the full set, so a caller can hold one piece of
 *  state rather than reading back after every write. */
export function addVisited(cells: string[]): string[] {
  const have = read();
  const known = new Set(have);
  const fresh = cells.filter((c) => c && !known.has(c));
  if (fresh.length === 0) return have;

  const next = [...have, ...fresh].slice(-CAP);
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* Out of room. The walk carries on with the cells in memory and loses
         them on close, which is worse than keeping them and better than
         stopping. */
    }
  }
  return next;
}

export function clearVisited(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to do and nothing worth reporting.
  }
}
