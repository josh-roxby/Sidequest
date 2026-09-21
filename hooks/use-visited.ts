"use client";
import { useCallback, useEffect, useState } from "react";
import { addVisited, visitedCells } from "@/lib/fog/store";

/** The ground this walker has covered, shared by every screen that draws it.
 *
 *  Read in an effect rather than in a `useState` initialiser, which is the
 *  part that is easy to get wrong and was got wrong: the map screen is
 *  statically prerendered, so the initialiser runs on the server where there
 *  is no local storage, the server's empty array is what lands in the markup,
 *  and the client keeps it. The cells were in storage the whole time and the
 *  map drew none of them. Anything read from the browser has to be read after
 *  mount.
 *
 *  The cost is one extra render on load, during which the map draws no lit
 *  ground. That is invisible next to the tiles arriving. */
export function useVisited(): [string[], (cell: string) => void] {
  const [visited, setVisited] = useState<string[]>([]);

  useEffect(() => {
    const stored = visitedCells();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only read, and it cannot happen before mount
    if (stored.length > 0) setVisited(stored);
  }, []);

  const unlock = useCallback((cell: string) => {
    setVisited(addVisited([cell]));
  }, []);

  return [visited, unlock];
}
