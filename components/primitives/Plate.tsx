"use client";
import Image from "next/image";
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
  sizes = "100vw",
  collapse = false,
}: {
  plate?: string;
  ratio?: "4/3" | "16/9" | "1/1";
  label?: string;
  className?: string;
  /** Fill the parent instead of holding a ratio. For slots whose height is
   *  already decided, like the media band on a home card. */
  fill?: boolean;
  /** How wide this slot actually renders, so the browser can pick a variant
   *  rather than pulling a full size plate into a thumbnail. Worth setting on
   *  anything narrower than the screen: a 72px slot taking the 1200px variant
   *  is most of the page weight for none of the detail. */
  sizes?: string;
  /** Render nothing at all when no artwork resolves, rather than holding an
   *  empty box. For places where the picture is a bonus and the type carries
   *  the screen on its own: a point that has no plate should read as finished,
   *  not as a card waiting for a photograph. We will not have artwork for
   *  every point in Ireland and the layout must not assume otherwise. */
  collapse?: boolean;
}) {
  /** Which extension we are on for this key. Derived rather than reset in an
   *  effect: if the key changes the recorded attempt no longer applies, so it
   *  starts again at zero without a render pass to clear it. */
  const [tried, setTried] = useState<{ key?: string; attempt: number }>({ attempt: 0 });
  const attempt = tried.key === plate ? tried.attempt : 0;
  const src = plate ? mediaSrc(plate, attempt) : null;

  /** Every candidate has 404ed, which is the ordinary state of a slot whose
   *  artwork has not been drawn yet. */
  const exhausted = Boolean(plate) && src === null;
  if (collapse && (!plate || exhausted)) return null;

  return (
    <div
      className={cn("relative flex items-center justify-center overflow-hidden border border-rule bg-surface", className)}
      style={{ aspectRatio: fill ? undefined : ratio.replace("/", " / "),
               borderRadius: "var(--r-md)" }}
    >
      {src ? (
        /*  Served through next/image rather than a bare tag. The plates are
            engravings with stipple all through them, which is close to worst
            case for PNG: the masters run to several megabytes each and none of
            that detail survives being drawn at a fraction of the size. This
            resizes and re-encodes per device, so the folder keeps the full
            quality original and the phone gets what fits. */
        <Image
          src={src}
          alt=""
          fill
          sizes={sizes}
          className="object-cover"
          onError={() => setTried({ key: plate, attempt: attempt + 1 })}
        />
      ) : (
        <Data className="px-2 text-center text-[9px] uppercase text-mute">
          {label ?? "Plate"}
        </Data>
      )}
    </div>
  );
}
