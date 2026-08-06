/**
 * Demo feature flags.
 *
 * In production these read environment variables and default to OFF. This is a
 * demo, so the values are plain constants — there are no environment variables
 * in this repo at all.
 *
 * `coachingQueue` is dark in production; it is on here deliberately, so the
 * demo can show it.
 */
export const flags = {
  /** Show /app/coaching and its nav entry. */
  coachingQueue: true,
} as const;
