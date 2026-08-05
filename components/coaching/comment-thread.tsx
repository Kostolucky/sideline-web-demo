"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CornerDownRight, Pencil, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { CommentComposer } from "./comment-composer";
import {
  deleteCommentAction,
  updateCommentAction,
} from "@/lib/comments/actions";
import { formatDateTime, formatTime, formatTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CoachingThread } from "./types";

/**
 * One coaching thread: a persisted message, its persisted replies, and a reply
 * box. Reads as a conversation — "Kris · 10:14 AM", and "Kris · 10:18 AM ·
 * Recording 12:42" when the message is about a specific moment.
 */
export function CommentThread({
  thread,
  callId,
  onSeek,
  onReply,
  canSeek,
}: {
  thread: CoachingThread;
  callId: string;
  onSeek: (ms: number) => void;
  /** Returns an error string to surface it inline; null on success. */
  onReply: (parentId: string, body: string) => Promise<string | null>;
  /** There's a recording to jump into. */
  canSeek: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [replying, setReplying] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function remove() {
    setBusy(true);
    await deleteCommentAction(thread.id, callId);
    setBusy(false);
    router.refresh();
  }

  return (
    <article
      className={cn(
        "rounded-xl border bg-card p-3",
        thread.unread ? "border-brand-text/40" : "border-border",
      )}
      aria-label={`Coaching from ${thread.authorName}`}
    >
      <header className="flex items-start gap-2">
        <Avatar name={thread.authorName} className="h-6 w-6 text-[10px]" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
            <span className="font-semibold">{thread.authorName}</span>
            <span className="text-muted-foreground" aria-hidden>
              ·
            </span>
            <time
              dateTime={thread.createdAt}
              title={formatDateTime(thread.createdAt)}
              className="text-muted-foreground"
            >
              {formatTime(thread.createdAt)}
            </time>
            {thread.timestampMs != null && (
              <>
                <span className="text-muted-foreground" aria-hidden>
                  ·
                </span>
                <button
                  type="button"
                  onClick={() => onSeek(thread.timestampMs as number)}
                  disabled={!canSeek}
                  title={canSeek ? "Jump to this moment" : undefined}
                  className="rounded font-mono text-[11px] text-brand-text transition-colors hover:underline disabled:cursor-default disabled:text-muted-foreground disabled:no-underline"
                >
                  Recording {formatTimestamp(thread.timestampMs)}
                </button>
              </>
            )}
            {thread.unread && (
              <span className="rounded-full bg-brand-tint px-1.5 text-meta font-semibold text-brand-text">
                New
              </span>
            )}
          </div>
        </div>

        {thread.isAuthor && !editing && (
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Edit message"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              aria-label="Delete message"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </header>

      {editing ? (
        <div className="mt-2">
          <CommentComposer
            placeholder="Edit this message…"
            submitLabel="Save"
            autoFocus
            rows={3}
            onCancel={() => setEditing(false)}
            onSubmit={async (body) => {
              const res = await updateCommentAction(thread.id, callId, body);
              if (!res.ok) return res.error;
              setEditing(false);
              router.refresh();
            }}
          />
        </div>
      ) : (
        <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed">
          {thread.body}
        </p>
      )}

      {thread.replies.length > 0 && (
        <ul className="mt-2.5 space-y-2.5 border-l-2 border-border pl-2.5">
          {thread.replies.map((r) => (
            <li key={r.id}>
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
                <span className="font-semibold">{r.authorName}</span>
                <span className="text-muted-foreground" aria-hidden>
                  ·
                </span>
                <time
                  dateTime={r.createdAt}
                  title={formatDateTime(r.createdAt)}
                  className="text-muted-foreground"
                >
                  {formatTime(r.createdAt)}
                </time>
                {r.unread && (
                  <span className="rounded-full bg-brand-tint px-1.5 text-meta font-semibold text-brand-text">
                    New
                  </span>
                )}
              </div>
              <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed">
                {r.body}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2">
        {replying ? (
          <CommentComposer
            placeholder="Write a reply…"
            submitLabel="Reply"
            rows={2}
            compact
            autoFocus
            onCancel={() => setReplying(false)}
            onSubmit={async (body) => {
              const error = await onReply(thread.id, body);
              if (error) return error;
              setReplying(false);
            }}
          />
        ) : (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="-ml-3"
            onClick={() => setReplying(true)}
          >
            <CornerDownRight className="h-3.5 w-3.5" />
            Reply
          </Button>
        )}
      </div>
    </article>
  );
}
