/**
 * Team-management actions — demo implementations with production signatures.
 *
 * The guards below are the ones that show up in the UI: only an Admin can
 * manage the roster, and the last remaining Admin cannot be demoted or removed
 * (otherwise a demo can lock itself out of its own workspace).
 */

import {
  changeRole,
  createTeam,
  deleteMember,
  deleteTeam,
  getState,
  inviteMember,
  setTeamManager,
  setTeamMember,
} from "@/lib/demo/store";
import { isValidEmail, normalizeEmail } from "@/lib/utils";
import type { MemberRole } from "@/lib/constants";

export type ActionResult = { ok: true } | { ok: false; error: string };

function requireAdmin(): ActionResult {
  const state = getState();
  const me = state.members.find((m) => m.user_id === state.personaId);
  if (me?.role !== "admin") {
    return { ok: false, error: "Only an Admin can manage the team." };
  }
  return { ok: true };
}

function countActiveAdmins(): number {
  return getState().members.filter(
    (m) => m.role === "admin" && m.status === "active",
  ).length;
}

export async function inviteMemberAction(email: string): Promise<ActionResult> {
  const guard = requireAdmin();
  if (!guard.ok) return guard;

  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (getState().members.some((m) => m.email === normalized)) {
    return { ok: false, error: "That person is already in this workspace." };
  }

  inviteMember(normalized);
  return { ok: true };
}

export async function changeRoleAction(
  memberId: string,
  role: MemberRole,
): Promise<ActionResult> {
  const guard = requireAdmin();
  if (!guard.ok) return guard;

  const member = getState().members.find((m) => m.id === memberId);
  if (!member) return { ok: false, error: "Member not found." };
  if (member.role === "admin" && role !== "admin" && countActiveAdmins() <= 1) {
    return { ok: false, error: "A workspace needs at least one Admin." };
  }

  changeRole(memberId, role);
  return { ok: true };
}

export async function deleteMemberAction(
  memberId: string,
): Promise<ActionResult> {
  const guard = requireAdmin();
  if (!guard.ok) return guard;

  const state = getState();
  const member = state.members.find((m) => m.id === memberId);
  if (!member) return { ok: false, error: "Member not found." };
  if (member.user_id === state.personaId) {
    return { ok: false, error: "You can't remove yourself." };
  }
  if (member.role === "admin" && countActiveAdmins() <= 1) {
    return { ok: false, error: "A workspace needs at least one Admin." };
  }

  deleteMember(memberId);
  return { ok: true };
}

export async function createTeamAction(name: string): Promise<ActionResult> {
  const guard = requireAdmin();
  if (!guard.ok) return guard;

  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Give the team a name." };
  if (getState().teams.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
    return { ok: false, error: "There's already a team with that name." };
  }

  createTeam(trimmed);
  return { ok: true };
}

export async function deleteTeamAction(teamId: string): Promise<ActionResult> {
  const guard = requireAdmin();
  if (!guard.ok) return guard;
  deleteTeam(teamId);
  return { ok: true };
}

export async function setTeamMemberAction(
  teamId: string,
  memberId: string,
  assigned: boolean,
): Promise<ActionResult> {
  const guard = requireAdmin();
  if (!guard.ok) return guard;
  setTeamMember(teamId, memberId, assigned);
  return { ok: true };
}

export async function setTeamManagerAction(
  teamId: string,
  memberId: string,
  assigned: boolean,
): Promise<ActionResult> {
  const guard = requireAdmin();
  if (!guard.ok) return guard;
  setTeamManager(teamId, memberId, assigned);
  return { ok: true };
}
