/**
 * The demo store.
 *
 * A plain observable object — not Redux, not Zustand, not React context. It is
 * deliberately a module-level singleton with `subscribe`/`getState`, consumed
 * through `useSyncExternalStore` in `use-demo.ts`.
 *
 * Why this shape rather than context: the production components call server
 * actions by name (`renameCallAction`, `createCommentAction`, …). Because those
 * action modules can import this store directly, they keep their exact
 * signatures and the components that call them need no edits at all. A context
 * would have forced every one of those call sites to be rewritten as a hook.
 *
 * State is in memory only. A reload restores the pristine fixtures, which is
 * what you want between demos; `resetDemo()` does the same thing mid-session.
 */

import type {
  CallRow,
  CallSummaryRow,
  CommentRow,
  ConversationAnalysisRow,
  OrganizationMemberRow,
  OrganizationRow,
  TranscriptUtteranceRow,
} from "@/lib/db/types";
import type { ScorecardCriterionResult, TeamWithAssignments } from "@/lib/queries";
import {
  ADMIN_PERSON_ID,
  CALLS,
  ORGANIZATION,
  ORGANIZATIONS,
  PEOPLE,
  SCORECARD_CRITERIA,
  TEAMS,
  atDaysAgo,
  isoDaysAgo,
  type DemoCall,
  type DemoOrganization,
} from "./content";
import { slugify } from "@/lib/utils";

export interface DemoState {
  /** Whose eyes we are looking through. Drives every permission in the UI. */
  personaId: string;
  organization: OrganizationRow;
  members: OrganizationMemberRow[];
  calls: CallRow[];
  summaries: Record<string, CallSummaryRow>;
  analyses: Record<string, ConversationAnalysisRow>;
  utterances: Record<string, TranscriptUtteranceRow[]>;
  comments: CommentRow[];
  /** `${userId}::${callId}` -> ISO read watermark. Per-person, like production. */
  coachingReads: Record<string, string>;
  /** `${userId}::${callId}` -> ISO reviewed-at, for the coaching queue. */
  reviews: Record<string, string>;
  teams: TeamWithAssignments[];
  scorecards: Record<string, ScorecardCriterionResult[]>;
  /** Other workspaces, for the platform-owner console. */
  organizations: DemoOrganizationRow[];
}

/**
 * The console needs a real date to format. `createdDaysAgo` is resolved to an
 * ISO string once, here, rather than at render time — calling `Date.now()`
 * during render is impure and React's lint rules rightly reject it.
 */
export interface DemoOrganizationRow extends DemoOrganization {
  createdAt: string;
}

/* ------------------------------------------------------------------------ */
/* Building initial state from the canonical narrative                        */
/* ------------------------------------------------------------------------ */

function buildMembers(): OrganizationMemberRow[] {
  return PEOPLE.map((p) => ({
    id: `member-${p.id}`,
    user_id: p.id,
    email: p.email,
    display_name: p.name,
    role: p.role,
    status: "active" as const,
    joined_at: isoDaysAgo(p.joinedDaysAgo, 9, 0),
    last_login_at: isoDaysAgo(0, 7, 45),
    created_at: isoDaysAgo(p.joinedDaysAgo, 9, 0),
  }));
}

/**
 * `processing` in the narrative becomes `transcribing` here — production's
 * `call_status` enum has no plain "processing" value, and transcribing is the
 * stage a real in-flight call spends longest in.
 */
function statusOf(call: DemoCall): CallRow["status"] {
  if (call.status === "ready") return "ready";
  if (call.status === "failed") return "failed";
  return "transcribing";
}

function buildCall(call: DemoCall): CallRow {
  return {
    id: call.id,
    name: call.name,
    recorded_at: new Date(
      atDaysAgo(call.daysAgo, call.hour, call.minute),
    ).toISOString(),
    recorded_by: call.repId,
    duration_seconds: call.durationSeconds,
    status: statusOf(call),
    error_message: call.errorMessage ?? null,
    audio_mime_type: "audio/mp4",
    audio_storage_path:
      call.status === "ready" ? `demo/${call.id}/audio.m4a` : null,
    notes: call.notes ?? null,
    created_at: new Date(
      atDaysAgo(call.daysAgo, call.hour, call.minute),
    ).toISOString(),
  };
}

