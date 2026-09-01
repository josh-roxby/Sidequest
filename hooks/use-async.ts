"use client";
import { useEffect, useState } from "react";

export interface Async<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

const PENDING = { data: null, loading: true, error: null } as const;

/** Minimal fetch-on-mount. Deliberately not TanStack Query: this phase reads
 *  from a mock source with no caching, refetching or invalidation to do.
 *  Swap it out when live data lands and those problems become real. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): Async<T> {
  const key = JSON.stringify(deps);
  const [state, setState] = useState<Async<T>>(PENDING);
  const [seen, setSeen] = useState(key);

  // Resetting to pending during render rather than in the effect. This is the
  // documented "adjusting state when props change" pattern: it re-renders
  // before the browser paints, so no stale row is ever shown under a new key,
  // and it keeps react-hooks/set-state-in-effect satisfied for a real reason
  // rather than by suppression.
  if (key !== seen) {
    setSeen(key);
    setState(PENDING);
  }

  useEffect(() => {
    let live = true;
    fn()
      .then((d) => { if (live) setState({ data: d, loading: false, error: null }); })
      .catch((e: Error) => {
        if (live) setState({ data: null, loading: false, error: e.message });
      });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}
