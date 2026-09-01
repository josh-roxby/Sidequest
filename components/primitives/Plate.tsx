"use client";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { mediaSrc } from "@/lib/media";
import { Data } from "./Text";

/** Illustration slot. Holds its own space at the correct ratio before the
 *  artwork exists, so the layout never shifts when a plate lands.
 *
 *  Artwork lives in one folder and is referenced by key, never inlined as SVG
 *  path data, so the whole art direction can be swapped without touching a
 *  component. `lib/media.ts` owns the folder and the file naming.
 *  docs/design-system.md §H. */
export function Plate({
  plate,
  ratio = "4/3",
  label,
  className,
  fill = false,
}: {
  plate?: string;
  ratio?: "4/3" | "16/9" | "1/1";
  label?: string;
  className?: string;
  /** Fill the parent instead of holding a ratio. For slots whose height is
   *  already decided, like the media band on a home card. */
  fill?: boolean;
}) {
  return (
    <div
      className={cn("flex items-center justify-center overflow-hidden border border-rule bg-surface", className)}
      style={{ aspectRatio: fill ? undefined : ratio.replace("/", " / "),
               borderRadius: "var(--r-md)" }}
    >
      {/* Keyed on the plate so a new key remounts with a fresh attempt count
          rather than inheriting the last key's exhausted one. */}
      {plate ? <PlateImage key={plate} plate={plate} fallback={label} /> : <PlateLabel label={label} />}
    </div>
  );
}

/** Walks the extension list until a file answers. Every candidate failing is
 *  the ordinary case for a slot whose artwork has not been drawn yet, so it
 *  lands on the placeholder instead of a browser broken image glyph. */
function PlateImage({ plate, fallback }: { plate: string; fallback?: string }) {
  const [attempt, setAttempt] = useState(0);
  const src = mediaSrc(plate, attempt);

  if (!src) return <PlateLabel label={fallback} />;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="h-full w-full object-cover"
      onError={() => setAttempt((n) => n + 1)}
    />
  );
}

function PlateLabel({ label }: { label?: string }) {
  return (
    <Data className="px-2 text-center text-[9px] uppercase text-mute">
      {label ?? "Plate"}
    </Data>
  );
}
