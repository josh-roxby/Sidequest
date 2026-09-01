"use client";
import { Action } from "@/components/primitives/Action";
import { cn } from "@/lib/cn";
import { useHanded } from "@/lib/settings";

/** A screen's primary action, docked in the strip beside the nav button.
 *
 *  That strip is the width of the screen minus one 56px square, and on most
 *  screens it is empty. Putting the main action there means it is always in
 *  the thumb's reach without scrolling to find it, and it never fights the nav
 *  button because it stops exactly where the button starts.
 *
 *  Pages using this must add the matching bottom padding, which `Screen` does
 *  through its `docked` prop, so the last row of content is not underneath it. */
export function ThumbAction({
  children,
  onClick,
  tone = "field",
  loading,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: "field" | "rust" | "outline";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const handed = useHanded();
  return (
    <div
      className={cn("fixed z-40 flex items-center", className)}
      style={{
        left: handed === "left" ? "calc(var(--gutter) + var(--tile) + var(--s-2))" : "var(--gutter)",
        right: handed === "left" ? "var(--gutter)" : "calc(var(--gutter) + var(--tile) + var(--s-2))",
        bottom: "calc(var(--gutter) + env(safe-area-inset-bottom))",
        height: "var(--tile)",
      }}
    >
      <Action tone={tone} loading={loading} disabled={disabled} onClick={onClick}>
        {children}
      </Action>
    </div>
  );
}
