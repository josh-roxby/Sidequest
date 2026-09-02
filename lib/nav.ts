import type { MarkName } from "@/components/primitives/Marks";

export interface Dest {
  href: string;
  label: string;
  mark: MarkName;
  blurb: string;
}

/** Every destination, in drawer order. The drawer is the complete map of the
 *  app; the hold shortcut is only the three most-used. */
export const DESTS: Dest[] = [
  { href: "/map",      label: "Map",      mark: "map",     blurb: "Where you are" },
  { href: "/quests",   label: "Quests",   mark: "quest",   blurb: "What to walk" },
  { href: "/badges",   label: "Badges",   mark: "badge",   blurb: "What you have earned" },
  { href: "/history",  label: "History",  mark: "journal", blurb: "Where you went" },
  { href: "/tales",    label: "Tales",    mark: "tale",    blurb: "What you learned" },
  { href: "/outposts", label: "Outposts", mark: "flag",    blurb: "Where you start" },
  { href: "/about",    label: "About",    mark: "info",    blurb: "How this works" },
  { href: "/settings", label: "Settings", mark: "pack",    blurb: "Units and privacy" },
];

/** The hold shortcut. Positions are fixed so the gesture becomes muscle
 *  memory: up-left is Map, up-right is Quests, down-left is Badges. The
 *  anchor itself stays put at down-right and releasing there cancels. */
export type QuadDir = "tl" | "tr" | "bl";

export const QUADS: { dir: QuadDir; href: string; label: string; mark: MarkName }[] = [
  { dir: "tl", href: "/map",     label: "Map",    mark: "map" },
  { dir: "tr", href: "/quests",  label: "Quests", mark: "quest" },
  { dir: "bl", href: "/badges",  label: "Badges", mark: "badge" },
];
