import { Mark, type MarkName } from "@/components/primitives/Marks";
import { Label } from "@/components/primitives/Text";
import type { Encounter, EncounterKind } from "@/lib/data";

const KIND: Record<EncounterKind, { mark: MarkName; label: string }> = {
  point: { mark: "badge", label: "To reach" },
  food: { mark: "table", label: "Maybe" },
  terrain: { mark: "map", label: "Underfoot" },
  view: { mark: "height", label: "To see" },
};

/** What you might run into, gathered from the points the route passes.
 *
 *  Vague on purpose. It sets expectations without spoiling the walk, and a
 *  food stop is always framed as a maybe because it might be shut, which is
 *  the one thing the dataset genuinely cannot promise. */
export function EncounterList({ encounters }: { encounters: Encounter[] }) {
  return (
    <div className="flex flex-col gap-px overflow-hidden border border-rule bg-rule"
      style={{ borderRadius: "var(--r-md)" }}>
      {encounters.map((e) => (
        <div key={e.label} className="flex items-start gap-2.5 bg-surface px-3 py-2.5">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border border-rule text-stone"
            style={{ borderRadius: "var(--r-full)" }}>
            <Mark name={KIND[e.kind].mark} size={13} />
          </span>
          <span className="min-w-0 flex-1">
            <Label style={{ fontSize: 9 }}>{KIND[e.kind].label}</Label>
            <p className="t-small mt-0.5 font-semibold text-ink">{e.label}</p>
            {e.detail ? <p className="t-small mt-0.5 text-stone">{e.detail}</p> : null}
          </span>
        </div>
      ))}
    </div>
  );
}
