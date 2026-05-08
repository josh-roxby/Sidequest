import { cn } from "@/lib/cn";

type PillTone = "neutral" | "primary" | "lavender" | "gold";

interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
  leadingIcon?: React.ReactNode;
}

const toneClass: Record<PillTone, string> = {
  neutral: "bg-card text-text-primary border-border",
  primary: "bg-sage-light text-primary border-primary-light",
  lavender: "bg-lavender-soft text-lavender-deep border-lavender",
  gold: "bg-gold-faint text-gold-deep border-gold-soft",
};

/** Inline pill — small badge / chip. Used for distance indicators,
 *  reward chips, status, etc. */
export function Pill({
  tone = "neutral",
  leadingIcon,
  className,
  children,
  ...rest
}: PillProps) {
  return (
    <span
      {...rest}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
        toneClass[tone],
        className,
      )}
    >
      {leadingIcon ? <span className="shrink-0">{leadingIcon}</span> : null}
      {children}
    </span>
  );
}
