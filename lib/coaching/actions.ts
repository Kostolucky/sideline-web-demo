/**
 * Coaching-queue actions — demo implementation with production signatures.
 *
 * "Reviewed" is per-person, like production's `call_reviews`: clearing a call
 * from your queue does not clear it from anyone else's.
 */

import { markCallReviewed } from "@/lib/demo/store";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function markCallReviewedAction(
  callId: string,
): Promise<ActionResult> {
  markCallReviewed(callId);
  return { ok: true };
}
