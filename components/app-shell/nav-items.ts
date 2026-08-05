import { Phone, Mic, Users, LayoutDashboard, ClipboardCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MemberRole } from "@/lib/constants";
import { flags } from "@/lib/flags";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Emphasised as the primary action (Record). */
  primary?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/app/calls", label: "Calls", icon: Phone },
  { href: "/app/record", label: "Record", icon: Mic, primary: true },
  { href: "/app/team", label: "Team", icon: Users },
];

/**
 * Manager/admin-only surfaces, shown above the core items so the staff sidebar
 * reads Dashboard / Calls / Team.
 *
 * The coaching queue is parked behind `flags.coachingQueue` (off by default) —
 * coaching belongs inside a call, not on its own screen. `/app/coaching` already
 * 404s while the flag is off, so nav and route stay in step.
 */
export const STAFF_NAV_ITEMS: NavItem[] = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ...(flags.coachingQueue
    ? [{ href: "/app/coaching", label: "Coaching", icon: ClipboardCheck }]
    : []),
];

/** The primary Record action, surfaced as a standalone CTA (not a list row). */
export const RECORD_ITEM: NavItem = NAV_ITEMS.find((i) => i.primary) ?? {
  href: "/app/record",
  label: "Record",
  icon: Mic,
  primary: true,
};

/**
 * Sidebar list items for a role: staff get the manager surfaces prepended. The
 * primary Record action is excluded — it renders as its own button.
 */
export function sidebarItemsForRole(role: MemberRole): NavItem[] {
  const base = role === "member" ? NAV_ITEMS : [...STAFF_NAV_ITEMS, ...NAV_ITEMS];
  return base.filter((i) => !i.primary);
}

/** True when the current path belongs to a nav item's section. */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
