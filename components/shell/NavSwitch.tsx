"use client";
import { NavButton } from "./NavButton";

/** One button on every screen. Kept as its own component so the shell stays a
 *  server component and only the nav ships as client JavaScript. */
export function NavSwitch() {
  return <NavButton />;
}
