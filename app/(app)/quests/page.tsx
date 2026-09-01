"use client";
import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { LockedCallout } from "@/components/primitives/Card";
import { Tabs } from "@/components/primitives/Tabs";
import { Label } from "@/components/primitives/Text";
import { EmptyState, Skeleton } from "@/components/primitives/States";
import { Screen, ScreenHead } from "@/components/shell/Screen";
import { QuestCard } from "@/components/domain/QuestCard";
import { data, TIERS, type Tier } from "@/lib/data";
import { useAsync } from "@/hooks/use-async";
import { cn } from "@/lib/cn";

export default function QuestsScreen() {
  const [tier, setTier] = useState<Tier>("stroll");
  const [tab, setTab] = useState("available");
  const quests = useAsync(() => data.getQuests(tier), [tier]);
  const list = quests.data ?? [];
  const spec = TIERS.find((t) => t.id === tier)!;

  return (
    <Screen>
      <ScreenHead label="Quests" title="Ennistymon" />

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: "active", label: "Active", count: 1 },
          { id: "available", label: "Available", count: list.length },
          { id: "completed", label: "Completed" },
        ]}
      />

      <Label className="mt-5">How long have you got</Label>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {TIERS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tier === t.id}
            onClick={() => setTier(t.id)}
            className={cn(
              "flex flex-col items-center gap-1 border px-1 py-2.5",
              tier === t.id
                ? "border-field bg-field text-field-ink"
                : "border-rule bg-surface text-stone",
            )}
            style={{ borderRadius: "var(--r-sm)", transition: "background-color var(--dur-state)" }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.05em]">
              {t.label}
            </span>
            <span className="t-data text-[10px]">{t.duration}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {quests.loading ? (
          <><Skeleton h={104} /><Skeleton h={104} /></>
        ) : quests.error ? (
          <div className="flex flex-col items-start gap-3 border border-rule bg-surface p-3.5"
            style={{ borderRadius: "var(--r-md)" }}>
            <p className="t-small text-ink">
              Could not reach the quest list. Check your connection and try again.
            </p>
            <Button onClick={() => setTier(tier)}>Retry</Button>
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            line={`Nothing within reach for a ${spec.label.toLowerCase()} here. The next length up usually has something.`}
            action={<Button onClick={() => setTier("stroll")}>Try a stroll</Button>}
          />
        ) : (
          list.map((q, i) => <QuestCard key={q.id} quest={q} flag={i === 0} done={0} />)
        )}
      </div>

      <div className="mt-3">
        <LockedCallout
          title="New quest in 2h 14m"
          hint="Or reach an outpost to unlock one now"
        />
      </div>
    </Screen>
  );
}
