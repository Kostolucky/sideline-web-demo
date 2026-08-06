/**
 * Shaping for the coaching conversation — a back-and-forth between the Admin
 * and one rep about a single call.
 *
 * A direct port of the mobile app's `lib/calls/coaching.ts`, so both clients
 * order, group and attribute messages identically. The web used to render this
 * as threads with nested replies; it is a chat on both platforms now, because
 * that is what the conversation actually is.
 *
 * Human messages only. Analysis output is deliberately absent: coaching here is
 * something a person said to another person, and mixing generated suggestions
 * into the thread muddies who is actually talking.
 *
 * Pure — no React, no store — so ordering, sidedness and day grouping are
 * testable without rendering anything.
 */

import type { MemberRole } from "@/lib/constants";
import type { CommentWithAuthor } from "@/lib/queries";

export interface CoachingMessage {
  kind: "message";
  id: string;
  /** Sent by the signed-in person — rendered on the right. */
  mine: boolean;
  /** Who sent it. Null for your own messages, where the side already says so. */
  authorName: string | null;
  body: string;
  /** "9:14 AM" */
  time: string;
  /** ISO, for the `<time>` element's machine-readable value. */
  createdAt: string;
  /** Playback offset this message is anchored to, if any. */
  timestampMs: number | null;
  /** Unread by the viewer when the page loaded. */
  unread: boolean;
}

export interface CoachingDayBreak {
  kind: "day";
  id: string;
  label: string;
}

export type CoachingItem = CoachingMessage | CoachingDayBreak;

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** "Today" / "Yesterday" / "Thursday, May 28". `now` is injectable for tests. */
export function dayLabel(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const diff = (startOfDay(now) - startOfDay(then)) / 86_400_000;
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return then.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * The conversation, oldest first, with a day break wherever the calendar date
 * changes. Newest ends up last so the view can open at the bottom, the way a
 * messaging app does.
 *
 * Replies are flattened into the timeline rather than nested under a root: in a
 * two-person conversation the nesting carried no information that the order and
 * the sides don't already convey.
 */
export function buildCoachingThread(
  comments: CommentWithAuthor[],
  options: {
    viewerId: string;
    /** Ids unread by the viewer when the page loaded. */
    unreadIds?: ReadonlySet<string>;
    now?: Date;
  },
): CoachingItem[] {
  const { viewerId, unreadIds, now } = options;

  const ordered = [...comments].sort(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
  );

  const items: CoachingItem[] = [];
  let lastDay: number | null = null;

  for (const c of ordered) {
    const day = startOfDay(new Date(c.created_at));
    if (day !== lastDay) {
      items.push({
        kind: "day",
        id: `day-${day}`,
        label: dayLabel(c.created_at, now),
      });
      lastDay = day;
    }

    const mine = c.author_user_id === viewerId;
    items.push({
      kind: "message",
      id: c.id,
      mine,
      authorName: mine ? null : c.authorName,
      body: c.body,
      time: timeLabel(c.created_at),
      createdAt: c.created_at,
      timestampMs: c.timestamp_ms,
      unread: unreadIds?.has(c.id) ?? false,
    });
  }

  return items;
}

/**
 * The id of the conversation's root message, if one exists.
 *
 * A rep may reply to a thread but not open one — that rule lives in the
 * database in production — so their messages need a parent to attach to.
 */
export function rootCommentId(comments: CommentWithAuthor[]): string | null {
  const roots = comments
    .filter((c) => !c.parent_id)
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  return roots[0]?.id ?? null;
}

/** Composer prompt. An Admin opens the conversation; a User answers one. */
export function composerPlaceholder(role: MemberRole): string {
  return role === "admin" ? "Ask a question or leave coaching…" : "Reply…";
}

export interface EmptyCopy {
  title: string;
  body: string;
}

/** What an untouched thread says — an Admin can act, a User is waiting. */
export function emptyCopy(role: MemberRole): EmptyCopy {
  return role === "admin"
    ? {
        title: "No coaching yet",
        body: "Leave feedback for this rep, or attach a moment while you listen.",
      }
    : {
        title: "No coaching yet",
        body: "When your manager leaves feedback, it'll appear here and you can reply.",
      };
}
