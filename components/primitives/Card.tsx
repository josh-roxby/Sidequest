import { cn } from "@/lib/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Rust corner ribbon. Marks a quest as active or starred. */
  flag?: boolean;
  inset?: boolean;
}

export function Card({ flag, inset = true, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden border border-rule bg-surface",
        inset && "p-3.5",
        className,
      )}
      style={{ borderRadius: "var(--r-md)" }}
      {...rest}
    >
      {flag ? (
        <span
          aria-hidden
          className="absolute right-0 top-0 flex h-8 w-7 items-end justify-center bg-rust pb-1 text-[11px] text-field-ink"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)" }}
        >
          ★
        </span>
      ) : null}
      {children}
    </div>
  );
}

/** Dashed rust box for content that is locked, timed, or not yet available.
 *  Distinct from an error: nothing is wrong, there is just something to wait
 *  for or go and do. */
export function LockedCallout({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div
      className="flex items-start gap-2.5 border border-dashed border-rust px-3.5 py-3"
      style={{ borderRadius: "var(--r-md)", background: "var(--rust-soft)" }}
    >
      <span aria-hidden className="t-data mt-px shrink-0 text-rust">+</span>
      <div>
        <p className="t-data text-[12px] uppercase text-rust">{title}</p>
        {hint ? <p className="t-small mt-0.5 text-rust opacity-80">{hint}</p> : null}
      </div>
    </div>
  );
}
