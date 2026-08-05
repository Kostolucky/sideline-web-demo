/**
 * Scorecard actions — demo implementation with production signatures.
 *
 * A manager override sits alongside the AI result rather than replacing it, so
 * the UI can show "Met · override" and the original grade is never lost.
 */

import { getState, setScorecardOverride } from "@/lib/demo/store";
import { SCORECARD_RESULTS, type ScorecardResult } from "@/lib/scorecards/template";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function setScorecardOverrideAction(
  evaluationId: string,
  callId: string,
  override: ScorecardResult | null,
): Promise<ActionResult> {
  if (override !== null && !SCORECARD_RESULTS.includes(override)) {
    return { ok: false, error: "Unknown scorecard result." };
  }

  const state = getState();
  const isAdmin =
    state.members.find((m) => m.user_id === state.personaId)?.role === "admin";
  if (!isAdmin) {
    return { ok: false, error: "Only an Admin can override a scorecard." };
  }

  setScorecardOverride(callId, evaluationId, override);
  return { ok: true };
}
