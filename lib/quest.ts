import { ACTIONS, DESCRIPTORS, ITEMS, pool } from "@/data/word-banks";
import type { QuestMode } from "@/data/types";

export interface QuestParts {
  action: string;
  item: string;
  descriptor: string;
  text: string;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function articleFor(word: string): string {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

export function capitalise(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

export function generateQuestParts(mode: QuestMode): QuestParts {
  const action     = pick(pool(ACTIONS, mode));
  const item       = pick(pool(ITEMS, mode));
  const descriptor = pick(pool(DESCRIPTORS, mode));
  const article    = articleFor(descriptor);
  const text       = `${capitalise(action)} ${article} ${descriptor} ${item}.`;
  return { action, item, descriptor, text };
}
