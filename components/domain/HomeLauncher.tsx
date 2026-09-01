"use client";
import Link from "next/link";
import { Mark } from "@/components/primitives/Marks";
import { DESTS } from "@/lib/nav";

/** The 2×2 on Home. This is content, not navigation: the nav is the single
 *  button in the thumb corner on every screen, including this one. Home
 *  simply puts the four places you are most likely to be going within reach
 *  without opening anything. */
const TILES = ["/map", "/quests", "/badges", "/outposts"];

export function HomeLauncher() {
  const tiles = TILES.map((h) => DESTS.find((d) => d.href === h)!);
  return (
    <nav aria-label="Shortcuts" className="grid grid-cols-2" style={{ gap: "var(--tile-gap)" }}>
      {tiles.map((d, i) => (
        <Link
          key={d.href}
          href={d.href}
          className="relative flex flex-col items-center justify-center gap-2.5 border border-rule active:scale-[0.985]"
          style={{
            height: "var(--tile-lg)",
            borderRadius: "var(--r-md)",
            transitionDuration: "var(--dur-tap)",
            background: i === 0 ? "var(--field)" : i === 3 ? "var(--rust)" : "var(--surface)",
            color: i === 0 || i === 3 ? "var(--field-ink)" : "var(--stone)",
            borderColor: i === 0 ? "var(--field)" : i === 3 ? "var(--rust)" : "var(--rule)",
          }}
        >
          <Mark name={d.mark} size={26} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.09em]">{d.label}</span>
        </Link>
      ))}
    </nav>
  );
}
