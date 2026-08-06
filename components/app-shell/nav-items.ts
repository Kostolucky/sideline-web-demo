import { Phone, Users, MessageSquareText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { flags } from "@/lib/flags";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * The workspace destinations, in order: Calls · Coaching · Team.
 *
 * Everyone sees the same three. The roles differ in what the screens contain,
 * not in which screens exist — an Admin sees every call and can manage the
 * roster; a User sees their own calls and a read-only team list. Hiding whole
 * destinations from reps made the app read like two different products.
 *
 * Two things used to live here and no longer do. A Dashboard, Admin-only, above
 * Calls: workspace totals are not what anyone opens this app to do. And Record,
 * as a prominent primary action: recording happens on the phone, so a record
 * button on the web was pointing at the wrong device.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/app/calls", label: "Calls", icon: Phone },
  ...(flags.coachingQueue
    ? [{ href: "/app/coaching", label: "Coaching", icon: MessageSquareText }]
    : []),
  { href: "/app/team", label: "Team", icon: Users },
];

/** True when the current path belongs to a nav item's section. */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
