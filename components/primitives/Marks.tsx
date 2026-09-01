/** Category and nav glyphs. All drawn on a 16px grid with a 1.6 stroke and
 *  SQUARE caps and joins. A rounded cap anywhere in this system reads as a
 *  mistake. docs/design-system.md §D-1. */

export type MarkName =
  | "map" | "quest" | "journal" | "you"
  | "fort" | "sacred" | "ancient" | "water" | "green" | "height" | "built" | "table";

const PATHS: Record<MarkName, React.ReactNode> = {
  map:     <><rect x="2.5" y="2.5" width="11" height="11" /><rect x="6" y="6" width="4" height="4" fill="currentColor" stroke="none" /></>,
  quest:   <path d="M8 2l6 6-6 6-6-6z" />,
  journal: <><rect x="2.5" y="2.5" width="11" height="11" /><path d="M8 3v10M2.5 8h11" /></>,
  you:     <><rect x="2.5" y="2.5" width="4.5" height="4.5" /><rect x="9" y="2.5" width="4.5" height="4.5" /><rect x="2.5" y="9" width="4.5" height="4.5" /><rect x="9" y="9" width="4.5" height="4.5" /></>,
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
