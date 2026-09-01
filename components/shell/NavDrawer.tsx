"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mark } from "@/components/primitives/Marks";
import { Frame } from "./Frame";
import { DESTS } from "@/lib/nav";
import { cn } from "@/lib/cn";

/** The complete map of the app, in a square drawer.
 *
 *  Reuses <Frame>, which means the drawer's dismiss control lands on exactly
 *  the square the nav button occupied. Tap the button to open, tap the same
 *  spot to close: the thumb never travels. docs/design-system.md §B-4.
 *
 *  Bento rather than a flat grid: the two destinations you reach for on every
 *  session get twice the target, the other six sit beneath as a 3×2. */
export function NavDrawer({ open, onDismiss }: { open: boolean; onDismiss: () => void }) {
  const pathname = usePathname();
  const [primary, secondary] = [DESTS.slice(0, 2), DESTS.slice(2)];

  return (
    <Frame open={open} onDismiss={onDismiss} label="Go to" title="Side Quest">
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          {primary.map((d) => {
            const on = pathname === d.href;
            return (
              <Link
                key={d.href}
                href={d.href}
                onClick={onDismiss}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex h-[86px] flex-col justify-between border p-3 active:scale-[0.98]",
                  on ? "border-field bg-field text-field-ink" : "border-rule bg-surface text-ink",
                )}
                style={{ borderRadius: "var(--r-md)", transitionDuration: "var(--dur-tap)" }}
              >
                <Mark name={d.mark} size={20} />
                <span>
                  <span className="block text-[12px] font-semibold uppercase tracking-[0.06em]">
                    {d.label}
                  </span>
                  <span className={cn("block text-[10px]", on ? "opacity-75" : "text-stone")}>
                    {d.blurb}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {secondary.map((d) => {
            const on = pathname === d.href;
            return (
              <Link
                key={d.href}
                href={d.href}
                onClick={onDismiss}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex h-[68px] flex-col items-center justify-center gap-1.5 border active:scale-[0.98]",
                  on ? "border-field bg-field text-field-ink" : "border-rule bg-surface text-stone",
                )}
                style={{ borderRadius: "var(--r-md)", transitionDuration: "var(--dur-tap)" }}
              >
                <Mark name={d.mark} size={17} />
                <span className="text-[9px] font-semibold uppercase tracking-[0.06em]">
                  {d.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </Frame>
  );
}
