"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Action } from "@/components/primitives/Action";
import { Button } from "@/components/primitives/Button";
import { Mark } from "@/components/primitives/Marks";
import { Data, Label } from "@/components/primitives/Text";
import { Frame } from "@/components/shell/Frame";
import { QuestGenerating } from "@/components/domain/QuestGenerating";
import type { LatLng } from "@/lib/data";
import { distanceM } from "@/lib/geo";
import { directionsUrl } from "@/lib/maps";
import { formatDistance } from "@/lib/walking";

/** How close counts as being at the start. Generous on purpose: a fix in a
 *  valley or under trees is routinely out by fifty metres, and sending someone
 *  to an outpost they are already standing at is worse than starting a walk a
 *  street away from its first step. */
const AT_START_M = 400;

type Phase = "idle" | "locating" | "away" | "going";

/** Takes a walker from a decision to a walk, and stops on the way only if they
 *  are not where the walk starts.
 *
 *  Geolocation is requested here and nowhere else in this flow: the browser
 *  prompt fires on a press, never on load. docs/ux-loops.md §B-2. A quest with
 *  no fixed start skips the check entirely, because a generated walk begins
 *  wherever you are. */
export function StartGate({
  questId,
  start,
  startName,
  label = "Start this quest",
}: {
  questId: string;
  start?: LatLng;
  startName?: string;
  label?: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [awayM, setAwayM] = useState<number | null>(null);

  const walk = () => setPhase("going");

  function press() {
    if (!start) return walk();
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      // No fix available is not a reason to block a walk. Show the way to the
      // start rather than refusing to begin.
      setAwayM(null);
      setPhase("away");
      return;
    }
    setPhase("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // iOS occasionally returns non-finite coordinates. Treat that as no
        // fix rather than as a distance of NaN metres.
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          setAwayM(null);
          setPhase("away");
          return;
        }
        const away = distanceM({ lat: latitude, lng: longitude }, start);
        if (away <= AT_START_M) return walk();
        setAwayM(away);
        setPhase("away");
      },
      () => { setAwayM(null); setPhase("away"); },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 },
    );
  }

  return (
    <>
      <Action onClick={press} loading={phase === "locating"}>
        {phase === "locating" ? "Finding you" : label}
      </Action>

      {/* The loading takeover runs to its own end and then puts the walker on
          the map. Landing back on a card to tap would make the wait read as a
          step rather than the start of something. */}
      {phase === "going" ? (
        <QuestGenerating onDone={() => router.push(`/quests/${questId}/walk`)} />
      ) : null}

      <Frame
        open={phase === "away"}
        onDismiss={() => setPhase("idle")}
        label={awayM === null ? "No fix" : `${formatDistance(awayM)} away`}
        title="This one starts elsewhere"
        action={
          start ? (
            <Button tone="solid" onClick={() => window.open(directionsUrl(start, startName), "_blank", "noopener")}>
              <Mark name="compass" size={14} /> Navigate to outpost
            </Button>
          ) : null
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5 text-stone">
            <Mark name="flag" size={13} />
            <Data className="text-[10px] uppercase">{startName ?? "The start"}</Data>
          </div>
          <p className="t-body text-ink">
            {awayM === null
              ? "We could not place you, so we cannot tell how far off you are. The start is below if you want to make your own way."
              : `You are about ${formatDistance(awayM)} from where this walk begins. It is worth getting there first: the route and everything on it is built around that start.`}
          </p>
          <p className="t-small text-stone">
            Directions open in your own maps app. Nothing about where you are is
            sent anywhere by us.
          </p>
          <Label className="mt-1 block">Or start anyway</Label>
          <Button tone="quiet" onClick={walk}>Walk from here</Button>
        </div>
      </Frame>
    </>
  );
}
