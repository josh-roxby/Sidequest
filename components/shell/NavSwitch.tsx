"use client";
import { usePathname } from "next/navigation";
import { ThumbBlock } from "./Nav";

/** Home renders <NavBlock /> inline as a full-width launcher, so it gets no
 *  floating nav. Every other screen gets the compact 2×2 in the thumb corner.
 *  docs/design-system.md §C. */
export function NavSwitch() {
  const pathname = usePathname();
  if (pathname === "/home") return null;
  return <ThumbBlock />;
}
