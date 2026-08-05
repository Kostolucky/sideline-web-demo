/**
 * Demo feature flags.
 *
 * In production these read environment variables and default to OFF. This is a
 * demo, so everything the product can do is switched ON and the values are
 * plain constants — there are no environment variables in this repo at all.
 *
 * `coachingQueue` and `scorecards` are both dark in production today. They are
 * on here deliberately, so the demo can show them.
 */
export const flags = {
  /** Show the in-browser recorder on /app/record (vs the "record on mobile" notice). */
  browserRecording: true,
  /** Show /app/coaching and its sidebar entry. */
  coachingQueue: true,
  /** Show the Scorecard tab on call detail. */
  scorecards: true,
} as const;
