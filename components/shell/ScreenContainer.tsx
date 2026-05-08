import { cn } from "@/lib/cn";

interface ScreenContainerProps {
  children: React.ReactNode;
  /** Drop padding-bottom — useful for screens whose content is fully
   *  absolute-positioned (e.g. the map). */
  flush?: boolean;
  className?: string;
}

/** Per-screen wrapper. Vertical scroll, 20px horizontal padding, 128px
 *  bottom padding to clear the floating nav. See design doc §3.3. */
export function ScreenContainer({
  children,
  flush = false,
  className,
}: ScreenContainerProps) {
  return (
    <div
      className={cn(
        "min-h-dvh px-5",
        flush ? "pb-0" : "pb-32",
        className,
      )}
    >
      {children}
    </div>
  );
}
