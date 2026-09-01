import { cn } from "@/lib/cn";

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function Chip({ active = false, className, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "h-7 rounded-[--r-sm] border px-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]",
        active ? "border-ink bg-field-soft text-ink" : "border-rule bg-surface text-stone",
        className,
      )}
      style={{ transition: "background-color var(--dur-state) var(--ease)" }}
      {...rest}
    />
  );
}
