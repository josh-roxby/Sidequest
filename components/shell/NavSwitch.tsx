"use client";
import { usePathname } from "next/navigation";
import { NavBar } from "./Nav";

/** Hub screens render <NavBlock /> inline in their own layout, where a
 *  full-width 2×2 launcher belongs. Everywhere else gets the compact bar
 *  fixed to the bottom, because vertical space is the constraint there. */
const HUBS = ["/home", "/quests"];

export function NavSwitch() {
  const pathname = usePathname();
  if (HUBS.includes(pathname)) return null;
  return <NavBar />;
}
