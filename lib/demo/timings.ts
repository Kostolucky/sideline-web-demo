/**
 * Every simulated duration in the demo, in one place.
 *
 * If a demo feels too slow or too fast in the room, this is the only file to
 * touch — nothing else hardcodes a delay.
 */
export const TIMINGS = {
  /** How long a "server" read appears to take, so skeletons are visible. */
  pageLoadMs: 450,

  /** The scripted upload → processing → ready pipeline after a recording. */
  pipeline: {
    queuedMs: 700,
    /** Upload progress ramps 0 → 100 over this long. */
    uploadingMs: 4_000,
    uploadedMs: 600,
    /** "Processing" dwell before the call flips to ready. */
    processingMs: 6_000,
  },

  /**
   * A scripted coaching message arrives this long after the calls list is first
   * shown, so an unread badge visibly appears during a demo rather than being
   * there from the start. Set `enabled: false` to switch the surprise off.
   */
  /**
   * The ask bar on call detail — how long the assistant appears to think
   * before the first word, and how fast the reply then streams in.
   *
   * `tokenMs` is per token, and whitespace counts as a token, so a word lands
   * roughly every 2× this. Matches the mobile app's chat.
   */
  chat: {
    thinkingMs: 900,
    tokenMs: 26,
  },

  incomingCoaching: {
    enabled: true,
    afterMs: 20_000,
    callId: "call-brennan",
  },
} as const;

/**
 * Real audio, if you have any.
 *
 * The demo drives the scrubber, the timer and the transcript highlighting from a
 * simulated clock, so no audio file is required and none ships with this repo.
 * Drop a file into `public/audio/` and map it here to get real playback for that
 * call — the player switches to a real <audio> element automatically.
 *
 *   export const AUDIO_OVERRIDES = { "call-hollis": "/audio/hollis.m4a" };
 *
 * The transcript timings in `content.ts` are written for the simulated
 * durations, so a real file will drift unless it happens to match.
 */
export const AUDIO_OVERRIDES: Record<string, string> = {};
