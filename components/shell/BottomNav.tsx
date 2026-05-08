"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Compass, Home, Map, User } from "lucide-react";
import { cn } from "@/lib/cn";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}

const items: NavItem[] = [
  { href: "/home",    label: "Home",    icon: Home },
  { href: "/map",     label: "Map",     icon: Map },
  { href: "/quests",  label: "Quests",  icon: Compass },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/profile", label: "Profile", icon: User },
];

/** Floating pill bottom nav — see design doc §3.4. White at 92% opacity,
 *  backdrop-blur, soft shadow. Active item gets a sage fill on the icon
 *  container only; the label sits outside the circle and recolours to
 *  --primary. Inset 12px from edges. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between rounded-full border border-border bg-[rgba(255,255,255,0.92)] px-3 py-3 shadow-lifted backdrop-blur-[14px]"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200",
                active ? "bg-sage" : "bg-transparent",
              )}
            >
              <Icon
                size={17}
                strokeWidth={active ? 2.2 : 1.8}
                className={active ? "text-primary" : "text-text-muted"}
              />
            </span>
            <span
              className={cn(
                "text-[9px] font-medium tracking-wide transition-colors duration-200",
                active ? "text-primary" : "text-text-muted",
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
