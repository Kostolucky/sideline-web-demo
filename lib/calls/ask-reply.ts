/**
 * The scripted reply for the ask bar on call detail.
 *
 * Mirrors the mobile app's `lib/calls/chat-reply.ts`, so asking about a call on
 * the phone and on the web produces the same answer.
 *
 * There is no model behind this. Whatever you ask, the assistant writes the
 * follow-up for THIS call — which is the one thing a rep actually wants from it
 * and the thing worth showing. The text is not invented here:
 * `customer_follow_up_draft` is already part of the call's insights, so what
 * gets "generated" genuinely reflects that conversation rather than being
 * generic filler that falls apart the moment someone reads it.
 *
 * Pure, so the fallback chain and the tokenizer are testable without rendering.
 */

import type { Insights } from "@/lib/insights-shape";
import type { CallSummaryRow, ConversationAnalysisRow } from "@/lib/db/types";

/**
 * What the assistant "writes" for this call.
 *
 * Prefers the authored follow-up draft. Falls back to a note assembled from the
 * summary's next steps, so a call without a full insights pass still produces
 * something that reads like it was written about that specific conversation.
 */
export function followUpReply(
  analysis: ConversationAnalysisRow | null,
  summary: CallSummaryRow | null,
): string {
  const insights = (analysis?.result ?? null) as Insights | null;

  const draft = insights?.customer_follow_up_draft;
  if (draft?.trim()) return draft.trim();

  const nextSteps = (summary?.next_steps ?? []).filter(Boolean);
  if (nextSteps.length > 0) {
    return [
      "Here's a follow-up you can send:",
      "",
      "Thanks again for your time today. To recap what we agreed:",
      "",
      ...nextSteps.map((s) => `• ${s}`),
      "",
      "Let me know if I've missed anything and I'll get it sorted.",
    ].join("\n");
  }

  return "There isn't a summary on this call yet, so there's nothing for me to base a follow-up on. Once it finishes processing I can draft one.";
}

export interface FollowUpCall {
  id: string;
  name: string;
  /** ISO. */
  recordedAt: string;
  repName: string;
  /** The first next step from the call's summary, if it has one. */
  nextStep?: string;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * What the assistant answers on the call list: what still needs doing from
 * today's calls.
 *
 * Derived rather than hardcoded, so it cannot drift from what is on screen
 * above it. Each item is the call's own first next step — the same line the
 * summary shows — so the answer is checkable against the call it names.
 *
 * `now` is injectable for tests.
 */
export function todaysFollowUpsReply(
  calls: FollowUpCall[],
  now: Date = new Date(),
): string {
  const today = calls.filter((c) => isSameDay(new Date(c.recordedAt), now));

  if (today.length === 0) {
    return "Nothing from today needs a follow-up — there are no calls recorded today yet.";
  }

  const lines = today.map((c) => {
    const step = c.nextStep?.trim();
    return step
      ? `• ${c.name} · ${c.repName}\n  ${step}`
      : `• ${c.name} · ${c.repName}\n  No next step captured yet — worth a listen.`;
  });

  const count =
    today.length === 1 ? "1 follow-up" : `${today.length} follow-ups`;

  return [
    `You have ${count} from today's calls.`,
    "",
    ...lines,
    "",
    "That's everything from today.",
  ].join("\n");
}

/**
 * Split text for word-by-word reveal.
 *
 * Whitespace is kept as its own token rather than trimmed, so re-joining the
 * revealed prefix reproduces the original exactly — paragraph breaks and bullet
 * indentation survive, which a naive `split(" ")` would flatten.
 */
export function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter((t) => t.length > 0);
}
