"use client";
import { useState } from "react";
import { Card } from "@/components/primitives/Card";
import { Button } from "@/components/primitives/Button";
import { Data, Label, Rule } from "@/components/primitives/Text";
import { cn } from "@/lib/cn";

function Row({ label, hint, children }: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-rule py-3.5 last:border-b-0">
      <div className="min-w-0">
        <p className="t-small font-semibold text-ink">{label}</p>
        {hint ? <p className="t-small mt-0.5 text-stone">{hint}</p> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ on, onChange, label }: {
  on: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn("relative h-7 w-12 border", on ? "border-field bg-field" : "border-rule bg-surface-2")}
      style={{ borderRadius: "var(--r-full)", transition: "background-color var(--dur-state)" }}
    >
      <span
        className="absolute top-[3px] block h-4 w-4 bg-surface"
        style={{
          borderRadius: "var(--r-full)",
          left: on ? 26 : 4,
          transition: "left var(--dur-state) var(--ease)",
        }}
      />
    </button>
  );
}

export function SettingsPanel() {
  const [metric, setMetric] = useState(true);
  const [leftHanded, setLeftHanded] = useState(false);

  return (
    <>
      <Card inset={false} className="px-3.5">
        <Row label="Distances" hint={metric ? "Kilometres and metres" : "Miles and feet"}>
          <Button onClick={() => setMetric(!metric)}>{metric ? "Metric" : "Imperial"}</Button>
        </Row>
        <Row
          label="Left-handed nav"
          hint="Moves the button and its shortcut lattice to the bottom left"
        >
          <Toggle on={leftHanded} onChange={setLeftHanded} label="Left-handed navigation" />
        </Row>
      </Card>

      <Label className="mt-6">Location</Label>
      <Card className="mt-2">
        <p className="t-small text-stone">
          We store the tiles you reveal, never the path you took, so nothing
          here can be replayed as a route. Your recorded track is the one higher
          resolution trace and it is deletable from any walk in History.
        </p>
        <div className="mt-3 flex gap-2">
          <Button>Clear last location</Button>
        </div>
      </Card>

      <Rule className="my-6" />

      <Label>Build</Label>
      <Card className="mt-2">
        <div className="flex items-center justify-between">
          <p className="t-small text-stone">Data source</p>
          <Data className="text-[11px] uppercase text-ink">
            {process.env.NEXT_PUBLIC_DATA_MODE === "live" ? "Live" : "Mock"}
          </Data>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="t-small text-stone">Auth</p>
          <Data className="text-[11px] uppercase text-ink">
            {process.env.NEXT_PUBLIC_AUTH_ENABLED === "1" ? "On" : "Off"}
          </Data>
        </div>
      </Card>
    </>
  );
}
