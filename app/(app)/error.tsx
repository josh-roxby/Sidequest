"use client";
import { useEffect } from "react";
import { Action } from "@/components/primitives/Action";

/** The screen that must never be blank.
 *
 *  Somebody two kilometres into a walk, holding a phone that has gone white,
 *  is the worst failure this app has. Next's default for an uncaught render
 *  error is exactly that, and nothing here caught one until now.
 *
 *  So it says what happened in words, offers the one useful thing, and above
 *  all says that the ground they have covered is still recorded, because that
 *  is the question somebody in that position actually has. */
export default function AppError({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    /* The console is all there is until there is somewhere to send these.
       A crash reporter is a third party and a bill, so it waits. */
    console.error("[screen]", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-[var(--gutter)] text-center">
      <h1 className="t-h1 text-ink">This screen stopped</h1>
      <p className="t-body selectable max-w-[36ch] text-stone">
        Something went wrong drawing it. The ground you have walked is saved on
        this device and is not affected.
      </p>
      <div className="flex gap-2">
        <Action onClick={reset}>Try again</Action>
        <Action tone="outline" onClick={() => { window.location.href = "/map"; }}>
          Back to the map
        </Action>
      </div>
    </div>
  );
}
