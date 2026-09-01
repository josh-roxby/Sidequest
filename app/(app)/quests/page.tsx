"use client";
import { useState } from "react";
import { Action } from "@/components/primitives/Action";
import { Button } from "@/components/primitives/Button";
import { Data, Label, Rule } from "@/components/primitives/Text";
import { StatRow } from "@/components/primitives/Stat";
import { EmptyState, Skeleton } from "@/components/primitives/States";
import { Frame } from "@/components/shell/Frame";
import { Screen, ScreenHead } from "@/components/shell/Screen";
import { data, TIERS, type Quest, type Tier } from "@/lib/data";
import { useAsync } from "@/hooks/use-async";
import { cn } from "@/lib/cn";

export default function QuestsScreen() {
  const [tier, setTier] = useState<Tier>("stroll");
  const [preview, setPreview] = useState<Quest | null>(null);
  const [i, setI] = useState(0);
  const quests = useAsync(() => data.getQuests(tier), [tier]);
  const list = quests.data ?? [];
  const spec = TIERS.find((t) => t.id === tier)!;

  return (
    <Screen>
      <ScreenHead label="How long have you got" title="Ennistymon"
        sub="Pick a length. The rest is already planned." />

      <div className="flex flex-col gap-2">
        {TIERS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tier === t.id}
            onClick={() => { setTier(t.id); setI(0); }}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-none border px-3 py-2.5 text-left",
              tier === t.id ? "border-ink bg-field-soft" : "border-rule bg-surface",
            )}
            style={{ transition: "background-color var(--dur-state) var(--ease)" }}
          >
            <span className="h-2.5 w-2.5 shrink-0 bg-field" />
            <span className="t-small flex-1 font-semibold text-ink">{t.label}</span>
            <Data className="text-stone">{t.duration}</Data>
          </button>
        ))}
      </div>

      <Rule className="my-5" />
      <Label>Within reach</Label>

      <div className="mt-2.5">
        {quests.loading ? (
          <div className="flex flex-col gap-2">
            <Skeleton h={64} /><Skeleton h={64} />
          </div>
        ) : quests.error ? (
          <div className="flex flex-col items-start gap-3 border border-rule bg-surface p-3">
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
          <div className="flex flex-col gap-2">
            {list.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setPreview(q)}
                className="w-full border border-rule bg-surface p-3 text-left active:bg-field-soft"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="t-small font-semibold text-ink">{q.title}</span>
                  <Data className="shrink-0 text-stone">
                    {(q.distanceM / 1000).toFixed(2)} KM
                  </Data>
                </div>
                <p className="t-small mt-1 text-stone">{q.flavour}</p>
                {q.startsAwayM > 0 ? (
                  <Data className="mt-1.5 block text-[11px] uppercase text-mute">
                    Starts {q.startsAwayM} m away
                  </Data>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>

      <Frame
        open={preview !== null}
        onDismiss={() => setPreview(null)}
        ratio="tall"
        label={`${spec.label} · ${spec.duration}`}
        title={preview?.title ?? ""}
        action={<Action onClick={() => setPreview(null)}>Begin</Action>}
      >
        {preview ? (
          <div className="flex flex-col gap-4">
            <StatRow
              items={[
                { value: (preview.distanceM / 1000).toFixed(2), key: "km" },
                { value: `${preview.durationMin}`, key: "min" },
                { value: `${preview.objectives.length}`, key: "points" },
              ]}
            />
            <p className="t-body text-ink">{preview.flavour}</p>

            <div className="flex flex-col gap-1.5">
              <Label>Objectives</Label>
              {preview.objectives.map((o) => (
                <div key={o.id} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0"
                    style={o.required
                      ? { boxShadow: "inset 0 0 0 2px var(--ink)" }
                      : { background: "var(--field)" }}
                  />
                  <span className="t-small text-ink">{o.label}</span>
                  {!o.required ? (
                    <Data className="text-[10px] uppercase text-mute">optional</Data>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Never suppressed to make a quest look better. Suppressing this
                is the one thing that would break trust irrecoverably.
                docs/ux-loops.md §D-2. */}
            <div className="border border-rule bg-surface-2 p-3">
              <Label>Before you go</Label>
              <ul className="mt-1.5 flex flex-col gap-1">
                {preview.honesty.map((h) => (
                  <li key={h} className="t-small text-ink">{h}</li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setI(i + 1)}>Reroll</Button>
              <Button tone="quiet">Save</Button>
            </div>
          </div>
        ) : null}
      </Frame>
    </Screen>
  );
}
