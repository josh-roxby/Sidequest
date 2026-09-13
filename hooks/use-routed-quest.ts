"use client";
import { useCallback, useEffect, useState, type RefObject } from "react";
import type { MapViewHandle } from "@/components/map/MapView";
import { recutQuest } from "@/lib/quest/recut";
import type { Quest } from "@/lib/data";

/** Drawing a written walk on the streets the walker has in front of them.
 *
 *  Every walk in the corpus was drawn as an arc across the ground, because the
 *  corpus is built on a machine that cannot reach a tile host or an OSM
 *  endpoint. The phone can, so the line is re-cut here against the same router
 *  a generated walk uses. One kind of line on the map, whoever wrote the walk.
 *
 *  Until the ways arrive the written line stands, so the screen is never empty
 *  and never waits on the network to show a route. When they arrive the line is
 *  replaced under the walker, which is a change they are meant to see: it is
 *  the walk becoming followable. */
export function useRoutedQuest(
  quest: Quest | null,
  mapRef: RefObject<MapViewHandle | null>,
): { quest: Quest | null; onMapReady: () => void } {
  const [mapReady, setMapReady] = useState(false);
  const [routed, setRouted] = useState<Quest | null>(null);
  const onMapReady = useCallback(() => setMapReady(true), []);

  /* The walk and the basemap arrive independently and in either order: mock
     data answers before the map has a tile, live data will not. So this waits
     on both rather than hanging off whichever happened to be second. */
  const id = quest?.id ?? null;
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !quest || !map) return;
    let live = true;

    /* Waited for, not swept for. The screen showing a walk is already framed
       on that walk, so the tiles holding its streets are the tiles already on
       their way, and moving the camera to collect them would judder the view
       in front of the walker for ground that was coming anyway. */
    void map.streetsWhenLoaded()
      .then((streets) => { if (live) setRouted(recutQuest(quest, streets)); });

    return () => { live = false; };
    /* On the walk's identity, not the object: re-cutting sets state, and
       depending on `quest` would route the walk it just produced. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, id]);

  /* Keyed on id so a re-cut walk is never shown under another walk's heading,
     which is what happens when a screen moves between two of them and the
     second arrives before the first has finished routing. */
  return { quest: routed?.id === id ? routed : quest, onMapReady };
}
