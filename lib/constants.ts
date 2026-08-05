/** Shared enums and labels used across the app and the database schema. */

export const CALL_STATUSES = [
  "created",
  "uploading",
  "uploaded",
  "transcribing",
  "summarizing",
  "ready",
  "failed",
  "deleted",
] as const;
export type CallStatus = (typeof CALL_STATUSES)[number];

/**
 * The only two supported roles, in display order.
 *
 *   admin  -> "Admin": every call in their own workspace
 *   member -> "User":  only calls they recorded
 *
 * The `member_role` database enum still carries a legacy `manager` label —
 * Postgres can't remove an enum value — but migration 0012 adds a CHECK
 * constraint so it can never be assigned. There is no manager, team lead, or
 * team-based visibility.
 */
export const MEMBER_ROLES = ["admin", "member"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

/**
 * Narrow a raw `member_role` value from the database to the two-role model.
 *
 * Fails closed on purpose: only the literal `'admin'` grants Admin: a legacy
 * `'manager'` row (there are none, and 0012 makes new ones impossible) is
 * treated as a User and therefore sees only its own calls.
 */
export function toMemberRole(role: string): MemberRole {
  return role === "admin" ? "admin" : "member";
}

export const MEMBER_STATUSES = ["invited", "active", "inactive"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const ORG_STATUSES = ["active", "disabled"] as const;
export type OrgStatus = (typeof ORG_STATUSES)[number];

/** Storage bucket that holds private call audio. */
export const AUDIO_BUCKET = "call-audio";

/** Statuses that indicate processing is still in flight. */
export const IN_PROGRESS_STATUSES: CallStatus[] = [
  "created",
  "uploading",
  "uploaded",
  "transcribing",
  "summarizing",
];
