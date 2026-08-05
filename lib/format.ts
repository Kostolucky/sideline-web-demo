/** Display formatting helpers (durations, dates, speaker labels). */

/** 125 -> "2:05", 3725 -> "1:02:05" */
export function formatDuration(totalSeconds: number | null | undefined): string {
  const s = Math.max(0, Math.floor(totalSeconds ?? 0));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const mm = String(minutes).padStart(hours > 0 ? 2 : 1, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Milliseconds -> "1:02" for transcript timestamps. */
export function formatTimestamp(ms: number | null | undefined): string {
  return formatDuration(Math.round((ms ?? 0) / 1000));
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return `${formatDate(value)} · ${formatTime(value)}`;
}

/** Display label for a member role: admin -> "Admin", member -> "User". */
/** Two roles only: Admin, or User. Anything else is treated as a User. */
export function roleLabel(role: string): string {
  return role === "admin" ? "Admin" : "User";
}

/** "A" -> "Speaker A". Falls back gracefully for custom names. */
export function formatSpeaker(speaker: string | null | undefined): string {
  if (!speaker) return "Speaker";
  const trimmed = speaker.trim();
  if (/^[A-Z]$/i.test(trimmed)) return `Speaker ${trimmed.toUpperCase()}`;
  if (/^speaker/i.test(trimmed)) return trimmed;
  return trimmed;
}

/** Suggested call name, e.g. "Call – July 27, 7:15 PM". */
export function suggestedCallName(now = new Date()): string {
  const date = now.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });
  const time = now.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `Call – ${date}, ${time}`;
}
