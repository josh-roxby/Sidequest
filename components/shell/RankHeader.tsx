import { Data, Label } from "@/components/primitives/Text";

/** Identity strip. The avatar is one of the few fully round things in the
 *  system: identity and map objects are round, chrome is not. */
export function RankHeader({
  initials, name, rank, leaves, stars,
}: {
  initials: string; name: string; rank: number; leaves: number; stars: number;
}) {
  return (
    <header className="flex items-center gap-3">
      <span
        aria-hidden
        className="flex h-11 w-11 shrink-0 items-center justify-center border border-ink bg-field-soft text-[13px] font-semibold text-field"
        style={{ borderRadius: "var(--r-full)" }}
      >
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="t-h2 text-ink">{name}</p>
        <Label style={{ fontSize: 10 }}>Rank {String(rank).padStart(2, "0")}</Label>
      </div>
      <div className="flex items-center gap-2">
        <Pip tone="field" value={leaves} />
        <Pip tone="rust" value={stars} />
      </div>
    </header>
  );
}

function Pip({ tone, value }: { tone: "field" | "rust"; value: number }) {
  return (
    <span
      className="flex items-center gap-1.5 border px-2 py-1"
      style={{
        borderRadius: "var(--r-full)",
        borderColor: tone === "field" ? "var(--field)" : "var(--rust)",
        background: tone === "field" ? "var(--field-soft)" : "var(--rust-soft)",
      }}
    >
      <span aria-hidden className="h-2 w-2"
        style={{ borderRadius: "var(--r-full)",
                 background: tone === "field" ? "var(--field)" : "var(--rust)" }} />
      <Data className="text-[12px]" style={{ color: tone === "field" ? "var(--field)" : "var(--rust)" }}>
        {value}
      </Data>
    </span>
  );
}
