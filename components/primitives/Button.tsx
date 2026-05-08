"use client";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "toggleOn";

interface BaseProps {
  variant?: Variant;
  fullWidth?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    BaseProps {}

const variantClass: Record<Variant, string> = {
  primary:
    "bg-primary text-white shadow-key hover:bg-primary-dark active:bg-primary-dark",
  secondary:
    "bg-[rgba(255,255,255,0.7)] text-text-primary border border-border hover:bg-card",
  ghost: "bg-transparent text-primary hover:bg-sage-light/60",
  toggleOn:
    "bg-sage-light text-primary border border-primary-light",
};

/** Primary system button — see design doc §4.2.
 *  Always `rounded-2xl` (16px), 14px vertical padding, weight 500, 200ms state. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    fullWidth = false,
    leadingIcon,
    trailingIcon,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      {...rest}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-medium",
        "transition-[background-color,transform,box-shadow] duration-200 ease-out",
        "active:scale-[0.97]",
        "disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed",
        fullWidth && "w-full",
        variantClass[variant],
        className,
      )}
    >
      {leadingIcon ? <span className="shrink-0">{leadingIcon}</span> : null}
      <span>{children}</span>
      {trailingIcon ? <span className="shrink-0">{trailingIcon}</span> : null}
    </button>
  );
});
