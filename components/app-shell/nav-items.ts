import { Phone, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * The workspace destinations, in order: Calls · Team.
 *
 * Everyone sees the same two. The roles differ in what the screens contain,
 * not in which screens exist — an Admin sees every call and can manage the
 * roster; a User sees their own calls and a read-only team list. Hiding whole
 * destinations from reps made the app read like two different products.
 *
 * Three things used to live here and no longer do. A Dashboard, Admin-only:
 * workspace totals are not what anyone opens this app to do. Record, as a
 * prominent primary action: recording happens on the phone, so a record button
 * on the web pointed at the wrong device. And Coaching, which was a queue of
 * calls awaiting review — a second list of the same objects, one click from the
 * list you are already on. Coaching itself is unchanged; it lives inside a call,
 * beside the transcript it is about.
 *
 * A call is the atomic unit here. Every destination that was really "calls,
 * filtered differently" has been folded back into Calls.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/app/calls", label: "Calls", icon: Phone },
  { href: "/app/team", label: "Team", icon: Users },
];

/** True when the current path belongs to a nav item's section. */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