function buildUtterances(call: DemoCall): TranscriptUtteranceRow[] {
  return call.utterances.map((u, i) => ({
    id: `${call.id}-u${i}`,
    call_id: call.id,
    speaker: u.speaker,
    start_ms: u.startMs,
    end_ms: u.endMs,
    text: u.text,
    sequence_number: i,
  }));
}

function buildScorecard(call: DemoCall): ScorecardCriterionResult[] {
  return SCORECARD_CRITERIA.map((criterion) => {
    const entry = call.scorecard?.find((e) => e.criterionId === criterion.id);
    return {
      criterionId: criterion.id,
      evaluationId: entry ? `${call.id}-${criterion.id}` : null,
      name: criterion.name,
      description: criterion.description,
      position: criterion.position,
      result: entry?.result ?? null,
      explanation: entry?.explanation ?? null,
      confidence: entry?.confidence ?? null,
      managerOverride: null,
    };
  });
}

export function buildInitialState(): DemoState {
  const summaries: Record<string, CallSummaryRow> = {};
  const analyses: Record<string, ConversationAnalysisRow> = {};
  const utterances: Record<string, TranscriptUtteranceRow[]> = {};
  const scorecards: Record<string, ScorecardCriterionResult[]> = {};
  const comments: CommentRow[] = [];

  for (const call of CALLS) {
    utterances[call.id] = buildUtterances(call);

    if (call.summary) {
      summaries[call.id] = {
        call_id: call.id,
        participants_context: call.summary.participantsContext,
        summary: call.summary.summary,
        main_takeaways: call.summary.mainTakeaways,
        next_steps: call.summary.nextSteps,
        created_at: isoDaysAgo(call.daysAgo, call.hour + 1, call.minute),
      };
    }

    if (call.insights) {
      analyses[call.id] = {
        call_id: call.id,
        outcome: call.insights.outcome,
        primary_improvement: call.insights.primaryImprovement.area,
        result: {
          outcome: call.insights.outcome,
          strengths: call.insights.strengths,
          primary_improvement: call.insights.primaryImprovement,
          objections: call.insights.objections,
          next_steps: call.insights.nextSteps,
          coaching_note: call.insights.coachingNote,
          customer_follow_up_draft: call.insights.customerFollowUpDraft,
        },
        created_at: isoDaysAgo(call.daysAgo, call.hour + 1, call.minute),
      };
    }

    if (call.scorecard) scorecards[call.id] = buildScorecard(call);

    for (const c of call.comments) {
      const iso = isoDaysAgo(c.daysAgo, c.hour, c.minute);
      comments.push({
        id: c.id,
        call_id: call.id,
        author_user_id: c.authorId,
        target_rep_user_id: call.repId,
        body: c.body,
        timestamp_ms: c.timestampMs,
        parent_id: c.parentId,
        created_at: iso,
        updated_at: iso,
      });
    }
  }

  comments.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));

  return {
    personaId: ADMIN_PERSON_ID,
    organization: {
      id: ORGANIZATION.id,
      name: ORGANIZATION.name,
      slug: ORGANIZATION.slug,
      status: "active",
      created_at: isoDaysAgo(412, 9, 0),
    },
    members: buildMembers(),
    calls: CALLS.map(buildCall).sort(
      (a, b) => Date.parse(b.recorded_at) - Date.parse(a.recorded_at),
    ),
    summaries,
    analyses,
    utterances,
    comments,
    // Everyone has read everything up to two days ago, so a handful of recent
    // messages start unread and the badges are visible on first load.
    coachingReads: seedReads(),
    reviews: {},
    teams: TEAMS.map((t) => ({
      id: t.id,
      name: t.name,
      memberIds: t.memberIds.map((id) => `member-${id}`),
      managerIds: t.managerIds.map((id) => `member-${id}`),
    })),
    scorecards,
    organizations: ORGANIZATIONS.map((o) => ({
      ...o,
      createdAt: isoDaysAgo(o.createdDaysAgo, 9, 0),
    })),
  };
}

/**
 * Seed read watermarks so some coaching starts unread and some doesn't.
 *
 * Both personas get a watermark of "36 hours ago" on every call, which leaves
 * anything written since then unread to whoever didn't write it. That's how the
 * demo has visible badges on first paint without hand-marking individual rows.
 */
