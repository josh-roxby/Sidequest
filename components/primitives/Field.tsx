import { cn } from "@/lib/cn";

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function Field({ label, hint, error, className, id, ...rest }: FieldProps) {
  const inputId = id ?? `f-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="t-label text-stone">{label}</label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${inputId}-d` : undefined}
        className={cn(
          "h-11 w-full rounded-none border bg-surface px-3 text-[15px] text-ink",
          "placeholder:text-mute",
          error ? "border-rust" : "border-ink",
          className,
        )}
        {...rest}
      />
      {error || hint ? (
        <p id={`${inputId}-d`} className={cn("t-small", error ? "text-rust" : "text-stone")}>
          {error ?? hint}
        </p>
      ) : null}
    </div>
  );
}
