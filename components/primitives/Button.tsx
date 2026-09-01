import { cn } from "@/lib/cn";

type ButtonTone = "solid" | "outline" | "quiet";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ButtonTone;
}

const TONE: Record<ButtonTone, string> = {
  solid:   "bg-ink text-surface border-ink",
  outline: "bg-surface text-ink border-ink active:bg-field-soft",
  quiet:   "bg-transparent text-stone border-rule active:bg-surface-2",
};

/** Square button. Inline, in rows, in toolbars. Never full width, so it can
 *  never be mistaken for the action pill. */
export function Button({ tone = "outline", className, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-[--r-sm] border px-3.5 text-[12px] font-semibold uppercase tracking-[0.05em]",
        "inline-flex items-center justify-center gap-1.5",
        "transition-transform active:scale-[0.97] disabled:opacity-45",
        TONE[tone],
        className,
      )}
      style={{ height: "var(--btn-h)", transitionDuration: "var(--dur-tap)" }}
      {...rest}
    />
  );
}