function seedReads(): Record<string, string> {
  const watermark = new Date(Date.now() - 36 * 3_600_000).toISOString();
  const reads: Record<string, string> = {};
  for (const person of PEOPLE) {
    for (const call of CALLS) {
      reads[`${person.id}::${call.id}`] = watermark;
    }
  }
  return reads;
}

/* ------------------------------------------------------------------------ */
/* The observable                                                             */
/* ------------------------------------------------------------------------ */

type Listener = () => void;

let state: DemoState = buildInitialState();
const listeners = new Set<Listener>();

export function getState(): DemoState {
  return state;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function commit(next: DemoState): void {
  state = next;
  for (const l of listeners) l();
}

/** Apply a partial update. Every mutation below goes through here. */
function update(patch: Partial<DemoState>): void {
  commit({ ...state, ...patch });
}

/* ------------------------------------------------------------------------ */
/* Mutations                                                                  */
/* ------------------------------------------------------------------------ */

export function setPersona(personaId: string): void {
  update({ personaId });
}

export function resetDemo(): void {
  commit(buildInitialState());
}

export function renameCall(callId: string, name: string): void {
  update({
    calls: state.calls.map((c) => (c.id === callId ? { ...c, name } : c)),
  });
}

export function saveNotes(callId: string, notes: string): void {
  update({
    calls: state.calls.map((c) =>
      c.id === callId ? { ...c, notes: notes.trim() || null } : c,
    ),
  });
}

export function setCallStatus(
  callId: string,
  status: CallRow["status"],
  errorMessage: string | null = null,
): void {
  update({
    calls: state.calls.map((c) =>
      c.id === callId ? { ...c, status, error_message: errorMessage } : c,
    ),
  });
}

function nextId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function addComment(
  callId: string,
  body: string,
  timestampMs: number | null,
  parentId: string | null = null,
): CommentRow {
  const call = state.calls.find((c) => c.id === callId);
  const iso = new Date().toISOString();
  const comment: CommentRow = {
    id: nextId("cm"),
    call_id: callId,
    author_user_id: state.personaId,
    target_rep_user_id: call?.recorded_by ?? state.personaId,
    body: body.trim(),
    timestamp_ms: timestampMs,
    parent_id: parentId,
    created_at: iso,
    updated_at: iso,
  };
  update({ comments: [...state.comments, comment] });
  return comment;
}

/**
 * Inject a message from someone else — used by the scripted "incoming coaching"
 * moment so an unread badge appears live during a demo.
 */
export function injectIncomingComment(
  callId: string,
  authorId: string,
  body: string,
  timestampMs: number | null = null,
): void {
  const call = state.calls.find((c) => c.id === callId);
  if (!call) return;
  const iso = new Date().toISOString();
  update({
    comments: [
      ...state.comments,
      {
        id: nextId("cm-incoming"),
        call_id: callId,
        author_user_id: authorId,
        target_rep_user_id: call.recorded_by,
        body,
        timestamp_ms: timestampMs,
        parent_id: null,
        created_at: iso,
        updated_at: iso,
      },
    ],
  });
}

export function updateComment(commentId: string, body: string): void {
  update({
    comments: state.comments.map((c) =>
      c.id === commentId
        ? { ...c, body: body.trim(), updated_at: new Date().toISOString() }
        : c,
    ),
  });
}

export function deleteComment(commentId: string): void {
  update({
    // Deleting a root takes its replies with it, matching the production cascade.
    comments: state.comments.filter(
      (c) => c.id !== commentId && c.parent_id !== commentId,
    ),
  });
}

export function markCoachingRead(callId: string, upTo: string): void {
  update({
    coachingReads: {
      ...state.coachingReads,
      [`${state.personaId}::${callId}`]: upTo,
    },
  });
}

export function markCallReviewed(callId: string): void {
  update({
    reviews: {
      ...state.reviews,
      [`${state.personaId}::${callId}`]: new Date().toISOString(),
    },
  });
}

export function setScorecardOverride(
  callId: string,
  evaluationId: string,
  override: ScorecardCriterionResult["managerOverride"],
): void {
  const existing = state.scorecards[callId];
  if (!existing) return;
  update({
    scorecards: {
      ...state.scorecards,
      [callId]: existing.map((c) =>
        c.evaluationId === evaluationId ? { ...c, managerOverride: override } : c,
      ),
    },
  });
}

/* ---- Team ---- */

export function inviteMember(email: string): void {
  const iso = new Date().toISOString();
  update({
    members: [
      ...state.members,
      {
        id: nextId("member"),
        user_id: null,
        email: email.trim().toLowerCase(),
        display_name: null,
        role: "member",
        status: "invited",
        joined_at: null,
        last_login_at: null,
        created_at: iso,
      },
    ],
  });
}

export function changeRole(
  memberId: string,
  role: OrganizationMemberRow["role"],
): void {
  update({
    members: state.members.map((m) => (m.id === memberId ? { ...m, role } : m)),
  });
}

export function deleteMember(memberId: string): void {
  update({
    members: state.members.filter((m) => m.id !== memberId),
    teams: state.teams.map((t) => ({
      ...t,
      memberIds: t.memberIds.filter((id) => id !== memberId),
      managerIds: t.managerIds.filter((id) => id !== memberId),
    })),
  });
}

export function createTeam(name: string): void {
  update({
    teams: [
      ...state.teams,
      { id: nextId("team"), name: name.trim(), memberIds: [], managerIds: [] },
    ],
  });
}

export function deleteTeam(teamId: string): void {
  update({ teams: state.teams.filter((t) => t.id !== teamId) });
}

export function setTeamMember(
  teamId: string,
  memberId: string,
  assigned: boolean,
): void {
  update({
    teams: state.teams.map((t) =>
      t.id === teamId
        ? {
            ...t,
            memberIds: assigned
              ? Array.from(new Set([...t.memberIds, memberId]))
              : t.memberIds.filter((id) => id !== memberId),
          }
        : t,
    ),
  });
}

export function setTeamManager(
  teamId: string,
  memberId: string,
  assigned: boolean,
): void {
  update({
    teams: state.teams.map((t) =>
      t.id === teamId
        ? {
            ...t,
            managerIds: assigned
              ? Array.from(new Set([...t.managerIds, memberId]))
              : t.managerIds.filter((id) => id !== memberId),
          }
        : t,
    ),
  });
}

/* ---- Organizations (platform-owner console) ---- */

export function createOrganization(name: string): void {
  update({
    organizations: [
      ...state.organizations,
      {
        id: nextId("org"),
        name: name.trim(),
        slug: slugify(name),
        status: "active",
        activeMembers: 1,
        createdDaysAgo: 0,
        createdAt: new Date().toISOString(),
      },
    ],
  });
}

export function setOrganizationStatus(
  orgId: string,
  status: "active" | "disabled",
): void {
  update({
    organizations: state.organizations.map((o) =>
      o.id === orgId ? { ...o, status } : o,
    ),
  });
}

/* ---- Recording ---- */

/** Insert a freshly "recorded" call at the top of the feed. */
export function insertRecordedCall(name: string, durationSeconds: number): string {
  const id = nextId("call");
  const iso = new Date().toISOString();
  update({
    calls: [
      {
        id,
        name,
        recorded_at: iso,
        recorded_by: state.personaId,
        duration_seconds: durationSeconds,
        status: "uploading",
        error_message: null,
        audio_mime_type: "audio/mp4",
        audio_storage_path: null,
        notes: null,
        created_at: iso,
      },
      ...state.calls,
    ],
  });
  return id;
}

/** Attach the pre-authored content a finished recording resolves into. */
export function attachFreshContent(
  callId: string,
  utterances: TranscriptUtteranceRow[],
  summary: CallSummaryRow,
  analysis: ConversationAnalysisRow,
): void {
  commit({
    ...state,
    utterances: { ...state.utterances, [callId]: utterances },
    summaries: { ...state.summaries, [callId]: summary },
    analyses: { ...state.analyses, [callId]: analysis },
    calls: state.calls.map((c) =>
      c.id === callId
        ? {
            ...c,
            status: "ready",
            audio_storage_path: `demo/${callId}/audio.m4a`,
          }
        : c,
    ),
  });
}
