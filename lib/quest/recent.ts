/** Where the walker has just been sent.
 *
 *  Picking at random is not the same as not repeating yourself. With eight
 *  places inside a stroll's reach, a fair draw still offers the same one twice
 *  in three presses often enough to feel broken, and from Griffith Wood that
 *  read as "it always sends me to the same place". Randomness cannot fix that
 *  on its own: what fixes it is remembering.
 *
 *  So the places a walk was built around are noted, and the next few walks lean
 *  away from them. Leaning rather than excluding, because somewhere with four
 *  places in reach would otherwise run out of walks entirely, and a repeat is a
 *  much smaller failure than a refusal.
 *
 *  Local storage rather than session, because the complaint is about opening
 *  the app tomorrow and being sent where you went today. It is per device and
 *  per browser, which is the right lifetime until walks are stored properly
 *  against an account. `TODO.md`. */

const KEY = "sq.recent-points";

/** How many walks back to remember. Enough to clear a thin area's whole set of
 *  places, so a repeat means the area really has run out rather than the draw
 *  being unlucky. */
const REMEMBER = 12;

function read(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    /* Private mode, a full quota, or something else having written nonsense
       under this key. None of them are worth taking the app down for. */
    return [];
  }
}

/** Most recently offered first, which is the order the weighting wants. */
export function recentlyOffered(): string[] {
  return read();
}

export function noteOffered(pointIds: string[]): void {
  if (typeof localStorage === "undefined" || pointIds.length === 0) return;
  try {
    /* The new ones go to the front and any earlier mention of them is dropped,
       so a place offered twice is remembered from the more recent time. */
    const fresh = [...pointIds];
    const kept = read().filter((id) => !fresh.includes(id));
    localStorage.setItem(KEY, JSON.stringify([...fresh, ...kept].slice(0, REMEMBER)));
  } catch {
    // Storage full or blocked. The walk is unaffected, it may just repeat.
  }
}

/** For the settings screen, and for anyone who wants a clean slate. */
export function forgetOffered(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to do and nothing worth reporting.
  }
}
