"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { Data, Label, Rule } from "@/components/primitives/Text";
import { Frame } from "@/components/shell/Frame";
import { TIERS } from "@/lib/data";
import { setSetting, useSettings, type Settings } from "@/lib/settings";
import { cn } from "@/lib/cn";
import { clearAcknowledgement, useNeedsBrief } from "@/lib/safety";

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

/** Settings persist to localStorage through lib/settings and are read with
 *  useSyncExternalStore, so a change lands everywhere at once. The earlier
 *  version held them in component state, which is why left-handed appeared to
 *  work and then forgot itself the moment you navigated. */
export function SettingsPanel() {
  /** The same store the start gate reads, so this row is never stale. */
  const needsBrief = useNeedsBrief();
  const s = useSettings();
  const [legal, setLegal] = useState<null | "terms" | "privacy">(null);
  const [exported, setExported] = useState(false);

  function set<K extends keyof Settings>(k: K, v: Settings[K]) { setSetting(k, v); }

  /** Everything the app holds about you, as one JSON file, generated on the
   *  device. No request, no queue, no waiting on an email. */
  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      settings: s,
      note: "Walks, notes, tales and territory are added here once the app is on live data.",
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sidequest-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2400);
  }

  return (
    <>
      <Label>Walking</Label>
      <Card inset={false} className="mt-2 px-3.5">
        <Row label="Distances" hint={s.units === "metric" ? "Kilometres and metres" : "Miles and feet"}>
          <Button onClick={() => set("units", s.units === "metric" ? "imperial" : "metric")}>
            {s.units === "metric" ? "Metric" : "Imperial"}
          </Button>
        </Row>
        <Row label="Usual length" hint="Preselected when you start a quest">
          <Button onClick={() => {
            const i = TIERS.findIndex((t) => t.id === s.defaultTier);
            set("defaultTier", TIERS[(i + 1) % TIERS.length].id);
          }}>
            {TIERS.find((t) => t.id === s.defaultTier)?.label}
          </Button>
        </Row>
        <Row label="Keep the screen awake" hint="While a walk is running, so tiles keep recording">
          <Toggle on={s.keepAwake} onChange={(v) => set("keepAwake", v)} label="Keep the screen awake" />
        </Row>
      </Card>

      <Label className="mt-6">Handling</Label>
      <Card inset={false} className="mt-2 px-3.5">
        <Row label="Left-handed" hint="Moves the nav button and its shortcuts to the bottom left">
          <Toggle on={s.leftHanded} onChange={(v) => set("leftHanded", v)} label="Left-handed" />
        </Row>
        <Row label="Haptics" hint="A tap when a hold opens and when the aim changes">
          <Toggle on={s.haptics} onChange={(v) => set("haptics", v)} label="Haptics" />
        </Row>
        <Row label="Reduce motion" hint="On top of whatever your device already asks for">
          <Toggle on={s.reduceMotion} onChange={(v) => set("reduceMotion", v)} label="Reduce motion" />
        </Row>
      </Card>

      <Label className="mt-6">The map</Label>
      <Card inset={false} className="mt-2 px-3.5">
        <Row label="Community points" hint="Places other walkers have added and we have reviewed">
          <Toggle on={s.showCommunity} onChange={(v) => set("showCommunity", v)} label="Community points" />
        </Row>
        <Row label="Activity ticker" hint="The scrolling line in the navigation drawer">
          <Toggle on={s.activityInDrawer} onChange={(v) => set("activityInDrawer", v)} label="Activity ticker" />
          <div className="flex items-center justify-between gap-3 border-t border-rule pt-3">
            <div className="min-w-0">
              <p className="t-small text-ink">Safety brief</p>
              <p className="t-small text-stone">
                {needsBrief
                  ? "It will show before your next walk."
                  : "Read and acknowledged. Show it again before the next walk."}
              </p>
            </div>
            <Button tone="outline" disabled={needsBrief} onClick={clearAcknowledgement}>
              Show again
            </Button>
          </div>
        </Row>
      </Card>

      <Label className="mt-6">Your data</Label>
      <Card className="mt-2">
        <p className="t-small text-stone">
          We keep the tiles you uncovered, never the path you took, so nothing
          here can be replayed as a route. Your recorded track is the one
          exception and it is deletable from any walk in History.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={exportData}>{exported ? "Downloaded" : "Export my data"}</Button>
          <Button>Clear last location</Button>
        </div>
      </Card>

      <Card className="mt-2 border-dashed">
        <p className="t-small font-semibold text-ink">Delete your account</p>
        <p className="t-small mt-0.5 text-stone">
          Removes everything: walks, notes, tales, territory and badges. It
          cannot be undone and there is no copy kept.
        </p>
        <div className="mt-3">
          <Button tone="quiet">Delete account</Button>
        </div>
      </Card>

      <Rule className="my-6" />

      <Label>Legal</Label>
      <Card inset={false} className="mt-2 px-3.5">
        <Row label="Terms of use">
          <Button onClick={() => setLegal("terms")}>Read</Button>
        </Row>
        <Row label="Privacy">
          <Button onClick={() => setLegal("privacy")}>Read</Button>
        </Row>
        <Row label="Data sources" hint="OpenStreetMap, SMR, NIAH, Logainm, Wikidata">
          <Link href="/about"><Button>About</Button></Link>
        </Row>
      </Card>

      <Label className="mt-6">Build</Label>
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

      <Frame
        open={legal !== null}
        onDismiss={() => setLegal(null)}
        ratio="tall"
        label="Side Quest"
        title={legal === "terms" ? "Terms of use" : "Privacy"}
      >
        <div className="selectable flex flex-col gap-3">
          {legal === "terms" ? (
            <>
              <p className="t-body text-ink">
                Side Quest suggests walks. It does not supervise them. Roads,
                weather, livestock, tides and daylight are yours to judge, and
                you should turn back whenever the ground says so.
              </p>
              <p className="t-body text-ink">
                Routes avoid land marked private in our data, but data is never
                perfect. If a gate says no, it means no. Respect the countryside
                code, close what you open, and do not climb anything.
              </p>
              <p className="t-body text-ink">
                Community points and quests are written by other walkers. We
                review them before they appear, which is not the same as
                guaranteeing them. Report anything wrong or unsafe and we will
                take it down.
              </p>
              <p className="t-body text-ink">
                Do not add anything you do not have the right to share, anything
                on private land, or anything that would send someone somewhere
                dangerous. Accounts that do get removed.
              </p>
              <p className="t-body text-ink">
                The app is free. There is no advertising, nothing is ranked by
                who paid, and there never will be.
              </p>
            </>
          ) : (
            <>
              <p className="t-body text-ink">
                The short version: we store the squares of the map you have
                uncovered, not the path you walked. A set of hexagon identifiers
                cannot be replayed as a route and does not reveal your speed,
                your direction or where you stopped.
              </p>
              <p className="t-body text-ink">
                Your recorded track is the one higher resolution thing we hold.
                It exists so a walk can be drawn on its own record, it is never
                shown to anyone else, and you can delete it from any walk in
                History without losing the walk.
              </p>
              <p className="t-body text-ink">
                Your location is used to choose walks near you and is held on
                your device between sessions so the map opens in the right
                place. Clearing it in settings removes it.
              </p>
              <p className="t-body text-ink">
                The community feed carries first names only and never carries a
                location. An event says what someone did, never where they are.
              </p>
              <p className="t-body text-ink">
                Notes are yours. They are not shared, not published, and not
                used for anything.
              </p>
              <p className="t-body text-ink">
                Export everything we hold as a JSON file whenever you want, from
                this screen, with no request and no waiting. Deleting your
                account removes all of it and keeps no copy.
              </p>
              <p className="t-body text-ink">
                We do not sell data, we do not run advertising, and there are no
                third party trackers in the app.
              </p>
            </>
          )}
        </div>
      </Frame>
    </>
  );
}
