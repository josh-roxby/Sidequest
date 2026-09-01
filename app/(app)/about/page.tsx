import { Card } from "@/components/primitives/Card";
import { Data, Label, Rule } from "@/components/primitives/Text";
import { Screen, ScreenHead } from "@/components/shell/Screen";
import { TIERS } from "@/lib/data";

export default function AboutScreen() {
  return (
    <Screen>
      <ScreenHead label="About" title="How this works" />

      <div className="selectable flex flex-col gap-4">
        <p className="t-body text-ink">
          Pick how long you have. Side Quest gives you a walking loop from where
          you are, built around a real place worth knowing about: a ringfort, a
          holy well, a mill, a lough shore.
        </p>

        <Label className="mt-2">The four lengths</Label>
        <div className="flex flex-col gap-px overflow-hidden border border-rule bg-rule"
          style={{ borderRadius: "var(--r-md)" }}>
          {TIERS.map((t) => (
            <div key={t.id} className="flex items-baseline justify-between bg-surface px-3 py-2.5">
              <span className="t-small font-semibold text-ink">{t.label}</span>
              <Data className="text-stone">
                {t.duration} · {(t.minM / 1000).toFixed(1)}–{(t.maxM / 1000).toFixed(1)} KM
              </Data>
            </div>
          ))}
        </div>

        <Rule className="my-1" />

        <Label>Local only</Label>
        <p className="t-body text-ink">
          Every cafe, pub and restaurant on this map is independent. Chains are
          excluded in the data pipeline rather than filtered in the app, so one
          can never quietly appear.
        </p>

        <Label className="mt-2">Territory</Label>
        <p className="t-body text-ink">
          Walking reveals the map permanently. We store the tiles you unlocked,
          never the path you took, so nothing here can be replayed as a route.
          The one higher resolution trace, your recorded track, is yours to
          delete from any walk in History.
        </p>

        <Label className="mt-2">Tales</Label>
        <p className="t-body text-ink">
          Every story attached to a place carries its source and its licence.
          Nothing is invented. Where a source cannot be quoted, the tale links
          out to it instead.
        </p>

        <Card className="mt-2 bg-surface-2">
          <Label>Sources</Label>
          <p className="t-small mt-1.5 text-stone">
            OpenStreetMap contributors, ODbL. Archaeological Survey of Ireland
            and the National Inventory of Architectural Heritage, Government of
            Ireland, CC BY 4.0. Logainm, Government of Ireland, CC BY 4.0.
            Wikidata, CC0.
          </p>
        </Card>
      </div>
    </Screen>
  );
}
