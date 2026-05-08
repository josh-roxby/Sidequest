"use client";
import { useState } from "react";
import { cn } from "@/lib/cn";

interface IllustrationProps {
  src: string;
  fallback: React.ReactNode;
  alt: string;
  className?: string;
}

/** Renders the painted asset at `src`; falls back to the SVG component
 *  if the file isn't there. See design doc §7. Lets painted artwork
 *  be added incrementally without breaking the prototype. */
export function Illustration({ src, fallback, alt, className }: IllustrationProps) {
  const [errored, setErrored] = useState(false);
  if (errored) return <>{fallback}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn("block h-full w-full object-cover", className)}
      onError={() => setErrored(true)}
    />
  );
}
