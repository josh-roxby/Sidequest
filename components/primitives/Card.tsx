import { cn } from "@/lib/cn";

type CardVariant = "soft" | "lg";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  /** Adds 20px (vs 16px) interior padding for hero cards. */
  hero?: boolean;
}

/** Base card surface — see design doc §4.1.
 *  - `soft` (default): 24px radius
 *  - `lg`: 28px radius, used for hero blocks (home hero, current quest, profile hero)
 */
export function Card({
  variant = "soft",
  hero = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      {...rest}
      className={cn(
        "border border-border bg-[rgba(255,255,255,0.92)] backdrop-blur-[8px] shadow-soft",
        variant === "lg" ? "rounded-[28px]" : "rounded-[24px]",
        hero ? "p-5" : "p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
