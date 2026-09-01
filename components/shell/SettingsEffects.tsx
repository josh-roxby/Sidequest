"use client";
import { useEffect } from "react";
import { useSettings } from "@/lib/settings";

/** Applies the settings that are expressed as document state rather than as
 *  component props: the in-app reduce-motion switch, which has to reach every
 *  animation including ones inside third party markup. */
export function SettingsEffects() {
  const { reduceMotion } = useSettings();
  useEffect(() => {
    const el = document.documentElement;
    if (reduceMotion) el.setAttribute("data-reduce-motion", "1");
    else el.removeAttribute("data-reduce-motion");
  }, [reduceMotion]);
  return null;
}
