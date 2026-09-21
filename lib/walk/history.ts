import type { Quest, WalkDetail, WalkRecord } from "../data/types.ts";

/** Walks this walker has actually taken.
 *
 *  The last piece of the loop. Everything else was built: a walk is generated
 *  from where you are, drawn on real streets, followed as you walk it, and the
 *  ground you cover is kept. Then you pressed End walk and none of it was
 *  written down. The history screen showed three fixtures from Clare that
 *  nobody had walked.
 *
 *  The quest is stored beside the record rather than referenced by id, because
 *  most walks are generated: they exist nowhere but in the session that built
 *  them, and a history row pointing at an id no lookup can resolve is a row
 *  that opens onto nothing a week later. Keeping the whole thing costs a few
 *  kilobytes and means a walk from last month still draws its own route.
 *
 *  Local storage until the migrations are approved. `TODO.md`. */

const KEY = "sq.walks";

/** Newest first, and capped. Two hundred walks is a couple of years of walking
 *  and comfortably inside a storage quota even with the routes attached. */
const CAP = 200;

interface Entry {
  walk: WalkRecord;
  quest: Quest | null;
}

/** Local walks carry their own prefix so a reader can tell, without a lookup,
 *  whether an id belongs here or to the corpus. */
export const isLocalWalk = (id: string) => id.startsWith("w-local-");

function read(): Entry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e): e is Entry =>
      typeof e === "object" && e !== null && "walk" in e
      && typeof (e as Entry).walk?.id === "string");
  } catch {
    /* Private mode, a full quota, or something else under this key. A walker
       losing their history is bad; the app refusing to open is worse. */
    return [];
  }
}

export function localWalks(): WalkRecord[] {
  return read().map((e) => e.walk);
}

export function localWalkDetail(id: string): WalkDetail | null {
  const found = read().find((e) => e.walk.id === id);
  if (!found) return null;
  /* Badges, tales and notes are not wired to a walk yet, and an empty list is
     the honest answer rather than someone else's. */
  return { walk: found.walk, quest: found.quest, badges: [], tales: [], notes: [] };
}

export function recordWalk(walk: WalkRecord, quest: Quest | null): void {
  if (typeof localStorage === "undefined") return;
  try {
    /* Keyed on id so ending the same walk twice, which a double press or a
       back navigation will do, leaves one row rather than two. */
    const kept = read().filter((e) => e.walk.id !== walk.id);
    localStorage.setItem(KEY, JSON.stringify([{ walk, quest }, ...kept].slice(0, CAP)));
  } catch {
    /* Out of room. Dropping the attached routes buys back most of it, and a
       history row with no route still says where you went and how far. */
    try {
      const lean = read().map((e) => ({ walk: e.walk, quest: null }));
      localStorage.setItem(KEY, JSON.stringify([{ walk, quest: null }, ...lean].slice(0, CAP)));
    } catch {
      // Nothing more to try. The walk happened; we just cannot write it down.
    }
  }
}

export function clearWalks(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to do and nothing worth reporting.
  }
}

/** A walk the walker just finished, as a record.
 *
 *  Pure, so the rule for what counts as finishing is testable and stated in
 *  one place rather than inline on a screen. */
export function walkRecordFrom(a: {
  quest: Quest;
  walkedM: number;
  startedAt: number;
  endedAt: number;
  tilesGained: number;
}): WalkRecord {
  /* Completed on the ground covered rather than on the waypoints ticked. A
     walker who does the whole loop but passes a point on the far side of the
     road has still done the walk, and telling them otherwise is the app
     arguing with somebody who was there. */
  const done = a.walkedM >= a.quest.distanceM * 0.8;
  return {
    id: `w-local-${a.startedAt.toString(36)}`,
    questTitle: a.quest.title,
    tier: a.quest.tier,
    dateISO: new Date(a.endedAt).toISOString().slice(0, 10),
    distanceM: Math.round(a.walkedM),
    durationMin: Math.max(1, Math.round((a.endedAt - a.startedAt) / 60_000)),
    tilesGained: a.tilesGained,
    townland: a.quest.townland,
    status: done ? "completed" : "abandoned",
  };
}
