import type { Quest } from "../data/types.ts";

/** Walks built for this walker, in this session.
 *
 *  An assembled walk is not in the corpus, so `/quests/<id>` and its walk
 *  screen would have nothing to open. It is also not a fixture and does not
 *  belong in one: it was built for a position, and it is meaningless to anyone
 *  standing somewhere else.
 *
 *  So it lives in session storage, which is the honest lifetime for it. It
 *  survives the navigation from the picker to the walk screen and a reload
 *  mid-walk, and it is gone when the tab is. Persisting properly, so a walk
 *  survives closing the app, is a database question and waits on the
 *  migrations. `TODO.md`. */

const KEY = "sq.generated";

type Store = Record<string, Quest>;

function read(): Store {
  if (typeof sessionStorage === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    /* Private mode, a full quota, or something else having written nonsense
       under this key. None of them are worth taking the app down for. */
    return {};
  }
}

export function putGenerated(quest: Quest): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...read(), [quest.id]: quest }));
  } catch {
    // Storage full or blocked. The walk still works for as long as it is open.
  }
}

export function getGenerated(id: string): Quest | null {
  return read()[id] ?? null;
}

/** Whether an id belongs to an assembled walk. Cheap enough to check before
 *  touching storage at all, which matters on a read that happens per page. */
export const isGenerated = (id: string) => id.startsWith("q-gen-");
