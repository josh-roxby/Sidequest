"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mark, type MarkName } from "@/components/primitives/Marks";
import { Data, Label } from "@/components/primitives/Text";
import { Skeleton } from "@/components/primitives/States";
import { RankHeader } from "@/components/shell/RankHeader";
import { ThumbAction } from "@/components/shell/ThumbAction";
import { CountryBand } from "@/components/domain/CountryBand";
import { HomeCarousel } from "@/components/domain/HomeCarousel";
import { data, TIERS } from "@/lib/data";
import { useSettings } from "@/lib/settings";
import { useAsync } from "@/hooks/use-async";

const TILES: { href: string; label: string; mark: MarkName; tone: "field" | "rust" | "plain" }[] = [
  { href: "/quests", label: "Quests", mark: "quest", tone: "plain" },
  { href: "/badges", label: "Badges", mark: "badge", tone: "plain" },
  { href: "/map", label: "View map", mark: "map", tone: "plain" },
  { href: "/outposts", label: "Outposts", mark: "flag", tone: "rust" },
];

/** Fits the screen exactly. Nothing here scrolls.
 *
 *  One question at the top, one shelf of what is waiting, four ways in, and
 *  the action itself docked beside the nav button so it is always under your
 *  thumb. The screen used to end on decoration; it now ends on the thing you
 *  came here to do. */
export default function HomeScreen() {
  const router = useRouter();
  const cards = useAsync(() => data.getHomeCards(), []);
  const territory = useAsync(() => data.getTerritory(), []);
  const settings = useSettings();
  const tier = TIERS.find((t) => t.id === settings.defaultTier) ?? TIERS[1];

  return (
    <div
      className="flex h-full flex-col gap-3 overflow-hidden px-4"
      style={{
        paddingTop: "calc(env(safe-area-inset-top) + var(--s-4))",
        paddingBottom: "calc(var(--tile) + var(--gutter) * 2 + env(safe-area-inset-bottom))",
      }}
    >
      <div className="shrink-0">
        <RankHeader initials="JD" name="Josh" rank={8} leaves={420} stars={12} />
      </div>

      <Link
        href="/quests"
        className="card relative shrink-0 overflow-hidden border border-ink bg-field p-4 text-field-ink active:scale-[0.99]"
        style={{ borderRadius: "var(--r-md)", transitionDuration: "var(--dur-tap)" }}
      >
        <Label style={{ color: "var(--field-ink)", opacity: 0.7 }}>Ready to adventure</Label>
        <p className="t-h1 mt-1.5">{territory.data?.county ?? "Co. Clare"}</p>
        <p className="t-small mt-1 opacity-80">
          46 points within reach. Pick a length and go.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {TIERS.map((t) => (
            <span
              key={t.id}
              className="border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em]"
              style={{
                borderRadius: "var(--r-full)",
                borderColor: t.id === tier.id ? "var(--field-ink)" : "rgba(251,250,246,0.35)",
                opacity: t.id === tier.id ? 1 : 0.65,
              }}
            >
              {t.label}
            </span>
          ))}
        </div>
      </Link>

      <div className="min-h-[172px] max-h-[240px] shrink-0">
        <HomeCarousel cards={cards.data ?? []} loading={cards.loading} />
      </div>

      <nav aria-label="Shortcuts" className="grid shrink-0 grid-cols-4 gap-2">
        {TILES.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="flex h-[68px] flex-col items-center justify-center gap-1.5 border active:scale-[0.985]"
            style={{
              borderRadius: "var(--r-md)",
              transitionDuration: "var(--dur-tap)",
              background: t.tone === "rust" ? "var(--rust)" : "var(--surface)",
              color: t.tone === "rust" ? "var(--field-ink)" : "var(--stone)",
              borderColor: t.tone === "rust" ? "var(--rust)" : "var(--rule)",
            }}
          >
            <Mark name={t.mark} size={18} />
            <span className="text-[9px] font-semibold uppercase tracking-[0.06em]">
              {t.label}
            </span>
          </Link>
        ))}
      </nav>

      {territory.loading ? (
        <div className="shrink-0"><Skeleton h={12} /></div>
      ) : territory.data ? (
        <Data className="shrink-0 text-center text-[10px] uppercase text-mute">
          {territory.data.tiles.toLocaleString()} tiles · {territory.data.townlands} townlands · {territory.data.countryPct.toFixed(2)}% of Ireland
        </Data>
      ) : null}

      {/* Takes whatever height Home has left and collapses to nothing on a
          short screen, rather than pushing the grid off the bottom.
          docs/design-system.md §H. */}
      <div className="-mx-4 min-h-0 flex-1">
        <CountryBand />
      </div>

      <ThumbAction onClick={() => router.push("/quests")}>
        Begin a {tier.label.toLowerCase()}
      </ThumbAction>
    </div>
  );
}
