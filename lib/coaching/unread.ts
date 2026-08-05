/**
 * The unread rule for coaching, in one place.
 *
 * Two conditions, both necessary: someone else wrote it, and it landed after
 * your own read watermark. The server counts unread the same way in
 * `unread_coaching_counts()` — this mirrors it client-side so the web panel can
 * hold a badge steady for the session instead of having it vanish mid-render.
 *
 * Pure so the rule is testable without a database.
 */

export interface UnreadCandidate {
  author_user_id: string;
  /** ISO timestamp. */
  created_at: string;
}

/**
 * Is this message unread by `viewerId`?
 *
 * `lastReadAt` is null for someone who has never opened the thread, in which
 * case everything they didn't write is unread. The comparison is strictly
 * greater-than so marking read *at* a message's timestamp counts that message as
 * read — that's the timestamp we send when the thread is displayed.
 */
export function isUnreadTo(
  comment: UnreadCandidate,
  viewerId: string,
  lastReadAt: string | null,
): boolean {
  // Never tell people their own message is news to them.
  if (comment.author_user_id === viewerId) return false;
  if (!lastReadAt) return true;
  return Date.parse(comment.created_at) > Date.parse(lastReadAt);
}

/** How many of these messages are unread by `viewerId`. */
export function countUnreadTo(
  comments: UnreadCandidate[],
  viewerId: string,
  lastReadAt: string | null,
): number {
  return comments.filter((c) => isUnreadTo(c, viewerId, lastReadAt)).length;
}

/**
 * The watermark to send when a thread is shown: the newest message actually
 * present. Null when there's nothing to mark.
 *
 * Deliberately not `now()` — anything that arrives after this render hasn't been
 * seen, and must stay unread.
 */
export function newestCreatedAt(comments: UnreadCandidate[]): string | null {
  let newest: string | null = null;
  for (const c of comments) {
    if (!newest || Date.parse(c.created_at) > Date.parse(newest)) {
      newest = c.created_at;
    }
  }
  return newest;
}
