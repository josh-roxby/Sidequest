"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Action } from "@/components/primitives/Action";
import { Data, Label } from "@/components/primitives/Text";
import { PhoneFrame } from "@/components/shell/PhoneFrame";

type Phase = "idle" | "requesting" | "waiting" | "denied" | "unsupported";

/** The highest-risk screen in the product: a denied prompt on mobile Safari
 *  is effectively unrecoverable. Three rules, all load-bearing.
 *
 *  1. Geolocation is NEVER called on mount, on navigation, or anywhere but
 *     the button below.
 *  2. "Pick a place on the map instead" is a full-width pill directly under
 *     it, not a text link. It is a first-class path, not a consolation.
 *  3. A fix worse than 100m does not advance. A 2km-accurate fix planning a
 *     walk from the wrong side of town is a trust-killer.
 *
 *  docs/ux-loops.md §B-2. */
export default function StartScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [accuracy, setAccuracy] = useState<number | null>(null);

  function requestLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPhase("unsupported");
      return;
    }
    setPhase("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const acc = pos.coords.accuracy;
        setAccuracy(acc);
        if (acc <= 100) router.push("/map");
        else setPhase("waiting");
      },
      (err) => setPhase(err.code === err.PERMISSION_DENIED ? "denied" : "unsupported"),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }

  return (
    <PhoneFrame>
      <div className="flex min-h-dvh flex-col px-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + var(--s-8))",
                 paddingBottom: "calc(env(safe-area-inset-bottom) + var(--s-8))" }}>
        <Label>Before we start</Label>
        <h1 className="t-h1 mt-2.5 text-ink">Where are you walking from?</h1>

        <p className="t-body mt-3 max-w-[34ch] text-stone">
          Your location picks the walks near you. We store the map squares you
          reveal, never the path you took, so nothing here can be replayed as a
          route.
        </p>

        {phase === "waiting" ? (
          <div className="mt-5 border border-rule bg-surface p-3">
            <p className="t-small text-ink">Still getting a fix.</p>
            <Data className="mt-1 block text-stone">
              ACCURATE TO {accuracy ? Math.round(accuracy) : "—"} M · NEED 100 M
            </Data>
          </div>
        ) : null}

        {phase === "denied" ? (
          <div className="mt-5 border border-rust bg-rust-soft p-3">
            <p className="t-small text-ink">
              Location is blocked for this site. Open your browser settings for
              this page and allow location, then come back. Or pick a place on
              the map instead, which works just as well.
            </p>
          </div>
        ) : null}

        {phase === "unsupported" ? (
          <div className="mt-5 border border-rule bg-surface p-3">
            <p className="t-small text-ink">
              This device cannot share a location. Pick a place on the map instead.
            </p>
          </div>
        ) : null}

        <div className="mt-auto flex flex-col gap-2 pt-8">
          {phase !== "denied" && phase !== "unsupported" ? (
            <Action loading={phase === "requesting"} onClick={requestLocation}>
              {phase === "requesting" ? "Waiting for your phone" : "Use my location"}
            </Action>
          ) : null}
          <Action tone="outline" onClick={() => router.push("/map")}>
            Pick a place on the map
          </Action>
        </div>
      </div>
    </PhoneFrame>
  );
}
