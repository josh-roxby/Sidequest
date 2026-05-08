"use client";
import { useCallback, useEffect, useRef, useState } from "react";

const ROOT_KEY = "sidequest.user";

interface RootShape {
  v: number;
  projects: Record<string, { v: number; data: unknown } | undefined>;
}

function readRoot(): RootShape {
  if (typeof window === "undefined") return { v: 1, projects: {} };
  try {
    const raw = window.localStorage.getItem(ROOT_KEY);
    const parsed = raw ? (JSON.parse(raw) as RootShape) : null;
    if (!parsed || typeof parsed !== "object") return { v: 1, projects: {} };
    return { v: parsed.v ?? 1, projects: parsed.projects ?? {} };
  } catch {
    return { v: 1, projects: {} };
  }
}

function writeSlot(slug: string, version: number, data: unknown): void {
  if (typeof window === "undefined") return;
  const root = readRoot();
  root.projects[slug] = { v: version, data };
  window.localStorage.setItem(ROOT_KEY, JSON.stringify(root));
}

/**
 * Local-first project state. The Supabase-backed sync layer reads/writes
 * the same shape via server actions; see TODO.md for the cloud-sync work.
 */
export function useProjectStorage<T>(
  slug: string,
  version: number,
  defaultData: T,
): [T, (updater: T | ((prev: T) => T)) => void, boolean] {
  const [data, setData] = useState<T>(defaultData);
  const [hydrated, setHydrated] = useState(false);
  const versionRef = useRef(version);

  useEffect(() => {
    const root = readRoot();
    const slot = root.projects[slug];
    if (slot && slot.v === versionRef.current) {
      setData(slot.data as T);
    }
    setHydrated(true);
  }, [slug]);

  const update = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setData((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (p: T) => T)(prev)
            : updater;
        writeSlot(slug, versionRef.current, next);
        return next;
      });
    },
    [slug],
  );

  return [data, update, hydrated];
}
