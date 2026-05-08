import { cn } from "@/lib/cn";

interface EyebrowProps extends Omit<React.HTMLAttributes<HTMLParagraphElement>, "children"> {
  children: string;
}

/** 10px Jakarta 600, 0.12em tracking, muted. See design doc §2.2.
 *  Auto-prepends the `// ` design-system prefix so callers pass plain
 *  labels: `<Eyebrow>YOUR JOURNEY</Eyebrow>` renders `// YOUR JOURNEY`. */
export function Eyebrow({ className, children, ...rest }: EyebrowProps) {
  return (
    <p {...rest} className={cn("eyebrow", className)}>
      {`// ${children}`}
    </p>
  );
}
