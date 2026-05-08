"use client";
import Link from "next/link";
import { Bell } from "lucide-react";
import { CompassMark } from "@/components/marks/CompassMark";

interface HomeHeaderProps {
  /** Avatar initials for the placeholder disc, e.g. "LG". */
  initials?: string;
}

/** Top of the Home screen — compass + wordmark on the left, bell + avatar
 *  on the right. See design doc §5.1. */
export function HomeHeader({ initials = "LG" }: HomeHeaderProps) {
  return (
    <header className="flex items-center justify-between py-4">
      <Link href="/home" className="flex items-center gap-2">
        <CompassMark size={36} />
        <span className="font-display text-[15px] font-semibold leading-none text-text-primary">
          Side Quest
        </span>
      </Link>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Notifications"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-pop"
        >
          <Bell size={17} strokeWidth={1.8} className="text-text-secondary" />
        </button>
        <Link
          href="/profile"
          aria-label="Profile"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sage to-primary-light text-xs font-semibold text-white shadow-pop"
        >
          {initials}
        </Link>
      </div>
    </header>
  );
}
