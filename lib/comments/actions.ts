/**
 * Coaching comment actions — demo implementations of the production Server
 * Actions, with identical signatures and return shapes.
 *
 * The permission rules are reproduced rather than dropped, because they are
 * visible product behaviour: an Admin opens a thread, a rep may only reply to
 * one addressed to them, and read watermarks are per-person.
 */

import {
  addComment,
  deleteComment,
  getState,
  markCoachingRead,
  updateComment,
} from "@/lib/demo/store";

export type ActionResult = { ok: true } | { ok: false; error: string };

const MAX_BODY_LENGTH = 4_000;

function validateBody(body: string): string | null {
  const trimmed = body.trim();
  if (!trimmed) return "Write something first.";
  if (trimmed.length > MAX_BODY_LENGTH) return "That message is too long.";
  return null;
}

function isCurrentAdmin(): boolean {
  const state = getState();
  return (
    state.members.find((m) => m.user_id === state.personaId)?.role === "admin"
  );
}

/** Admin opens a coaching thread, optionally anchored to a playback moment. */
export async function createCommentAction(
  callId: string,
  timestampMs: number | null,
  body: string,
): Promise<ActionResult> {
  const invalid = validateBody(body);
  if (invalid) return { ok: false, error: invalid };
  if (!isCurrentAdmin()) {
    return { ok: false, error: "Only an Admin can start a coaching thread." };
  }
  addComment(callId, body, timestampMs, null);
  return { ok: true };
}

/** Either side may reply — the Admin, or the rep the call belongs to. */
export async function createReplyAction(
  callId: string,
  parentId: string,
  body: string,
): Promise<ActionResult> {
  const invalid = validateBody(body);
  if (invalid) return { ok: false, error: invalid };

  const state = getState();
  const call = state.calls.find((c) => c.id === callId);
  if (!call) return { ok: false, error: "Call not found." };

  const isTargetRep = call.recorded_by === state.personaId;
  if (!isCurrentAdmin() && !isTargetRep) {
    return { ok: false, error: "You can't reply on this call." };
  }

  addComment(callId, body, null, parentId);
  return { ok: true };
}

export async function updateCommentAction(
  commentId: string,
  callId: string,
  body: string,
): Promise<ActionResult> {
  void callId; // part of the production signature; unused here
  const invalid = validateBody(body);
  if (invalid) return { ok: false, error: invalid };

  const state = getState();
  const comment = state.comments.find((c) => c.id === commentId);
  if (!comment) return { ok: false, error: "Message not found." };
  if (comment.author_user_id !== state.personaId) {
    return { ok: false, error: "You can only edit your own messages." };
  }

  updateComment(commentId, body);
  return { ok: true };
}

export async function deleteCommentAction(
  commentId: string,
  callId: string,
): Promise<ActionResult> {
  void callId; // part of the production signature; unused here
  const state = getState();
  const comment = state.comments.find((c) => c.id === commentId);
  if (!comment) return { ok: false, error: "Message not found." };
  if (comment.author_user_id !== state.personaId) {
    return { ok: false, error: "You can only delete your own messages." };
  }

  deleteComment(commentId);
  return { ok: true };
}

/**
 * Move this viewer's read watermark for a call.
 *
 * `upToIso` is the newest message actually on screen, never `now()` — anything
 * that arrives after this render has genuinely not been seen.
 */
export async function markCoachingReadAction(
  callId: string,
  upToIso: string,
): Promise<ActionResult> {
  markCoachingRead(callId, upToIso);
  return { ok: true };
}

/** Kept for parity with production's API surface. */
export async function markCommentsReadAction(
  callId: string,
  upToIso: string,
): Promise<ActionResult> {
  return markCoachingReadAction(callId, upToIso);
}
