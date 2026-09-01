"use client";
import { useState } from "react";
import { ThumbAction } from "@/components/shell/ThumbAction";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { Field } from "@/components/primitives/Field";
import { Label } from "@/components/primitives/Text";
import { EmptyState } from "@/components/primitives/States";
import { TIERS, type QuestShape } from "@/lib/data";
import { cn } from "@/lib/cn";

/** Build your own route and, if you want, put it in front of the parish.
 *  Publishing is deliberately a second, separate decision: a route you made
 *  for yourself should not become public because you saved it. */
export function CustomQuest() {
  const [shape, setShape] = useState<QuestShape>("loop");
  const [tier, setTier] = useState(TIERS[1].id);
  const [share, setShare] = useState(false);

  return (
    <div className="flex flex-col gap-4 pb-[var(--tile)]">
      <Card>
        <Label>Your quests</Label>
        <EmptyState line="You have not built one yet. Drop points on the map and name the route." />
      </Card>

      <Label>Build one</Label>
      <div className="flex flex-col gap-3">
        <Field label="Name" placeholder="Three holy wells" />
        <Field label="Where it starts" placeholder="Drop a pin on the map" />

        <div>
          <Label>Shape</Label>
          <div className="mt-1.5 flex gap-1.5">
            {(["loop", "line"] as QuestShape[]).map((s) => (
              <button key={s} type="button" aria-pressed={shape === s}
                onClick={() => setShape(s)}
                className={cn("border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.06em]",
                  shape === s ? "border-field bg-field text-field-ink" : "border-rule bg-surface text-stone")}
                style={{ borderRadius: "var(--r-full)" }}>
                {s === "loop" ? "Loop" : "There and back"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Length</Label>
          <div className="mt-1.5 grid grid-cols-4 gap-1.5">
            {TIERS.map((t) => (
              <button key={t.id} type="button" aria-pressed={tier === t.id}
                onClick={() => setTier(t.id)}
                className={cn("border px-1 py-2 text-[9px] font-semibold uppercase tracking-[0.05em]",
                  tier === t.id ? "border-field bg-field text-field-ink" : "border-rule bg-surface text-stone")}
                style={{ borderRadius: "var(--r-sm)" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <Card className="bg-surface-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="t-small font-semibold text-ink">Share to community</p>
              <p className="t-small mt-0.5 text-stone">
                Anyone in the county can walk it. You can take it down later.
              </p>
            </div>
            <Button onClick={() => setShare(!share)} tone={share ? "solid" : "outline"}>
              {share ? "On" : "Off"}
            </Button>
          </div>
        </Card>

        <ThumbAction>Save quest</ThumbAction>
      </div>
    </div>
  );
}
