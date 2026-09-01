import { cn } from "@/lib/cn";

/** Uppercase section label. 11px/600/0.08em. */
export function Label({ className, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("t-label text-stone", className)} {...rest} />;
}

/** Every number in the app goes through here. Mono, tabular, so columns of
 *  digits line up and a changing value doesn't reflow its neighbours.
 *  docs/design-system.md §A-2-1. */
export function Data({
  size = "md",
  className,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement> & { size?: "md" | "lg" | "xl" }) {
  return (
    <span
      className={cn(
        size === "xl" ? "t-data-xl" : size === "lg" ? "t-data-lg" : "t-data",
        className,
      )}
      {...rest}
    />
  );
}

export function Rule({ strong = false, className }: { strong?: boolean; className?: string }) {
  return (
    <hr
      className={cn("h-px w-full border-0", strong ? "bg-ink" : "bg-rule", className)}
      aria-hidden
    />
  );
}
