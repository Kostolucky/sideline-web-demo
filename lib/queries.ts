/**
 * View models and the selectors that build them.
 *
 * In production this file is `import "server-only"` and every function is a
 * Supabase query. Here the exported TYPES are identical — which is why the
 * copied components import `@/lib/queries` unchanged — but the functions are
 * pure selectors over `DemoState`.
 *
 * One behaviour is worth preserving carefully: production scopes reads in the
 * database (RLS), so a rep simply cannot see other people's calls. There is no
 * client-side filter to copy. The demo has no database, so that scoping is
 * re-implemented here in `visibleCalls` — it is the single place the persona's
 * permissions narrow what is returned, and everything else builds on it.
 */

import type {
  CallRow,
  CallSummaryRow,
  CommentRow,
  ConversationAnalysisRow,
  OrganizationMemberRow,
  TranscriptUtteranceRow,
} from "@/lib/db/types";
import type { ScorecardResult } from "@/lib/scorecards/template";
import { isUnreadTo } from "@/lib/coaching/unread";
import { AUDIO_OVERRIDES } from "@/lib/demo/timings";
import type { DemoState } from "@/lib/demo/store";

/* ------------------------------------------------------------------------ */
/* View models — identical to production                                      */
/* ------------------------------------------------------------------------ */

export interface CallWithRep extends CallRow {
  rep: OrganizationMemberRow | null;
}

export interface CallDetail {
  call: CallRow;
  rep: OrganizationMemberRow | null;
  utterances: TranscriptUtteranceRow[];
  summary: CallSummaryRow | null;
  analysis: ConversationAnalysisRow | null;
  audioUrl: string | null;
}

export interface CoachingQueueItem {
  call: CallRow;
  rep: OrganizationMemberRow | null;
  summarySnippet: string | null;
  reason: string;
}

export interface CommentWithAuthor extends CommentRow {
  authorName: string;
}

export interface ScorecardCriterionResult {
  criterionId: string;
  evaluationId: string | null;
  name: string;
  description: string | null;
  position: number;
  result: ScorecardResult | null;
  explanation: string | null;
  confidence: number | null;
  managerOverride: ScorecardResult | null;
}

export interface TeamWithAssignments {
  id: string;
  name: string;
  memberIds: string[];
  managerIds: string[];
}

/* ------------------------------------------------------------------------ */
/* Persona helpers                                                            */
/* ------------------------------------------------------------------------ */

export function currentMember(state: DemoState): OrganizationMemberRow {
  const found = state.members.find((m) => m.user_id === state.personaId);
  // The persona switcher only ever selects a seeded person, and the seeded
  // people are never deletable, so this is defensive rather than expected.
  if (found) return found;
  return state.members[0];
}

export function isAdmin(state: DemoState): boolean {
  return currentMember(state).role === "admin";
}

function memberByUserId(
  state: DemoState,
  userId: string | null,
): OrganizationMemberRow | null {
  if (!userId) return null;
  return state.members.find((m) => m.user_id === userId) ?? null;
}

/**
 * What this persona is allowed to see. Admin: the whole workspace. User: only
 * calls they recorded. This stands in for production's RLS policy.
 */
function visibleCalls(state: DemoState): CallRow[] {
  if (isAdmin(state)) return state.calls;
  return state.calls.filter((c) => c.recorded_by === state.personaId);
}

/* ------------------------------------------------------------------------ */
/* Selectors                                                                  */
/* ------------------------------------------------------------------------ */

export function listMembers(state: DemoState): OrganizationMemberRow[] {
  return [...state.members].sort((a, b) => {
    // Admins first, then alphabetical — the production roster order.
    if (a.role !== b.role) return a.role === "admin" ? -1 : 1;
    return (a.display_name ?? a.email).localeCompare(b.display_name ?? b.email);
  });
}

export function listCalls(
  state: DemoState,
  filters: {
    recordedBy?: string;
    search?: string;
    from?: string;
    to?: string;
  } = {},
): CallWithRep[] {
  const { recordedBy, search, from, to } = filters;
  const needle = search?.trim().toLowerCase();

  return visibleCalls(state)
    .filter((c) => c.status !== "deleted")
    .filter((c) => (recordedBy ? c.recorded_by === recordedBy : true))
    .filter((c) => (needle ? c.name.toLowerCase().includes(needle) : true))
    .filter((c) => (from ? Date.parse(c.recorded_at) >= Date.parse(from) : true))
    .filter((c) => (to ? Date.parse(c.recorded_at) <= Date.parse(to) : true))
    .sort((a, b) => Date.parse(b.recorded_at) - Date.parse(a.recorded_at))
    .map((c) => ({ ...c, rep: memberByUserId(state, c.recorded_by) }));
}

export function getCallDetail(
  state: DemoState,
  callId: string,
): CallDetail | null {
  const call = visibleCalls(state).find((c) => c.id === callId);
  if (!call) return null;
  return {
    call,
    rep: memberByUserId(state, call.recorded_by),
    utterances: state.utterances[callId] ?? [],
    summary: state.summaries[callId] ?? null,
    analysis: state.analyses[callId] ?? null,
    // Null unless a real file has been dropped into public/audio and mapped —
    // the player falls back to a simulated clock, which is the normal case.
    audioUrl: AUDIO_OVERRIDES[callId] ?? null,
  };
}

function authorName(state: DemoState, userId: string): string {
  const member = memberByUserId(state, userId);
  return member?.display_name || member?.email || "Unknown";
}

export function getCallComments(
  state: DemoState,
  callId: string,
): CommentWithAuthor[] {
  return state.comments
    .filter((c) => c.call_id === callId)
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
    .map((c) => ({ ...c, authorName: authorName(state, c.author_user_id) }));
}

export function getCoachingReadAt(
  state: DemoState,
  callId: string,
): string | null {
  return state.coachingReads[`${state.personaId}::${callId}`] ?? null;
}

/** call id -> unread coaching count for the current persona. */
export function getUnreadCoachingByCall(
  state: DemoState,
): Record<string, number> {
  const out: Record<string, number> = {};
  const visible = new Set(visibleCalls(state).map((c) => c.id));

  for (const comment of state.comments) {
    if (!visible.has(comment.call_id)) continue;
    const lastRead = state.coachingReads[`${state.personaId}::${comment.call_id}`] ?? null;
    if (isUnreadTo(comment, state.personaId, lastRead)) {
      out[comment.call_id] = (out[comment.call_id] ?? 0) + 1;
    }
  }
  return out;
}

export function listCoachingQueue(state: DemoState): CoachingQueueItem[] {
  return visibleCalls(state)
    .filter((c) => c.status === "ready")
    .filter((c) => !state.reviews[`${state.personaId}::${c.id}`])
    .sort((a, b) => Date.parse(b.recorded_at) - Date.parse(a.recorded_at))
    .map((call) => {
      const summary = state.summaries[call.id];
      const hasCoaching = state.comments.some((c) => c.call_id === call.id);
      return {
        call,
        rep: memberByUserId(state, call.recorded_by),
        summarySnippet: summary?.summary ?? null,
        reason: hasCoaching ? "Awaiting review" : "New conversation",
      };
    });
}

export function getCallScorecard(
  state: DemoState,
  callId: string,
): ScorecardCriterionResult[] {
  return state.scorecards[callId] ?? [];
}

export function listTeamsWithAssignments(
  state: DemoState,
): TeamWithAssignments[] {
  return state.teams;
}

export function listOrganizationsForOwner(state: DemoState) {
  return state.organizations;
}
