"use client";

/**
 * No-op stand-in for production's polling refresher.
 *
 * In production this calls `router.refresh()` on a backoff so an in-flight call
 * picks up its transcript without a manual reload. The demo's state lives in a
 * client store that notifies subscribers the instant it changes, so there is
 * nothing to poll for — and a live `router.refresh()` loop would fight the local
 * state five seconds at a time.
 *
 * Kept as a component with the same props and the same import path, so every
 * call site stays byte-identical to production.
 */
export function AutoRefresh(props: {
  enabled: boolean;
  intervalMs?: number;
  maxDelayMs?: number;
  maxDurationMs?: number;
}): null {
  void props;
  return null;
}
