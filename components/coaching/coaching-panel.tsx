"use client";

import * as React from "react";
import { ArrowUp, Clock, MessageSquareText, Play } from "lucide-react";
import { Spinner } from "@/components/ui/misc";
import { useCoachingChat } from "./use-coaching-chat";
import {
  composerPlaceholder,
  emptyCopy,
  type CoachingMessage,
} from "@/lib/coaching/thread";
import { formatTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MemberRole } from "@/lib/constants";
import type { CommentWithAuthor } from "@/lib/queries";

/**
 * The coaching column: a two-sided message thread about this call.
 *
 * It reads as a conversation because that is what it is — one Admin and one
 * rep, going back and forth. Your own messages sit right in a green tint; the
 * other person's sit left on grey, named. Same shape as the mobile app's
 * Coaching pane, so the two clients feel like one product.
 *
 * It replaced a stack of bordered "thread" cards with nested replies and a
 * Reply button under each. In a two-person conversation that nesting carried no
 * information the order and the sides don't already convey, and it made three
 * exchanges look like an issue tracker.
 *
 * The column stays beside the review content rather than living behind a tab:
 * Summary and Recording are two ways of *reviewing* a call, while coaching is
 * the thing you do *while* reviewing — a tab would mean leaving the evidence to
 * write about it.
 */
export function CoachingPanel({
  callId,
  comments,
  currentUserId,
  canComment,
  lastReadAt,
  currentMs,
  hasAudio,
  role,
  onSeek,
}: {
  callId: string;
  comments: CommentWithAuthor[];
  currentUserId: string;
  /** Admin — may open the conversation as well as reply. */
  canComment: boolean;
  /** This viewer's own coaching read watermark for this call. */
  lastReadAt: string | null;
  /** Live playback position, offered as an optional anchor for a new message. */
  currentMs: number;
  hasAudio: boolean;
  role: MemberRole;
  onSeek: (ms: number) => void;
}) {
  const { items, unreadCount, send, canSend } = useCoachingChat({
    callId,
    comments,
    currentUserId,
    lastReadAt,
    isAdmin: canComment,
  });

  const [draft, setDraft] = React.useState("");
  const [attach, setAttach] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const atBottom = React.useRef(true);

  // Anchoring to 0:00 would be meaningless, so the option only appears once the
  // audio has actually been moved to a moment worth pointing at.
  const momentMs = Math.floor(currentMs);
  const canAttach = hasAudio && momentMs > 0;
  React.useEffect(() => {
    if (!canAttach && attach) setAttach(false);
  }, [canAttach, attach]);

  /**
   * Open on the newest message, and follow new ones — but only while the reader
   * is already at the bottom, so scrolling back through history isn't yanked
   * away when something arrives.
   */
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el && atBottom.current) el.scrollTop = el.scrollHeight;
  }, [items]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;

    setSending(true);
    setError(null);
    const failure = await send(body, attach && canAttach ? momentMs : null);
    setSending(false);

    if (failure) {
      // The draft is deliberately left in place so a retry is one click, not a
      // retype.
      setError(failure);
      return;
    }
    setDraft("");
    setAttach(false);
    atBottom.current = true;
  }

  const empty = emptyCopy(role);
  const hasThread = items.length > 0;

  return (
    <section
      id="coaching"
      aria-labelledby="coaching-heading"
      className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm xl:h-full"
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
        <h2 id="coaching-heading" className="text-sm font-semibold">
          Coaching
        </h2>
        {unreadCount > 0 && (
          <span className="inline-flex items-center rounded-full bg-brand-tint px-2 py-0.5 text-xs font-medium text-brand-text">
            {unreadCount} new
          </span>
        )}
      </header>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        // A minimum height so the column still reads as a conversation when it
        // stacks under the content below xl, where it has no height to fill.
        className="min-h-[20rem] flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {hasThread ? (
          items.map((item) =>
            item.kind === "day" ? (
              <p
                key={item.id}
                className="pt-1 text-center text-meta text-muted-foreground"
              >
                {item.label}
              </p>
            ) : (
              <MessageBubble key={item.id} message={item} onSeek={onSeek} />
            ),
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary">
              <MessageSquareText className="h-5 w-5 text-muted-foreground" />
            </span>
            <p className="text-sm font-medium">{empty.title}</p>
            <p className="max-w-[16rem] text-sm text-muted-foreground">
              {empty.body}
            </p>
          </div>
        )}
      </div>

      {canSend && (
        <form
          onSubmit={submit}
          className="shrink-0 space-y-2 border-t border-border p-3"
        >
          {error && <p className="text-sm text-danger">{error}</p>}

          {canAttach && (
            <button
              type="button"
              onClick={() => setAttach((v) => !v)}
              aria-pressed={attach}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-colors",
                attach
                  ? "border-brand-text/40 bg-brand-tint text-brand-text"
                  : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              Recording {formatTimestamp(momentMs)}
            </button>
          )}

          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                // Enter sends, Shift+Enter is a newline — the messaging default.
                if (e.key === "Enter" && !e.shiftKey) submit(e);
              }}
              rows={1}
              disabled={sending}
              placeholder={composerPlaceholder(role)}
              aria-label={composerPlaceholder(role)}
              className="max-h-32 min-h-[2.5rem] w-full resize-none rounded-2xl border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground hover:border-muted-foreground focus-visible:border-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              aria-label="Send message"
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
                draft.trim() && !sending
                  ? "border border-brand-text bg-brand text-brand-foreground"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              {sending ? <Spinner /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

/** One message. Side, colour and corner all encode who sent it. */
function MessageBubble({
  message,
  onSeek,
}: {
  message: CoachingMessage;
  onSeek: (ms: number) => void;
}) {
  const { mine, authorName, body, time, createdAt, timestampMs, unread } =
    message;

  return (
    <div className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[88%] px-3 py-2",
          // The squared-off corner points at the sender, the way every
          // messaging app signals a side.
          mine
            ? "rounded-2xl rounded-br-sm bg-brand-tint"
            : "rounded-2xl rounded-bl-sm bg-secondary",
          unread && !mine && "ring-1 ring-brand-text/40",
        )}
      >
        {(authorName || timestampMs != null) && (
          <div className="mb-0.5 flex flex-wrap items-center gap-x-1.5 text-meta">
            {authorName && (
              <span className="font-semibold text-brand-text">{authorName}</span>
            )}
            {authorName && timestampMs != null && (
              <span className="text-muted-foreground" aria-hidden>
                ·
              </span>
            )}
            {timestampMs != null && (
              <button
                type="button"
                onClick={() => onSeek(timestampMs)}
                title="Jump to this moment"
                className="inline-flex items-center gap-1 rounded font-mono text-brand-text transition-opacity hover:opacity-80"
              >
                <Play className="h-2.5 w-2.5" />
                Recording {formatTimestamp(timestampMs)}
              </button>
            )}
          </div>
        )}

        <p className="whitespace-pre-line text-sm leading-relaxed">{body}</p>
      </div>

      <time
        dateTime={createdAt}
        className="mt-1 px-1 text-meta text-muted-foreground"
      >
        {time}
      </time>
    </div>
  );
}
