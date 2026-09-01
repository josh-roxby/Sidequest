"use client";
import Link from "next/link";
import { Mark, type MarkName } from "@/components/primitives/Marks";
import { RankHeader } from "@/components/shell/RankHeader";
import { HomeCarousel } from "@/components/domain/HomeCarousel";
import { HillsBand } from "@/components/domain/HillsBand";
import { Marquee } from "@/components/primitives/Marquee";
import { data } from "@/lib/data";
import { useAsync } from "@/hooks/use-async";

/** Fits the screen exactly. Nothing here scrolls vertically.
 *
 *  The header and the grid take the height they need; the carousel takes
 *  whatever is left, which is what makes its mixed-ratio cards size themselves.
 *  A home screen you have to scroll is a home screen that has stopped being a
 *  place to start from. */
const TILES: { href: string; label: string; mark: MarkName; tone: "field" | "rust" | "plain" }[] = [
  { href: "/quests", label: "New quest", mark: "quest", tone: "field" },
  { href: "/badges", label: "Badges", mark: "badge", tone: "plain" },
  { href: "/map", label: "View map", mark: "map", tone: "plain" },
  { href: "/outposts", label: "Outposts", mark: "flag", tone: "rust" },
];

export default function HomeScreen() {
  const cards = useAsync(() => data.getHomeCards(), []);
  const updates = useAsync(() => data.getUpdates(), []);

  return (
    <div
      className="relative flex h-dvh flex-col gap-3 overflow-hidden px-4"
      style={{
        paddingTop: "calc(env(safe-area-inset-top) + var(--s-4))",
        // Clears the nav button's square in the thumb corner, so the bottom
        // row of the grid is never sitting underneath it.
        paddingBottom: "calc(var(--tile) + var(--gutter) * 2 + env(safe-area-inset-bottom))",
      }}
    >
      {/* Updates run along the foot, in the strip beside the nav button that
          would otherwise be dead space. */}
      <div
        className="pointer-events-none absolute flex items-center"
        style={{
          left: "var(--gutter)",
          right: "calc(var(--gutter) + var(--tile) + var(--s-2))",
          bottom: "calc(var(--gutter) + env(safe-area-inset-bottom))",
          height: "var(--tile)",
        }}
      >
        <Marquee items={updates.data ?? []} className="w-full" />
      </div>
      <div className="shrink-0">
        <RankHeader initials="JD" name="Josh" rank={8} leaves={420} stars={12} />
      </div>

      {/* Fixed height rather than flexible. Cards hold their ratio off a known
          height, so a portrait card is the same size on every phone instead of
          swelling on a tall one. The band below absorbs the difference. */}
      <div className="h-[248px] shrink-0 sm:h-[300px]">
        <HomeCarousel cards={cards.data ?? []} loading={cards.loading} />
      </div>

      {/* Takes whatever height is left. Collapses to nothing on a short screen
          rather than pushing the grid off the bottom. */}
      <div className="min-h-0 flex-1">
        <HillsBand />
      </div>

      <nav aria-label="Shortcuts" className="grid shrink-0 grid-cols-2 gap-2">
        {TILES.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="flex h-[74px] flex-col items-center justify-center gap-1.5 border active:scale-[0.985]"
            style={{
              borderRadius: "var(--r-md)",
              transitionDuration: "var(--dur-tap)",
              background: t.tone === "field" ? "var(--field)"
                : t.tone === "rust" ? "var(--rust)" : "var(--surface)",
              color: t.tone === "plain" ? "var(--stone)" : "var(--field-ink)",
              borderColor: t.tone === "field" ? "var(--field)"
                : t.tone === "rust" ? "var(--rust)" : "var(--rule)",
            }}
          >
            <Mark name={t.mark} size={20} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em]">
              {t.label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
