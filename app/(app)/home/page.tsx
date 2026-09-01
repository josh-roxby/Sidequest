"use client";
import { HomeLauncher } from "@/components/domain/HomeLauncher";
import { RankHeader } from "@/components/shell/RankHeader";
import { Screen } from "@/components/shell/Screen";
import { Data, Label, Rule } from "@/components/primitives/Text";
import { LockedCallout } from "@/components/primitives/Card";
import { Skeleton } from "@/components/primitives/States";
import { data } from "@/lib/data";
import { useAsync } from "@/hooks/use-async";

export default function HomeScreen() {
  const territory = useAsync(() => data.getTerritory(), []);

  return (
    <Screen>
      <RankHeader initials="JD" name="Josh" rank={8} leaves={420} stars={12} />

      <div className="mt-5 flex items-center gap-3">
        <Label>Home</Label>
        <Rule className="flex-1" />
      </div>

      {/* Illustration slot. The engraving-style field survey artwork goes here
          once it exists; until then the frame holds its own space so the
          layout below never shifts when it lands. */}
      <div
        className="mt-4 flex aspect-[4/3] w-full items-center justify-center border border-rule bg-surface"
        style={{ borderRadius: "var(--r-md)" }}
      >
        <Data className="text-[10px] uppercase text-mute">Field survey plate</Data>
      </div>

      <div className="mt-5 text-center">
        <h1 className="t-display text-ink" style={{ letterSpacing: "0.04em" }}>
          FIELD SURVEY
        </h1>
        <p className="t-data mt-1.5 text-[11px] uppercase text-stone">
          Walk · Record · Reveal
        </p>
        {territory.loading ? (
          <div className="mx-auto mt-3 w-40"><Skeleton h={14} /></div>
        ) : territory.data ? (
          <Data className="mt-3 block text-stone">
            {territory.data.tiles.toLocaleString()} TILES · {territory.data.townlands} TOWNLANDS
          </Data>
        ) : null}
      </div>

      <div className="mt-6">
        <HomeLauncher />
      </div>

      <div className="mt-4">
        <LockedCallout
          title="New quest in 2h 14m"
          hint="Or reach an outpost to unlock one now"
        />
      </div>
    </Screen>
  );
}
