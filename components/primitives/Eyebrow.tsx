import { cn } from "@/lib/cn";

interface EyebrowProps extends React.HTMLAttributes<HTMLParagraphElement> {}

/** 10px Jakarta 600, 0.12em tracking, muted. See design doc §2.2. */
export function Eyebrow({ className, children, ...rest }: EyebrowProps) {
  return (
    <p {...rest} className={cn("eyebrow", className)}>
      {children}
    </p>
  );
}
