"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MessageSquareText } from "lucide-react";
import { createCommentAction } from "@/lib/comments/actions";
import type { CommentWithAuthor } from "@/lib/queries";
import { CommentThread } from "./comment-thread";
import { CommentComposer } from "./comment-composer";
import { useCoachingThreads } from "./use-coaching-threads";

/**
 * The coaching rail: a thread of messages between the Admin and the rep about
 * this call.
 *
 * It stays beside the review content rather than living behind a tab, because
 * Summary and Recording are two ways of *reviewing* a call while coaching is the
 * action you take *while* reviewing — putting it in a third tab would mean
 * leaving the evidence to write about it.
 *
 * Admins start threads (persisted). Everyone can reply, but replies are
 * session-local until the backend supports them — see `types.ts`.
 */
export function CoachingPanel({
  callId,
  comments,
  currentUserId,
  canComment,
  lastReadAt,
  currentMs,
  hasAudio,
  onSeek,
}: {
  callId: string;
  comments: CommentWithAuthor[];
  currentUserId: string;
  /** Admin — may start a thread. */
  canComment: boolean;
  /** This viewer's own coaching read watermark for this call. */
  lastReadAt: string | null;
  /** Live playback position, offered as an optional anchor for a new message. */
  currentMs: number;
  hasAudio: boolean;
  onSeek: (ms: number) => void;
}) {
  const router = useRouter();
  const { threads, unreadCount, addReply } = useCoachingThreads({
    callId,
    comments,
    currentUserId,
    lastReadAt,
  });

  return (
    <section
      id="coaching"
      aria-labelledby="coaching-heading"
      className="flex flex-col gap-3"
    >
      <div className="flex items-center gap-2">
        <h2 id="coaching-heading" className="text-sm font-semibold">
          Coaching
        </h2>
        {unreadCount > 0 && (
          <span className="inline-flex items-center rounded-full bg-brand-tint px-2 py-0.5 text-xs font-medium text-brand-text">
            {unreadCount} new
          </span>
        )}
      </div>

      {canComment && (
        <div className="rounded-xl border border-border bg-card p-3">
          <CommentComposer
            placeholder="Ask a question or leave feedback…"
            submitLabel="Send"
            attachMs={currentMs}
            canAttach={hasAudio}
            onSubmit={async (body, timestampMs) => {
              const res = await createCommentAction(callId, timestampMs, body);
              if (!res.ok) return res.error;
              router.refresh();
            }}
          />
        </div>
      )}

      {threads.length === 0 ? (
        canComment ? (
          <div className="rounded-xl border border-dashed border-border bg-card px-4 py-8 text-center">
            <MessageSquareText className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium">No coaching yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Leave general feedback, or attach a moment while you listen.
            </p>
          </div>
        ) : (
          // A rep with no feedback gets a quiet line, not a manager-shaped form.
          <p className="px-1 text-sm text-muted-foreground">
            No coaching on this call yet. When your manager leaves feedback,
            it&apos;ll appear here and you can reply.
          </p>
        )
      ) : (
        <ul className="flex flex-col gap-2.5">
          {threads.map((thread) => (
            <li key={thread.id}>
              <CommentThread
                thread={thread}
                callId={callId}
                onSeek={onSeek}
                onReply={addReply}
                canSeek={hasAudio}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
