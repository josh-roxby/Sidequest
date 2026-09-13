"use client";
import { Action } from "@/components/primitives/Action";
import { Mark } from "@/components/primitives/Marks";
import { Frame } from "@/components/shell/Frame";

/** Asks before the browser does.
 *
 *  A permission prompt with no context in front of it gets refused, and a
 *  refusal is close to permanent: browsers remember a no, and most people
 *  never find the setting that undoes it. So the one press that matters gets
 *  a sentence first saying what the location is for and what happens to it.
 *
 *  This is shown once. Having agreed, the walker presses the same control and
 *  goes straight to the browser prompt from then on. docs/ux-loops.md §B-2. */
export function LocationGate({
  open,
  onDismiss,
  onAllow,
}: {
  open: boolean;
  onDismiss: () => void;
  onAllow: () => void;
}) {
  return (
    <Frame open={open} onDismiss={onDismiss} label="Location" title="Where you are">
      {/* Kept short on purpose. A frame is a fixed square and this copy has to
          fit inside one without scrolling: a consent screen whose first line
          is cut off is not consent. */}
      <div className="selectable space-y-3 px-1">
        <p className="text-[14px] leading-snug text-ink">
          So the map can place you, show which way you are facing, and unlock
          ground as you walk.
        </p>

        <ul className="space-y-1.5">
          {[
            ["target", "Stays on your device."],
            ["compass", "Heading needs a compass, and works without one."],
            ["grid", "Tiles unlock as you cross them."],
          ].map(([glyph, line]) => (
            <li key={line} className="flex items-center gap-2.5">
              <span className="shrink-0 text-stone">
                <Mark name={glyph as "target"} size={14} />
              </span>
              <span className="text-[13px] leading-snug text-stone">{line}</span>
            </li>
          ))}
        </ul>

        <p className="text-[12px] leading-snug text-mute">
          Say no and the map still works.
        </p>

        <Action tone="field" onClick={onAllow} className="w-full">
          Use my location
        </Action>
      </div>
    </Frame>
  );
}
