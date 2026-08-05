import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import type { CallWithRep } from "@/lib/queries";
import { Avatar } from "@/components/ui/misc";
import {
  CallStatusBadge,
  isNoteworthyStatus,
} from "@/components/calls/status-badge";
import { formatDate, formatDuration } from "@/lib/format";

function repName(call: CallWithRep): string {
  return call.rep?.display_name || call.rep?.email || "Unknown";
}

/**
 * Title | Rep | Date | Duration — one template shared by the header and every
 * row, so the columns can't drift apart. `min-w` keeps the table honest on a
 * narrow viewport by letting the container scroll sideways rather than crushing
 * four columns into a phone width.
 */
const COLS =
  "grid min-w-[44rem] grid-cols-[minmax(0,1fr)_13rem_9rem_6rem] items-center gap-6 px-4";

/**
 * A plain table of past calls, newest first.
 *
 * Built with ARIA table roles over a CSS grid rather than `<table>` elements:
 * a real `<tr>` can't be wrapped in a link, so making the whole row clickable
 * would need an absolutely-positioned overlay. This way each row IS a single
 * anchor — one tab stop, one click target, correct semantics — while the grid
 * keeps the columns aligned.
 */
export function CallsList({
  calls,
  unreadCoaching,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: {
  calls: CallWithRep[];
  /** call id -> unread coaching for the signed-in person. */
  unreadCoaching?: Record<string, number>;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <div role="table" aria-label="Calls" aria-rowcount={calls.length}>
        <div role="rowgroup">
          <div
            role="row"
            className={`${COLS} border-b border-border bg-secondary py-2.5 text-section-label text-muted-foreground`}
          >
            <span role="columnheader">Title</span>
            <span role="columnheader">Rep</span>
            <span role="columnheader">Date</span>
            <span role="columnheader" className="text-right">
              Duration
            </span>
          </div>
        </div>

        {calls.length === 0 ? (
          // Empty state lives inside the table, so the header stays put and the
          // page doesn't reflow into a different shape.
          <div className="min-w-[44rem] px-4 py-12 text-center">
            <p className="text-sm font-medium">{emptyTitle}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              {emptyDescription}
            </p>
            {emptyAction && <div className="mt-4">{emptyAction}</div>}
          </div>
        ) : (
          <div role="rowgroup" className="divide-y divide-border">
            {calls.map((call) => (
              <Link
                key={call.id}
                role="row"
                href={`/app/calls/${call.id}`}
                className={`${COLS} py-2.5 text-sm transition-colors hover:bg-secondary`}
              >
                <span role="cell" className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-medium">{call.name}</span>
                  {/* Silence means the call is fine; a badge means it needs
                      attention or is still in flight. */}
                  {isNoteworthyStatus(call.status) && (
                    <CallStatusBadge status={call.status} />
                  )}
                  {/* Unread coaching for whoever is signed in — same column as
                      the title so it reads as belonging to this call. */}
                  {(unreadCoaching?.[call.id] ?? 0) > 0 && (
                    <span
                      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-tint px-2 py-0.5 text-xs font-medium text-brand-text"
                      title={`${unreadCoaching![call.id]} unread coaching ${
                        unreadCoaching![call.id] === 1 ? "message" : "messages"
                      }`}
                    >
                      <MessageSquareText aria-hidden className="h-3 w-3" />
                      {unreadCoaching![call.id]}
                      <span className="sr-only"> unread coaching</span>
                    </span>
                  )}
                </span>

                <span
                  role="cell"
                  className="flex min-w-0 items-center gap-2 text-muted-foreground"
                >
                  <Avatar
                    name={call.rep?.display_name}
                    email={call.rep?.email}
                    className="h-5 w-5 text-[9px]"
                  />
                  <span className="truncate">{repName(call)}</span>
                </span>

                <span role="cell" className="text-muted-foreground">
                  {formatDate(call.recorded_at)}
                </span>

                <span
                  role="cell"
                  className="text-right tabular-nums text-muted-foreground"
                >
                  {formatDuration(call.duration_seconds)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
