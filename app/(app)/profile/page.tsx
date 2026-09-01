"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { StatRow } from "@/components/primitives/Stat";
import { Tabs } from "@/components/primitives/Tabs";
import { Data, Label, Rule } from "@/components/primitives/Text";
import { Skeleton } from "@/components/primitives/States";
import { Screen } from "@/components/shell/Screen";
import { HistoryList } from "@/components/domain/HistoryList";
import { BadgesPanel } from "@/components/domain/BadgesPanel";
import { SettingsPanel } from "@/components/domain/SettingsPanel";
import { NotesList } from "@/components/domain/NotesList";
import { ReferralTile } from "@/components/domain/ReferralTile";
import { data } from "@/lib/data";
import { useAsync } from "@/hooks/use-async";

/** Account, then three tabs over the same panels the standalone routes use,
 *  so nothing is duplicated and the two can never drift. */
export default function ProfileScreen() {
  const [tab, setTab] = useState("history");
  const territory = useAsync(() => data.getTerritory(), []);

  return (
    <Screen>
      <header className="flex items-start gap-3.5 pb-4">
        <span
          aria-hidden
          className="flex h-16 w-16 shrink-0 items-center justify-center border border-ink bg-field-soft text-[19px] font-semibold text-field"
          style={{ borderRadius: "var(--r-full)" }}
        >
          JD
        </span>
        <div className="min-w-0 flex-1">
          <p className="t-h1 text-ink">Josh</p>
          <Label style={{ fontSize: 10 }} className="mt-0.5">Rank 08 · Co. Clare</Label>
          <Data className="mt-1 block text-[11px] uppercase text-mute">
            josh@exhale.studio
          </Data>
        </div>
        <Link href="/profile/edit" className="shrink-0"><Button>Edit</Button></Link>
      </header>

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

      <div className="mt-3">
        <ReferralTile />
      </div>

      <Rule className="my-5" />

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: "history", label: "History" },
          { id: "badges", label: "Badges" },
          { id: "notes", label: "Notes" },
          { id: "settings", label: "Settings" },
        ]}
      />

      <div className="mt-4">
        {tab === "history" ? <HistoryList showStats={false} /> : null}
        {tab === "badges" ? <BadgesPanel /> : null}
        {tab === "notes" ? <NotesList /> : null}
        {tab === "settings" ? <SettingsPanel /> : null}
      </div>
    </Screen>
  );
}
