"use client";
import { useSyncExternalStore } from "react";

export interface Settings {
  units: "metric" | "imperial";
  leftHanded: boolean;
  haptics: boolean;
  keepAwake: boolean;
  showCommunity: boolean;
  reduceMotion: boolean;
  defaultTier: "trot" | "stroll" | "sidequest" | "adventure";
  activityInDrawer: boolean;
}

export const DEFAULTS: Settings = {
  units: "metric",
  leftHanded: false,
  haptics: true,
  keepAwake: true,
  showCommunity: true,
  reduceMotion: false,
  defaultTier: "stroll",
  activityInDrawer: true,
};

const KEY = "sq.settings";
const listeners = new Set<() => void>();

/** Cached so getSnapshot returns a stable reference. useSyncExternalStore
 *  compares with Object.is, and parsing fresh JSON on every read would hand it
 *  a new object each time and spin. */
let cache: Settings = DEFAULTS;
let loaded = false;

function read(): Settings {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    // Private mode, blocked site data, or corrupt JSON. Defaults are always
    // usable, so a broken store is never a broken app.
    return DEFAULTS;
  }
}

function getSnapshot(): Settings {
  if (!loaded) { cache = read(); loaded = true; }
  return cache;
}

/** Server and pre-hydration snapshot. Must be the same object every call. */
function getServerSnapshot(): Settings {
  return DEFAULTS;
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  cache = { ...getSnapshot(), [key]: value };
  try { window.localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* blocked */ }
  listeners.forEach((fn) => fn());
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Which side the thumb controls live on. Everything that sits in the thumb
 *  corner reads this rather than hard-coding right, so the setting is one
 *  switch rather than a sweep through every screen. */
export function useHanded(): "left" | "right" {
  return useSettings().leftHanded ? "left" : "right";
}
