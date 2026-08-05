"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createReplyAction, markCoachingReadAction } from "@/lib/comments/actions";
import { isUnreadTo, newestCreatedAt } from "@/lib/coaching/unread";
import type { CommentWithAuthor } from "@/lib/queries";
import type { CoachingThread } from "./types";

/**
 * Turns the persisted comment rows into coaching threads (root + replies, both
 * real `comments` rows now — see `types.ts`) and owns marking the thread read.
 */
export function useCoachingThreads({
  callId,
  comments,
  currentUserId,
  lastReadAt,
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
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  // Which messages were unread to THIS viewer when the page loaded: authored by
  // someone else, and newer than their own watermark. A `useState` initialiser
  // so it's computed exactly once (a ref would mean reading `.current` during
  // render). Sticky on purpose: it has to survive the `router.refresh()` that
  // follows marking them read, or the reader would never see what was new.
  const [initialUnread] = React.useState(
    () =>
      new Set(
        comments
          .filter((c) => isUnreadTo(c, currentUserId, lastReadAt))
          .map((c) => c.id),
      ),
  );

  // The panel is on screen as soon as the call opens, so rendering it IS reading
  // it. Watermark the newest message actually present, not "now", so anything
  // arriving later stays unread.
  const marked = React.useRef(false);
  React.useEffect(() => {
    if (marked.current || initialUnread.size === 0) return;
    const newest = newestCreatedAt(comments);
    if (!newest) return;
    marked.current = true;
    startTransition(async () => {
      const res = await markCoachingReadAction(callId, newest);
      // Leave the badge alone if the write failed — it'll still be unread on the
      // next load, which is the honest outcome.
      if (res.ok) router.refresh();
      else marked.current = false;
    });
  }, [comments, callId, router, initialUnread]);

  const threads: CoachingThread[] = React.useMemo(() => {
    const repliesByParent = new Map<string, CommentWithAuthor[]>();
    const roots: CommentWithAuthor[] = [];
    for (const c of comments) {
      if (c.parent_id) {
        const bucket = repliesByParent.get(c.parent_id);
        if (bucket) bucket.push(c);
        else repliesByParent.set(c.parent_id, [c]);
      } else {
        roots.push(c);
      }
    }

    return roots.map((root) => {
      // `getCallComments` already orders ascending, and grouping preserves that.
      const replies = (repliesByParent.get(root.id) ?? []).map((r) => ({
        id: r.id,
        parentId: root.id,
        body: r.body,
        authorName: r.authorName,
        createdAt: r.created_at,
        unread: initialUnread.has(r.id),
      }));

      return {
        id: root.id,
        body: root.body,
        authorName: root.authorName,
        authorUserId: root.author_user_id,
        createdAt: root.created_at,
        timestampMs: root.timestamp_ms,
        unread: initialUnread.has(root.id) || replies.some((r) => r.unread),
        isAuthor: root.author_user_id === currentUserId,
        replies,
      };
    });
  }, [comments, currentUserId, initialUnread]);

  const unreadCount = threads.filter((t) => t.unread).length;

  /** Persist a reply, then re-fetch so it — and its resolved author name —
   * come back from the server rather than being guessed at locally. */
  const addReply = React.useCallback(
    async (parentId: string, body: string): Promise<string | null> => {
      const res = await createReplyAction(callId, parentId, body);
      if (!res.ok) return res.error;
      router.refresh();
      return null;
    },
    [callId, router],
  );

  return { threads, unreadCount, addReply, markingRead: pending };
}
