"use client";
import { useEffect, useState } from "react";
import { streetsAround } from "@/lib/map/tiles";
import { recutQuest } from "@/lib/quest/recut";
import type { Quest } from "@/lib/data";

/** Drawing a written walk on the streets it actually runs along.
 *
 *  Every walk in the corpus was drawn as an arc across the ground, because the
 *  machine that builds the corpus cannot reach a tile host or an OSM endpoint.
 *  So the line is re-cut here, against the same router a generated walk uses,
 *  and against the same streets: fetched and decoded from the tiles rather
 *  than read off whatever map happens to be on screen.
 *
 *  It used to wait for a MapLibre map to be ready and then query it, which
 *  tied the line to a renderer, to a device's WebGL limits, and to a readiness
 *  flag that answers the wrong question. Tiles are files, so none of that
 *  applies and the re-cut starts the moment the walk is known.
 *
 *  Until it lands the written line stands and the screen says so, so nothing
 *  waits on the network to show something. */
export function useRoutedQuest(quest: Quest | null): Quest | null {
  const [routed, setRouted] = useState<Quest | null>(null);

  /* On the walk's identity, not the object: re-cutting sets state, and
     depending on `quest` would route the walk it just produced. */
  const id = quest?.id ?? null;
  useEffect(() => {
    if (!quest) return;
    let live = true;

    const start = quest.start ?? { lat: quest.path[0][1], lng: quest.path[0][0] };
    /* The ground the walk covers, not the ground it is drawn on: a walk of a
       given length never reaches further than about half of it from the
       start. A floor under that, because a short walk still wants a junction
       or two around it to route through. */
    void streetsAround(start, Math.max(1500, quest.distanceM * 0.6))
      .then((streets) => { if (live) setRouted(recutQuest(quest, streets)); });

    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* Keyed on id so a re-cut walk is never shown under another walk's heading,
     which is what happens when a screen moves between two of them and the
     second arrives before the first has finished routing. */
  return routed?.id === id ? routed : quest;
}
