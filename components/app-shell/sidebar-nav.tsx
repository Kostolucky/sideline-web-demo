"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sidebarItems, isActive } from "./nav-items";
import { cn } from "@/lib/utils";

/**
 * Desktop/tablet left-rail navigation.
 *
 * No longer takes a role: every member sees the same destinations, and only the
 * contents of those screens differ.
 */
export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {sidebarItems().map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand-tint text-brand-text"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              item.primary && !active && "text-foreground",
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
            {item.label}
            {item.primary && (
              <span className="ml-auto h-2 w-2 rounded-full bg-brand-text" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
