"use client";
import { useState } from "react";
import { Tabs, TabPanel } from "@/components/primitives/Tabs";
import { Screen, ScreenHead } from "@/components/shell/Screen";
import { BadgesPanel } from "@/components/domain/BadgesPanel";
import { NotesList } from "@/components/domain/NotesList";
import { PointsPanel } from "@/components/domain/PointsPanel";

/** Everything a walk left you with, in one place.
 *
 *  Badges first because that is the progression people track. Points is what
 *  the badges are counted from, so it reads as the evidence behind them. Notes
 *  is here rather than only on a profile because it belongs to the same
 *  question: what came back with you. It stays on the profile too, since that
 *  is where you go looking for your own things. */
export default function CollectionScreen() {
  const [tab, setTab] = useState("badges");

  return (
    <Screen>
      <ScreenHead label="Collection" title="What you came back with" />

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: "badges", label: "Badges" },
          { id: "points", label: "Points" },
          { id: "notes", label: "Notes" },
        ]}
      />

      <TabPanel value={tab}>
        <div className="mt-4">
          {tab === "badges" ? <BadgesPanel /> : null}
          {tab === "points" ? <PointsPanel /> : null}
          {tab === "notes" ? <NotesList /> : null}
        </div>
      </TabPanel>
    </Screen>
  );
}
