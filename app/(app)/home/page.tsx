"use client";
import Link from "next/link";
import { Mark, type MarkName } from "@/components/primitives/Marks";
import { RankHeader } from "@/components/shell/RankHeader";
import { HomeCarousel } from "@/components/domain/HomeCarousel";
import { HillsBand } from "@/components/domain/HillsBand";
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

  return (
    <div
      className="relative flex h-dvh flex-col gap-3 overflow-hidden px-4"
      style={{
        paddingTop: "calc(env(safe-area-inset-top) + var(--s-4))",
        // Clears the nav button's square in the thumb corner, so the bottom
        // row of the grid is never sitting underneath it.
        // No bottom padding: the countryside band runs all the way to the
        // screen edge and carries the space beside the nav button itself.
        paddingBottom: 0,
      }}
    >
      <div className="shrink-0">
        <RankHeader initials="JD" name="Josh" rank={8} leaves={420} stars={12} />
      </div>

      {/* Fixed height rather than flexible. Cards hold their ratio off a known
          height, so a card is the same size on every phone instead of swelling
          on a tall one. The band below absorbs the difference. */}
      <div className="h-[196px] shrink-0 sm:h-[232px]">
        <HomeCarousel cards={cards.data ?? []} loading={cards.loading} />
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

      {/* The countryside runs along the foot and down into the strip beside
          the nav button, which is the space the update ticker used to hold.
          Updates now live only in the drawer, where scrolling text belongs.
          This takes whatever height is left and collapses on a short screen
          rather than pushing the grid off the bottom. */}
      <div
        className="-mx-4 min-h-[72px] flex-1 overflow-hidden pt-3"
        style={{ paddingRight: "calc(var(--tile) + var(--gutter))" }}
      >
        <HillsBand />
      </div>
    </div>
  );
}
