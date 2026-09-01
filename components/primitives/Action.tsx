import { cn } from "@/lib/cn";

type ActionTone = "field" | "rust" | "outline";

interface ActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ActionTone;
  loading?: boolean;
}

const TONE: Record<ActionTone, string> = {
  field:   "bg-field text-field-ink",
  rust:    "bg-rust text-field-ink",
  outline: "bg-transparent text-ink shadow-[inset_0_0_0_1px_var(--ink)]",
};

/** The primary action. THE ONLY ROUNDED COMPONENT IN THE CODEBASE.
 *
 *  In an interface with no other curves a pill is impossible to miss, which
 *  makes shape semantic: round means "this is the action on this screen".
 *  One per screen, always full width, always at the foot of a frame or page.
 *
 *  `rounded-full` must not appear in any other file. See CLAUDE.md and
 *  docs/design-system.md §A-3. */
export function Action({
  tone = "field",
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: ActionProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "w-full rounded-full border-0 px-5 text-[14px] font-semibold tracking-[0.01em]",
        "flex items-center justify-center gap-2",
        "transition-transform active:scale-[0.985] disabled:opacity-45",
        TONE[tone],
        className,
      )}
      style={{ height: "var(--action-h)", transitionDuration: "var(--dur-tap)" }}
      {...rest}
    >
      {loading ? <LoadingMark inverse={tone !== "outline"} /> : null}
      {children}
    </button>
  );
}

/** A 16px square stepping 90° at a time. Never a spinner — a spinner is the
 *  single most generic element in mobile UI and this system can afford its
 *  own. docs/design-system.md §D-2. */
export function LoadingMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <span
      aria-hidden
      className="inline-block h-4 w-4 border"
      style={{
        borderColor: inverse ? "var(--field-ink)" : "var(--ink)",
        animation: "sq-rotate-step 2.4s steps(1, end) infinite",
      }}
    />
  );
}
