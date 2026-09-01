import Link from "next/link";
import { Card } from "@/components/primitives/Card";
import { Mark, type MarkName } from "@/components/primitives/Marks";
import { Plate } from "@/components/primitives/Plate";
import { Data, Label, Rule } from "@/components/primitives/Text";
import { Screen, ScreenHead } from "@/components/shell/Screen";

const TIER_TILES: { mark: MarkName; label: string; time: string; line: string }[] = [
  { mark: "trot", label: "Trot", time: "15 MIN",
    line: "Round the block, but with something at the end of it." },
  { mark: "stroll", label: "Stroll", time: "45 MIN",
    line: "A proper lap. One good thing, maybe a coffee." },
  { mark: "sidequest", label: "Sidequest", time: "1H 30",
    line: "Far enough to leave the town behind." },
  { mark: "adventure", label: "Adventure", time: "3H 00",
    line: "A morning out. There will be a pub at the halfway." },
];

export default function AboutScreen() {
  return (
    <Screen>
      <ScreenHead label="About" title="What this is" />

      <Plate ratio="16/9" plate="about-hero" label="Three quarters of an hour"
        className="mb-4" />

      <div className="selectable flex flex-col gap-4">
        <p className="t-body text-ink">
          You know the feeling. You have three quarters of an hour, you would
          like to be outside, and you cannot think of anywhere to go that you
          have not already been forty times.
        </p>
        <p className="t-body text-ink">
          So you walk the same loop again. Or you do not bother.
        </p>
        <p className="t-body font-semibold text-ink">
          Tell Side Quest how long you have. It gives you a walk from where you
          are standing, built around something worth knowing about.
        </p>
      </div>

      <Label className="mt-7">Pick a length</Label>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {TIER_TILES.map((t) => (
          <Card key={t.label}>
            <span className="flex h-9 w-9 items-center justify-center border border-field bg-field-soft text-field"
              style={{ borderRadius: "var(--r-full)" }}>
              <Mark name={t.mark} size={18} />
            </span>
            <div className="mt-2.5 flex items-baseline justify-between gap-2">
              <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-ink">
                {t.label}
              </p>
              <Data className="text-stone">{t.time}</Data>
            </div>
            <p className="t-small mt-1 leading-snug text-stone">{t.line}</p>
          </Card>
        ))}
      </div>
      <p className="t-small mt-2.5 text-stone">
        That is the only decision you have to make. Everything else is already
        planned, including the bits that are muddy.
      </p>

      <Rule className="my-7" />

      <div className="selectable flex flex-col gap-3">
        <Plate ratio="16/9" plate="about-local" label="A cafe someone owns" className="mb-1" />
        <div className="flex items-center gap-2.5">
          <Mark name="table" size={18} />
          <h2 className="t-h2 text-ink">Nothing on this map is a chain</h2>
        </div>
        <p className="t-body text-ink">
          Every cafe, pub and kitchen here is somebody&apos;s own. That is not a
          filter you switch on, it is decided long before anything reaches your
          phone: the chains never make it into the data in the first place.
        </p>
        <p className="t-body text-ink">
          Search anywhere else and you get whatever has the most reviews. Which
          is how you end up walking past the good place to reach the one with a
          billboard.
        </p>
      </div>

      <Rule className="my-7" />

      <div className="selectable flex flex-col gap-3">
        <Plate ratio="16/9" plate="about-tales" label="A high cross" className="mb-1" />
        <div className="flex items-center gap-2.5">
          <Mark name="tale" size={18} />
          <h2 className="t-h2 text-ink">Everywhere has a tale</h2>
        </div>
        <p className="t-body text-ink">
          Reach a place and it will tell you about itself. Three or four cards:
          what the name means in Irish, what is actually standing there, who
          built it and roughly when.
        </p>
        <p className="t-body text-ink">
          None of it is made up. Every card carries the archive it came from, so
          you can go and read the rest yourself. Tales collect as you walk, and
          they are worth collecting: the wall at the end of your road has been
          there six hundred years longer than the road.
        </p>
        <Link href="/tales" className="t-small font-semibold text-field underline">
          See the tales you have found
        </Link>
      </div>

      <Rule className="my-7" />

      <div className="selectable flex flex-col gap-3">
        <Plate ratio="16/9" plate="about-collect" label="A ringfort bank" className="mb-1" />
        <div className="flex items-center gap-2.5">
          <Mark name="badge" size={18} />
          <h2 className="t-h2 text-ink">Things worth collecting</h2>
        </div>
        <p className="t-body text-ink">
          Ringforts. Holy wells. Mills, waterfalls, standing stones, ruined
          churches you would drive past without a glance. Each kind is its own
          set, and the counts are honest: three of forty seven means there are
          forty seven you can actually reach and see.
        </p>
        <p className="t-body text-ink">
          Badges land as those sets fill. Nothing expires, nothing decays, and
          there is no streak to keep alive. A bad fortnight costs you nothing.
        </p>
        <Link href="/badges" className="t-small font-semibold text-field underline">
          See your badges
        </Link>
      </div>

      <Rule className="my-7" />

      <div className="selectable flex flex-col gap-3">
        <Plate ratio="16/9" plate="about-map" label="Fog over townlands" className="mb-1" />
        <div className="flex items-center gap-2.5">
          <Mark name="map" size={18} />
          <h2 className="t-h2 text-ink">The map fills in</h2>
        </div>
        <p className="t-body text-ink">
          Ireland starts under fog. Walking clears it, permanently, tile by
          tile, and townland by townland with the Irish name and what it means.
          Fourteen townlands in Clare reads better than any number of steps.
        </p>
        <p className="t-body text-ink">
          We keep the squares you uncovered, never the path you took, so none of
          this can be replayed as a route. Your recorded track is the one
          exception and you can delete it from any walk.
        </p>
      </div>

      <Card className="mt-7 bg-surface-2">
        <Label>Where the facts come from</Label>
        <p className="selectable t-small mt-1.5 text-stone">
          OpenStreetMap contributors, ODbL. The Archaeological Survey of Ireland
          and the National Inventory of Architectural Heritage, Government of
          Ireland, CC BY 4.0. Logainm, Government of Ireland, CC BY 4.0.
          Wikidata, CC0.
        </p>
      </Card>
    </Screen>
  );
}
