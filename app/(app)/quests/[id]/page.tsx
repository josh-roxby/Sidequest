"use client";
import { useRouter } from "next/navigation";
import { use } from "react";
import { Action } from "@/components/primitives/Action";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { Check } from "@/components/primitives/Tabs";
import { ShapeChip } from "@/components/primitives/ShapeChip";
import { Plate } from "@/components/primitives/Plate";
import { Data, Label, Rule } from "@/components/primitives/Text";
import { Skeleton } from "@/components/primitives/States";
import { Screen } from "@/components/shell/Screen";
import { data, TIERS } from "@/lib/data";
import { estimateDurationS, formatDistance, formatDuration } from "@/lib/walking";
import { useAsync } from "@/hooks/use-async";

export default function QuestDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const quest = useAsync(() => data.getQuest(id), [id]);
  const q = quest.data;
  const tier = q ? TIERS.find((t) => t.id === q.tier) : undefined;

  return (
    <Screen>
      <div className="flex items-center justify-between pb-3">
        <Button tone="quiet" aria-label="Back" onClick={() => router.back()}>←</Button>
        <div className="flex gap-1.5">
          <Button tone="quiet" aria-label="Save">Save</Button>
        </div>
      </div>

      {quest.loading ? (
        <div className="flex flex-col gap-3"><Skeleton h={180} /><Skeleton h={90} /></div>
      ) : !q ? (
        <p className="t-body text-stone">That quest is no longer available.</p>
      ) : (
        <>
          <Plate ratio="16/9" label={q.townland} />

          <h1 className="t-h1 mt-4 uppercase tracking-[0.04em] text-ink">{q.title}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Label>{tier?.label}</Label>
            <ShapeChip shape={q.shape} />
          </div>
          <p className="t-body mt-3 text-ink">{q.flavour}</p>

          <Label className="mt-6">Objectives</Label>
          <div className="mt-1">
            {q.objectives.map((o, i) => (
              <Check key={o.id} done={i === 0} label={o.label}
                value={o.required ? undefined : "optional"} />
            ))}
          </div>

          <Label className="mt-5">The walk</Label>
          <div className="mt-2 grid grid-cols-3 gap-px border border-rule bg-rule"
            style={{ borderRadius: "var(--r-md)", overflow: "hidden" }}>
            {[
              [formatDistance(q.distanceM).replace(" KM", ""), "km"],
              [formatDuration(estimateDurationS(q.distanceM, {
                surface: q.surface, ascentM: q.ascentM,
                dwellS: q.objectives.length * 240,
              })).replace(" MIN", ""), "time"],
              [`${q.ascentM}`, "m up"],
            ].map(([v, k]) => (
              <div key={k} className="bg-surface px-2.5 py-2.5">
                <Data size="lg" className="block text-ink">{v}</Data>
                <p className="t-label mt-0.5 text-mute" style={{ fontSize: 9 }}>{k}</p>
              </div>
            ))}
          </div>
          <p className="t-small mt-2 text-stone">
            Estimated at a comfortable pace for {q.surface === "made" ? "made paths"
              : q.surface === "unpaved" ? "unpaved ground" : "rough ground"}, with the
            climb and a few minutes at each point counted in.
            {q.shape === "line" ? " Both legs included." : ""}
          </p>

          <Label className="mt-6">Rewards</Label>
          <div className="mt-2 grid grid-cols-3 gap-px border border-rule bg-rule"
            style={{ borderRadius: "var(--r-md)", overflow: "hidden" }}>
            {[["150", "leaves"], ["25", "stars"], [`${q.objectives.length}`, "tales"]].map(([v, k]) => (
              <div key={k} className="bg-surface px-2.5 py-2.5">
                <Data size="lg" className="block text-ink">{v}</Data>
                <p className="t-label mt-0.5 text-mute" style={{ fontSize: 9 }}>{k}</p>
              </div>
            ))}
          </div>

          <Rule className="my-5" />

          {/* Never suppressed to make a quest look better. Suppressing this is
              the one thing that would break trust irrecoverably.
              docs/ux-loops.md §D-2. */}
          <Card className="bg-surface-2">
            <Label>Before you go</Label>
            <ul className="mt-1.5 flex flex-col gap-1">
              {q.honesty.map((h) => <li key={h} className="t-small text-ink">{h}</li>)}
            </ul>
          </Card>

          <div className="mt-5 flex items-center gap-2">
            <Action>Set active</Action>
            <Button tone="solid" aria-label="Add to a collection"
              className="shrink-0" style={{ background: "var(--rust)", borderColor: "var(--rust)" }}>
              +
            </Button>
          </div>
        </>
      )}
    </Screen>
  );
}
