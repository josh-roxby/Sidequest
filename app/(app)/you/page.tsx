"use client";
import { Mark } from "@/components/primitives/Marks";
import { Data, Label, Rule } from "@/components/primitives/Text";
import { StatRow } from "@/components/primitives/Stat";
import { Skeleton } from "@/components/primitives/States";
import { Screen, ScreenHead } from "@/components/shell/Screen";
import { data } from "@/lib/data";
import { useAsync } from "@/hooks/use-async";

export default function YouScreen() {
  const territory = useAsync(() => data.getTerritory(), []);
  const cats = useAsync(() => data.getCategories(), []);

  return (
    <Screen>
      <ScreenHead label="You" title="Territory and progress" />

      {territory.loading ? (
        <Skeleton h={62} />
      ) : territory.data ? (
        <StatRow
          items={[
            { value: territory.data.tiles.toLocaleString(), key: "tiles" },
            { value: `${territory.data.townlands}`, key: "townlands" },
            { value: territory.data.areaKm2.toFixed(2), key: "km²" },
          ]}
        />
      ) : null}

      {territory.data ? (
        <p className="t-small mt-2.5 text-stone">
          <Data className="text-ink">{territory.data.countryPct.toFixed(2)}%</Data> of Ireland,
          and <Data className="text-ink">{territory.data.townlands}</Data> of{" "}
          <Data className="text-ink">{territory.data.townlandsTotal.toLocaleString()}</Data>{" "}
          townlands in {territory.data.county}.
        </p>
      ) : null}

      <Rule className="my-5" />
      <Label>Categories</Label>

      <div className="mt-2.5 flex flex-col gap-px bg-rule">
        {cats.loading ? (
          <><Skeleton h={44} /><Skeleton h={44} /><Skeleton h={44} /></>
        ) : (
          (cats.data ?? []).map((c) => (
            <button key={c.group} type="button"
              className="flex items-center gap-3 bg-surface px-3 py-2.5 text-left active:bg-field-soft">
              <span className="text-stone"><Mark name={c.group} /></span>
              <span className="t-small flex-1 font-semibold text-ink">{c.label}</span>
              {/* No invented denominators. If the dataset does not know how
                  many exist, show the count alone. docs/ux-loops.md §H. */}
              <Data className="text-stone">
                {c.total === null ? `${c.reached}` : `${c.reached} / ${c.total}`}
              </Data>
            </button>
          ))
        )}
      </div>
    </Screen>
  );
}
