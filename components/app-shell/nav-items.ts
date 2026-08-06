import { Phone, Mic, Users, MessageSquareText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { flags } from "@/lib/flags";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Emphasised as the primary action (Record). */
  primary?: boolean;
}

/**
 * The workspace destinations, in order: Calls · Coaching · Team.
 *
 * Everyone sees the same three. The roles differ in what the screens contain,
 * not in which screens exist — an Admin sees every call and can manage the
 * roster; a User sees their own calls and a read-only team list. Hiding whole
 * destinations from reps made the app read like two different products.
 *
 * A Dashboard used to sit above Calls, Admin-only. It has been removed:
 * workspace totals are not what anyone opens this app to do.
 *
 * Record is the primary action rather than a destination, and renders as its
 * own control in both navs.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/app/calls", label: "Calls", icon: Phone },
  ...(flags.coachingQueue
    ? [{ href: "/app/coaching", label: "Coaching", icon: MessageSquareText }]
    : []),
  { href: "/app/record", label: "Record", icon: Mic, primary: true },
  { href: "/app/team", label: "Team", icon: Users },
];

/** The primary Record action, surfaced as a standalone CTA (not a list row). */
export const RECORD_ITEM: NavItem = NAV_ITEMS.find((i) => i.primary) ?? {
  href: "/app/record",
  label: "Record",
  icon: Mic,
  primary: true,
};

/**
 * Sidebar list items. The primary Record action is excluded — it renders as its
 * own button below the list.
 */
export function sidebarItems(): NavItem[] {
  return NAV_ITEMS.filter((i) => !i.primary);
}

/** True when the current path belongs to a nav item's section. */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
