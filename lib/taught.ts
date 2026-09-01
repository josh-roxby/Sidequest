/** Whether the user has completed a press-and-hold on the thumb block. Drives
 *  the first-run hint only.
 *
 *  A tiny external store rather than an effect: this is genuinely browser
 *  state that exists before React does, and useSyncExternalStore is what that
 *  is for. It also gives a correct server snapshot, so the hint never flashes
 *  in during hydration for a returning user.
 *
 *  Every access is guarded. Private mode and blocked site data both throw on
 *  localStorage, and in that case we report "taught" so a browser setting can
 *  never strand someone under a permanent hint. */
const KEY = "sq.held";
const listeners = new Set<() => void>();

export function subscribeTaught(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function getTaught(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
}

/** Server and pre-hydration snapshot. */
export function getTaughtServer(): boolean {
  return true;
}

export function markTaught(): void {
  try { window.localStorage.setItem(KEY, "1"); } catch { /* blocked, no matter */ }
  listeners.forEach((fn) => fn());
}
