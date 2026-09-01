/** Category and nav glyphs. All drawn on a 16px grid with a 1.6 stroke and
 *  SQUARE caps and joins. A rounded cap anywhere in this system reads as a
 *  mistake. docs/design-system.md §D-1. */

export type MarkName =
  | "map" | "quest" | "journal" | "you" | "grid" | "pack" | "tale" | "badge"
  | "flag" | "info" | "compass"
  | "fort" | "sacred" | "ancient" | "water" | "green" | "height" | "built" | "table";

const PATHS: Record<MarkName, React.ReactNode> = {
  map:     <><rect x="2.5" y="2.5" width="11" height="11" /><rect x="6" y="6" width="4" height="4" fill="currentColor" stroke="none" /></>,
  quest:   <path d="M8 2l6 6-6 6-6-6z" />,
  journal: <><rect x="2.5" y="2.5" width="11" height="11" /><path d="M8 3v10M2.5 8h11" /></>,
  you:     <><rect x="2.5" y="2.5" width="4.5" height="4.5" /><rect x="9" y="2.5" width="4.5" height="4.5" /><rect x="2.5" y="9" width="4.5" height="4.5" /><rect x="9" y="9" width="4.5" height="4.5" /></>,
  // The nav button glyph: a surveyed sheet, ruled into nine and pinned.
  grid:    <><rect x="2" y="2" width="12" height="12" /><path d="M6 2v12M10 2v12M2 6h12M2 10h12" /><rect x="6.75" y="6.75" width="2.5" height="2.5" fill="currentColor" stroke="none" /></>,
  pack:    <><path d="M3.5 6.5h9v7h-9z" /><path d="M6 6.5V4a2 2 0 0 1 4 0v2.5" /><path d="M3.5 9.5h9" /></>,
  tale:    <><path d="M3 3h5.5a2 2 0 0 1 2 2v8.5H5a2 2 0 0 0-2 2z" /><path d="M13 3.5v10" /></>,
  badge:   <><path d="M8 2l4.5 2.5v5L8 14l-4.5-4.5v-5z" /><path d="M8 6l1 2h2l-1.5 1.5.5 2L8 10.5 6 11.5l.5-2L5 8h2z" /></>,
  flag:    <><path d="M4 14V2.5" /><path d="M4 3h8l-2 2.5L12 8H4z" /></>,
  info:    <><rect x="2.5" y="2.5" width="11" height="11" /><path d="M8 7v4" /><rect x="7.25" y="4.5" width="1.5" height="1.5" fill="currentColor" stroke="none" /></>,
  compass: <><rect x="2.5" y="2.5" width="11" height="11" /><path d="M8 4.5l1.8 3.5L8 11.5 6.2 8z" /></>,
  fort:    <><path d="M2.5 13.5V6l2-1.5V6h7V4.5L13.5 6v7.5z" /><path d="M6.5 13.5V10h3v3.5" /></>,
  sacred:  <><path d="M8 2v12M4.5 5.5h7" /><rect x="2.5" y="9.5" width="11" height="4" /></>,
  ancient: <><rect x="3" y="6" width="3" height="7.5" /><rect x="10" y="6" width="3" height="7.5" /><path d="M2 3.5h12v2.5H2z" /></>,
  water:   <><path d="M2 6h12M2 9.5h12M2 13h12" /></>,
  green:   <><path d="M8 13.5V7M8 7L4.5 3.5M8 7l3.5-3.5" /><rect x="6" y="13" width="4" height="1" fill="currentColor" stroke="none" /></>,
  height:  <><path d="M2 13.5l4.5-8 3 5 2-3 2.5 6z" /></>,
  built:   <><rect x="2.5" y="5.5" width="11" height="8" /><path d="M2.5 5.5L8 2l5.5 3.5M6 13.5v-4h4v4" /></>,
  table:   <><rect x="2.5" y="3" width="11" height="4" /><path d="M4.5 7v6.5M11.5 7v6.5" /></>,
};

export function Mark({ name, size = 16 }: { name: MarkName; size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 16 16" aria-hidden
      fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="square" strokeLinejoin="miter"
    >
      {PATHS[name]}
    </svg>
  );
}
