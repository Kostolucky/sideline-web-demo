/**
 * Call actions.
 *
 * In production these are Next.js Server Actions (`"use server"`) that write to
 * Postgres. Here they are ordinary async functions that mutate the demo store.
 *
 * The SIGNATURES and RETURN SHAPES are identical to production's, which is the
 * whole point: every component that calls them was copied across unchanged.
 * The validation rules are kept too, so the demo shows the same inline errors.
 */

import { getState, renameCall } from "@/lib/demo/store";

export type RenameResult =
  | { ok: true; name: string }
  | { ok: false; error: string };

const MAX_NAME_LENGTH = 200;

export async function renameCallAction(
  callId: string,
  name: string,
): Promise<RenameResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "The name can't be empty." };
  if (trimmed.length > MAX_NAME_LENGTH) {
    return { ok: false, error: "That name is too long." };
  }

  const state = getState();
  const call = state.calls.find((c) => c.id === callId);
  if (!call) return { ok: false, error: "Call not found." };

  // Production lets the owner or an Admin rename; anyone else is refused.
  const isOwner = call.recorded_by === state.personaId;
  const admin =
    state.members.find((m) => m.user_id === state.personaId)?.role === "admin";
  if (!isOwner && !admin) {
    return { ok: false, error: "You can't rename this call." };
  }

  renameCall(callId, trimmed);
  return { ok: true, name: trimmed };
}

export type NotesResult = { ok: true } | { ok: false; error: string };

const MAX_NOTES_LENGTH = 10_000;

/**
 * Not a server action in production — the web app PATCHes `/api/calls/:id`.
 * Collapsed into an action here so `RepNotes` has one local call to make.
 */
export async function saveNotesAction(
  callId: string,
  notes: string,
): Promise<NotesResult> {
  if (notes.length > MAX_NOTES_LENGTH) {
    return { ok: false, error: "Those notes are too long." };
  }

  const state = getState();
  const call = state.calls.find((c) => c.id === callId);
  if (!call) return { ok: false, error: "Call not found." };
  if (call.recorded_by !== state.personaId) {
    return { ok: false, error: "Only the rep who recorded this call can edit the notes." };
  }

  const { saveNotes } = await import("@/lib/demo/store");
  saveNotes(callId, notes);
  return { ok: true };
}

/** Re-runs "processing" on a failed call. Succeeds after a short delay. */
export async function retryCallAction(callId: string): Promise<NotesResult> {
  const { setCallStatus } = await import("@/lib/demo/store");
  const state = getState();
  const call = state.calls.find((c) => c.id === callId);
  if (!call) return { ok: false, error: "Call not found." };

  setCallStatus(callId, "transcribing");
  // The demo's failed call has no transcript to recover, so it fails again —
  // honest, and it keeps the failure state reachable for the next demo.
  setTimeout(() => {
    setCallStatus(
      callId,
      "failed",
      call.error_message ?? "Processing failed again.",
    );
  }, 6_000);
  return { ok: true };
}
