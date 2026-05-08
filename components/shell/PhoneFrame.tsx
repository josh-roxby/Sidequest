import { cn } from "@/lib/cn";

interface PhoneFrameProps {
  children: React.ReactNode;
  className?: string;
}

/** Mobile: full-bleed (returns children directly).
 *  Desktop (≥768px): centred 400px wide container, 44px corner radius,
 *  1px border, drop shadow, against a radial paper background.
 *  See design doc §3.1. */
export function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div
      className="min-h-dvh bg-bg md:flex md:items-center md:justify-center md:py-10"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at top, rgba(216,190,133,0.06), transparent 60%), radial-gradient(ellipse at bottom, rgba(94,125,97,0.06), transparent 50%)",
      }}
    >
      <div
        className={cn(
          "relative mx-auto w-full bg-bg",
          "md:w-[400px] md:overflow-hidden md:rounded-[44px] md:border md:border-[#cbc5b3] md:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.30)]",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
