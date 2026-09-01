"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mark } from "@/components/primitives/Marks";
import { Marquee } from "@/components/primitives/Marquee";
import { Frame } from "./Frame";
import { data } from "@/lib/data";
import { useAsync } from "@/hooks/use-async";
import { DESTS } from "@/lib/nav";
import { cn } from "@/lib/cn";

/** The complete map of the app, in a square drawer.
 *
 *  Reuses <Frame>, which means the drawer's dismiss control lands on exactly
 *  the square the nav button occupied. Tap the button to open, tap the same
 *  spot to close: the thumb never travels. docs/design-system.md §B-4.
 *
 *  Bento rather than a flat grid: the two destinations you reach for in every
 *  session get double the target, the other six sit beneath as a 3×2.
 *
 *  Nothing scrolls. The tile rows divide whatever height the square gives them
 *  rather than carrying fixed heights, so the grid holds its proportions on a
 *  small phone instead of overflowing and turning the drawer into a list. */
export function NavDrawer({ open, onDismiss }: { open: boolean; onDismiss: () => void }) {
  const pathname = usePathname();
  const [primary, secondary] = [DESTS.slice(0, 2), DESTS.slice(2)];
  const updates = useAsync(() => data.getUpdates(), []);

  return (
    <Frame
      open={open}
      onDismiss={onDismiss}
      label="Go to"
      title="Side Quest"
      scroll={false}
      footerLeft={<Marquee items={updates.data ?? []} className="w-full" />}
      headerRight={
        // Home is not one of the eight tiles, because it is the shell the
        // tiles sit on rather than a peer of them. It still needs a way back,
        // so it takes the header's spare corner at a size that cannot compete
        // with the grid below.
        <Link
          href="/home"
          onClick={onDismiss}
          aria-label="Home"
          aria-current={pathname === "/home" ? "page" : undefined}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center border active:scale-[0.96]",
            pathname === "/home"
              ? "border-field bg-field text-field-ink"
              : "border-rule bg-surface text-stone",
          )}
          style={{ borderRadius: "var(--r-sm)", transitionDuration: "var(--dur-tap)" }}
        >
          <Mark name="home" size={16} />
        </Link>
      }
    >
      <div className="flex h-full flex-col gap-2">
        <div className="grid min-h-0 flex-[1.15] grid-cols-2 gap-2">
          {primary.map((d) => {
            const on = pathname === d.href;
            return (
              <Link
                key={d.href}
                href={d.href}
                onClick={onDismiss}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex flex-col justify-between border p-3 active:scale-[0.98]",
                  on ? "border-field bg-field text-field-ink" : "border-rule bg-surface text-ink",
                )}
                style={{ borderRadius: "var(--r-md)", transitionDuration: "var(--dur-tap)" }}
              >
                <Mark name={d.mark} size={20} />
                <span>
                  <span className="block text-[12px] font-semibold uppercase tracking-[0.06em]">
                    {d.label}
                  </span>
                  <span className={cn("block text-[10px] leading-tight", on ? "opacity-75" : "text-stone")}>
                    {d.blurb}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        <div className="grid min-h-0 flex-[2] grid-cols-3 grid-rows-2 gap-2">
          {secondary.map((d) => {
            const on = pathname === d.href;
            return (
              <Link
                key={d.href}
                href={d.href}
                onClick={onDismiss}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex min-h-0 flex-col items-center justify-center gap-1 border px-1 text-center active:scale-[0.98]",
                  on ? "border-field bg-field text-field-ink" : "border-rule bg-surface text-stone",
                )}
                style={{ borderRadius: "var(--r-md)", transitionDuration: "var(--dur-tap)" }}
              >
                <Mark name={d.mark} size={17} />
                <span className="text-[9px] font-semibold uppercase leading-none tracking-[0.06em]">
                  {d.label}
                </span>
                {/* The blurb replaces the tooltip that used to sit here. A
                    question mark on every tile is a control the user has to
                    dismiss before they can do the thing they opened the drawer
                    for; the answer fits on the tile, so it belongs on it. */}
                <span className={cn("text-[8px] leading-tight", on ? "opacity-70" : "text-mute")}>
                  {d.blurb}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </Frame>
  );
}
