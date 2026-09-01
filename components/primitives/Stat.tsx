import { Data } from "./Text";

export interface StatItem {
  value: string;
  key: string;
}

/** Always a divided row of three. The 1px gaps are the rule colour showing
 *  through a grid, not borders on each cell, so the hairlines never double. */
export function StatRow({ items }: { items: StatItem[] }) {
  return (
    <div className="grid grid-cols-3 gap-px border border-rule bg-rule">
      {items.map((s) => (
        <div key={s.key} className="bg-surface px-2.5 py-2.5">
          <Data size="lg" className="block text-ink">{s.value}</Data>
          <p className="t-label mt-0.5 text-mute" style={{ fontSize: 9 }}>{s.key}</p>
        </div>
      ))}
    </div>
  );
}
