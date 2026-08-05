"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "./nav-items";
import { cn } from "@/lib/utils";

/**
 * Mobile bottom navigation. The Record action is a raised, prominent button
 * centred for one-handed thumb reach.
 */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;

          if (item.primary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className="relative -mt-5 flex flex-1 flex-col items-center justify-end"
              >
                {/* Mirrors mobile's green FAB (`app/index.tsx`). The dark-green
                    ring gives the control an identifiable edge on a light page,
                    where the electric green alone is only 1.41:1 vs white. */}
                <span
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full border border-brand-text bg-brand text-brand-foreground shadow-md ring-4 ring-background transition-transform active:scale-95",
                  )}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span className="mt-1 text-[11px] font-medium text-brand-text">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-brand-text" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-[22px] w-[22px]" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
