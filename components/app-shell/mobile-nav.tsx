"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "./nav-items";
import { cn } from "@/lib/utils";

/**
 * Mobile bottom navigation: the same three destinations as the sidebar.
 *
 * It used to carry a raised green Record button in the middle, mirroring the
 * native app's FAB. That went with the rest of the web recording surface —
 * recording happens on the phone, and a record button here pointed at the wrong
 * device.
 */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                active
                  ? "text-brand-text"
                  : "text-muted-foreground hover:text-foreground",
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
