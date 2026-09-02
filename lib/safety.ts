"use client";
import { useSyncExternalStore } from "react";

/** Bump when the brief changes in a way a walker should read again. A typo
 *  does not count. A new hazard does. */
export const SAFETY_VERSION = 1;

const KEY = "sq.safety";

interface Ack {
  version: number;
  atISO: string;
  /** False when the walker asked to see it before every walk. */
  suppress: boolean;
}

let cache: Ack | null | undefined;
const listeners = new Set<() => void>();

function read(): Ack | null {
  if (cache !== undefined) return cache;
  try {
    const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Ack) : null;
  } catch {
    cache = null;
  }
  return cache;
}

/** Records that this person read the brief and answered its question. Local
 *  for now; `recordSafetyAck` on the data source is the same fact written
 *  where it belongs once accounts are switched on, because "they acknowledged
 *  it" is a claim we may one day have to stand over. */
export function acknowledge(suppress: boolean) {
  cache = { version: SAFETY_VERSION, atISO: new Date().toISOString(), suppress };
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* private mode */ }
  listeners.forEach((l) => l());
}

export function clearAcknowledgement() {
  cache = null;
  try { localStorage.removeItem(KEY); } catch { /* private mode */ }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

/** True when the brief still needs showing: never read, read at an older
 *  version, or the walker asked to see it every time. */
export function useNeedsBrief(): boolean {
  const ack = useSyncExternalStore(subscribe, read, () => null);
  if (!ack) return true;
  if (ack.version !== SAFETY_VERSION) return true;
  return !ack.suppress;
}
