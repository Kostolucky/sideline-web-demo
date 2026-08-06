"use client";

import * as React from "react";
import {
  createCommentAction,
  createReplyAction,
  markCoachingReadAction,
} from "@/lib/comments/actions";
import { isUnreadTo, newestCreatedAt } from "@/lib/coaching/unread";
import { buildCoachingThread, rootCommentId } from "@/lib/coaching/thread";
import type { CommentWithAuthor } from "@/lib/queries";

/**
 * Turns the persisted comments into a chat timeline, and owns sending and
 * marking read.
 *
 * Replaces `use-coaching-threads`, which grouped roots and replies for the old
 * threaded UI. The conversation is a flat timeline now; `parent_id` survives
 * only so a rep's message can attach to the Admin's opening one, which is the
 * rule production enforces in the database.
 */
export function useCoachingChat({
  callId,
  comments,
  currentUserId,
  lastReadAt,
  isAdmin,
}: {
  callId: string;
  comments: CommentWithAuthor[];
  currentUserId: string;
  /**
   * This viewer's coaching read watermark for this call, or null if they have
   * never opened it. Personal to them — the Admin and the rep each have their
   * own, so one reading the thread doesn't mark it read for the other.
   */
  lastReadAt: string | null;
  isAdmin: boolean;
}) {
  // Which messages were unread to THIS viewer when the page loaded. A
  // `useState` initialiser so it's computed exactly once, and sticky on
  // purpose — it has to survive the re-render that follows marking them read,
  // or the reader would never see what was new.
  const [initialUnread] = React.useState(
    () =>
      new Set(
        comments
          .filter((c) => isUnreadTo(c, currentUserId, lastReadAt))
          .map((c) => c.id),
      ),
  );

  const items = React.useMemo(
    () =>
      buildCoachingThread(comments, {
        viewerId: currentUserId,
        unreadIds: initialUnread,
      }),
    [comments, currentUserId, initialUnread],
  );

  const unreadCount = initialUnread.size;
  const rootId = React.useMemo(() => rootCommentId(comments), [comments]);

  // The panel is on screen as soon as the call opens, so rendering it IS
  // reading it. Watermark the newest message actually present, not "now", so
  // anything arriving later stays unread.
  const marked = React.useRef(false);
  React.useEffect(() => {
    if (marked.current || initialUnread.size === 0) return;
    const newest = newestCreatedAt(comments);
    if (!newest) return;
    marked.current = true;
    void markCoachingReadAction(callId, newest);
  }, [comments, callId, initialUnread]);

  /**
   * Send a message. Returns an error string to surface inline, or null.
   *
   * An Admin opens the conversation; a rep may only add to one that exists.
   * That is why the composer is hidden for a rep on an empty thread rather than
   * letting them send and bounce off an error.
   */
  const send = React.useCallback(
    async (body: string, timestampMs: number | null): Promise<string | null> => {
      const res = isAdmin
        ? await createCommentAction(callId, timestampMs, body)
        : rootId
          ? await createReplyAction(callId, rootId, body)
          : { ok: false as const, error: "Only an Admin can start a coaching thread." };
      return res.ok ? null : res.error;
    },
    [callId, isAdmin, rootId],
  );

  /** A rep with nothing to reply to has no composer. */
  const canSend = isAdmin || rootId !== null;

  return { items, unreadCount, send, canSend };
}
