import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/ui/misc";
import { EditableCallName } from "@/components/calls/editable-call-name";
import {
  CallStatusBadge,
  isNoteworthyStatus,
} from "@/components/calls/status-badge";
import { RetryButton } from "@/components/calls/retry-button";
import { formatDate, formatTime, formatDuration } from "@/lib/format";
import type { CallRow, OrganizationMemberRow } from "@/lib/db/types";

/**
 * Identity block for the call workspace: who recorded it, when, and how long.
 *
 * The metadata used to be four icon-label pairs — avatar+name, calendar+date,
 * clock+time, timer+duration — which read as four competing things when it is
 * really one line of provenance. It is now the rep's name plus two pills: when
 * the call happened, and how long it ran. Date and time belong together; nobody
 * reads one without the other.
 */
export function CallHeader({
  call,
  rep,
  action,
}: {
  call: CallRow;
  rep: OrganizationMemberRow | null;
  /** Rendered top-right, opposite the back link. The coaching toggle. */
  action?: React.ReactNode;
}) {
  const repLabel = rep?.display_name || rep?.email || "Unknown rep";

  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/app/calls"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to all calls
        </Link>
        {action}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <EditableCallName callId={call.id} initialName={call.name} />
        {/* No "Ready" here: a finished call is the normal case and doesn't need
            to spend attention in the corner. Only an in-flight or failed state
            earns a badge. */}
        {isNoteworthyStatus(call.status) && (
          <div className="flex items-center gap-2">
            <CallStatusBadge status={call.status} />
            {call.status === "failed" && <RetryButton callId={call.id} />}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <span className="flex items-center gap-2">
          <Avatar
            name={rep?.display_name}
            email={rep?.email}
            className="h-6 w-6 text-[10px]"
          />
          <span className="font-medium">{repLabel}</span>
        </span>

        <Pill>
          {formatDate(call.recorded_at)} · {formatTime(call.recorded_at)}
        </Pill>
        <Pill>{formatDuration(call.duration_seconds)}</Pill>
      </div>

      {call.status === "failed" && call.error_message && (
        <p className="rounded-xl bg-danger/15 px-3 py-2 text-sm text-danger">
          {call.error_message}
        </p>
      )}
    </header>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">
      {children}
    </span>
  );
}
