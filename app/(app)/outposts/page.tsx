"use client";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { Data, Label } from "@/components/primitives/Text";
import { EmptyState } from "@/components/primitives/States";
import { Screen, ScreenHead } from "@/components/shell/Screen";

/** Outposts are the places you can start from: your saved locations and the
 *  base camp you are currently working out of. Backed by `saved_locations` in
 *  the schema. Product definition still open, see TODO.md. */
const SAVED = [
  { id: "o-base", name: "Base camp", detail: "Ennistymon · you are here", base: true },
  { id: "o-home", name: "Home", detail: "Cloonanaha", base: false },
];

export default function OutpostsScreen() {
  return (
    <Screen>
      <ScreenHead label="Outposts" title="Where you start from" />

      {SAVED.length === 0 ? (
        <EmptyState
          line="No outposts yet. Save a place you walk from often and it will start showing quests first."
          action={<Button>Save this place</Button>}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {SAVED.map((o) => (
            <Card key={o.id} flag={o.base}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="t-small font-semibold text-ink">{o.name}</p>
                {o.base ? (
                  <Data className="text-[10px] uppercase text-rust">Active</Data>
                ) : null}
              </div>
              <p className="t-small mt-1 text-stone">{o.detail}</p>
            </Card>
          ))}
        </div>
      )}

      <Label className="mt-6">Nearby</Label>
      <Card className="mt-2">
        <p className="t-small text-stone">
          Outposts you have not reached yet appear here once the map knows where
          you are.
        </p>
      </Card>
    </Screen>
  );
}
