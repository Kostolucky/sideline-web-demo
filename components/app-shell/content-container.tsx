"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Widths for the workspace content column, chosen per route.
 *
 *   /app/calls       90rem — the operational table; wide columns scan well.
 *   /app/calls/<id>  80rem — a two-column review workspace needs more than the
 *                    reading width, but paragraphs and transcript lines have to
 *                    stay readable, so it stops well short of the table's width.
 *   everything else  64rem — the reading column these pages already had.
 *
 * Routing the decision through one client component (rather than editing the
 * shared layout's hardcoded width, or adding a container to every page) means no
 * other page's layout changes.
 */
function maxWidthFor(pathname: string): string {
  if (pathname === "/app/calls") return "max-w-[90rem] xl:px-8";
  if (pathname.startsWith("/app/calls/")) return "max-w-[80rem]";
  return "max-w-5xl";
}

/** Call detail owns its own full-bleed layout — see the note below. */
function isFullBleed(pathname: string): boolean {
  return /^\/app\/calls\/[^/]+$/.test(pathname);
}

export function ContentContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Call detail opts out entirely. Its coaching column is a full-height rail
  // flush to the right edge of the viewport, mirroring the navigation rail on
  // the left — it can't live inside a padded, max-width reading column. The
  // page re-applies its own padding to the review side.
  if (isFullBleed(pathname)) return <>{children}</>;

  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-6 sm:px-6 lg:py-8",
        maxWidthFor(pathname),
      )}
    >
      {children}
    </div>
  );
}
