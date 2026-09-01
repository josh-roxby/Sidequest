import { cn } from "@/lib/cn";
import { Data } from "./Text";

/** Illustration slot. Holds its own space at the correct ratio before the
 *  artwork exists, so the layout never shifts when a plate lands.
 *
 *  Artwork lives in /public/plates/ and is referenced by key, never inlined as
 *  SVG path data, so the whole art direction can be swapped without touching a
 *  component. docs/design-system.md §H. */
export function Plate({
  plate,
  ratio = "4/3",
  label,
  className,
}: {
  plate?: string;
  ratio?: "4/3" | "16/9" | "1/1";
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center justify-center overflow-hidden border border-rule bg-surface", className)}
      style={{ aspectRatio: ratio.replace("/", " / "), borderRadius: "var(--r-md)" }}
    >
      {plate ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/plates/${plate}.png`} alt="" className="h-full w-full object-cover" />
      ) : (
        <Data className="px-2 text-center text-[9px] uppercase text-mute">
          {label ?? "Plate"}
        </Data>
      )}
    </div>
  );
}
