import Link from "next/link";
import { Mark } from "@/components/primitives/Marks";
import { Tooltip } from "@/components/primitives/Tooltip";
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
      <Link
        href="/profile"
        aria-label={`${name}, rank ${rank}. Open your profile`}
        className="flex h-11 w-11 shrink-0 items-center justify-center border border-ink bg-field-soft text-[13px] font-semibold text-field active:scale-[0.97]"
        style={{ borderRadius: "var(--r-full)", transitionDuration: "var(--dur-tap)" }}
      >
        {initials}
      </Link>
      <Link href="/profile" className="min-w-0 flex-1">
        <p className="t-h2 text-ink">{name}</p>
        <Label style={{ fontSize: 10 }}>Rank {String(rank).padStart(2, "0")}</Label>
      </Link>
      <div className="flex items-center gap-2">
        <Pip tone="field" value={leaves}
          tip="Leaves. Earned for distance walked and points reached. They set your rank." />
        <Pip tone="rust" value={stars}
          tip="Stars. Earned only the first time you reach a place. They unlock badges." />
      </div>
    </header>
  );
}

function Pip({ tone, value, tip }: { tone: "field" | "rust"; value: number; tip: string }) {
  const colour = tone === "field" ? "var(--field)" : "var(--rust)";
  return (
    <Tooltip text={tip}>
      <span
        className="flex items-center gap-1.5 border px-2 py-1"
        style={{
          borderRadius: "var(--r-full)",
          borderColor: colour,
          background: tone === "field" ? "var(--field-soft)" : "var(--rust-soft)",
        }}
      >
        <span aria-hidden className="flex items-center" style={{ color: colour }}>
          <Mark name={tone === "field" ? "leaf" : "star"} size={13} />
        </span>
        <Data className="text-[12px]" style={{ color: colour }}>{value}</Data>
      </span>
    </Tooltip>
  );
}
