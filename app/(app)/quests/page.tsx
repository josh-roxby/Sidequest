"use client";
import { useState } from "react";
import { Tabs, TabPanel } from "@/components/primitives/Tabs";
import { StartQuest } from "@/components/domain/StartQuest";
import { CommunityQuests } from "@/components/domain/CommunityQuests";
import { CustomQuest } from "@/components/domain/CustomQuest";
import { HistoryList } from "@/components/domain/HistoryList";

/** Start is the default and it is the whole point of the screen. History,
 *  Community and Custom are places to go afterwards, not choices to make
 *  before you have a walk. */
export default function QuestsScreen() {
  const [tab, setTab] = useState("start");

  return (
    <div
      className="flex h-dvh flex-col gap-3 overflow-hidden px-4"
      style={{
        paddingTop: "calc(env(safe-area-inset-top) + var(--s-3))",
        paddingBottom: "calc(var(--tile) + var(--gutter) * 2 + env(safe-area-inset-bottom))",
      }}
    >
      <div className="shrink-0">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { id: "start", label: "Start" },
            { id: "history", label: "History" },
            { id: "community", label: "Community" },
            { id: "custom", label: "Custom" },
          ]}
        />
      </div>

      {tab === "start" ? (
        <div className="min-h-0 flex-1"><StartQuest /></div>
      ) : (
        /* min-h-0 plus overflow on this element, not the page: without it the
           grid grows past the viewport and scrolls under the nav rather than
           stopping at the foot of the screen. */
        <div className="no-bar -mx-4 min-h-0 flex-1 overflow-y-auto px-4 pt-1"
          style={{ paddingBottom: "calc(var(--tile) + var(--gutter) * 2)" }}>
          <TabPanel value={tab}>
            {tab === "history" ? <HistoryList showStats={false} /> : null}
            {tab === "community" ? <CommunityQuests /> : null}
            {tab === "custom" ? <CustomQuest /> : null}
          </TabPanel>
        </div>
      )}
    </div>
  );
}
