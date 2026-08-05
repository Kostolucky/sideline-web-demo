/**
 * Coaching thread shapes.
 *
 * A thread ROOT is a `comments` row with `parent_id is null` — Admin-only, so a
 * new thread is always the Admin opening a topic. A REPLY is a `comments` row
 * with `parent_id` set, and either side may write one: a rep answering coaching
 * addressed to them, or the Admin continuing the conversation. Both are fully
 * persisted (`createCommentAction`, `createReplyAction`) and both count toward
 * the unread state in `coaching_reads` the same way.
 */

export interface CoachingReply {
  id: string;
  parentId: string;
  body: string;
  authorName: string;
  /** ISO timestamp. */
  createdAt: string;
  /** Unread by the viewer — see the note on `CoachingThread.unread`. */
  unread: boolean;
}

export interface CoachingThread {
  /** The persisted `comments.id` of the thread root. */
  id: string;
  body: string;
  authorName: string;
  authorUserId: string;
  /** ISO timestamp. */
  createdAt: string;
  /** Playback position this feedback is anchored to, if any. */
  timestampMs: number | null;
  /**
   * True when the root, or any of its replies, was unread by the viewer as the
   * page loaded. Sticky for the session, so the badge doesn't vanish the
   * instant it's marked read.
   */
  unread: boolean;
  /** The viewer wrote the root, so they may edit or delete it. */
  isAuthor: boolean;
  replies: CoachingReply[];
}
