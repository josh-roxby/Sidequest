"use client";
import { useEffect, useState } from "react";
import type { LatLng } from "@/data/types";

interface LiveState {
  position: LatLng | null;
  accuracyM: number | null;
  error: string | null;
}

const initialState: LiveState = {
  position: null,
  accuracyM: null,
  error: null,
};

export function useLiveLocation(active: boolean): LiveState {
  const [state, setState] = useState<LiveState>(initialState);

  useEffect(() => {
    if (!active) {
      setState(initialState);
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ ...initialState, error: "Browser doesn't support geolocation." });
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        // iOS occasionally returns Infinity / NaN — bail before they
        // ever reach the map.
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
        setState({
          position: { lat: latitude, lng: longitude },
          accuracyM: accuracy ?? null,
          error: null,
        });
      },
      (err) => setState((s) => ({ ...s, error: err.message })),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [active]);

  return state;
}
