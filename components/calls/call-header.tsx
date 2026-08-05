import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Timer } from "lucide-react";
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
 * Identity block for the call workspace: who recorded it, when, how long, and
 * where it is in processing — all above the fold, so the tabs below can be purely
 * about content. (These facts used to be buried in a "Call details" card inside
 * the summary tab.)
 */
export function CallHeader({
  call,
  rep,
}: {
  call: CallRow;
  rep: OrganizationMemberRow | null;
}) {
  const repLabel = rep?.display_name || rep?.email || "Unknown rep";

  return (
    <header className="flex flex-col gap-3">
      <Link
        href="/app/calls"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to all calls
      </Link>

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

      <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <div className="flex items-center gap-2">
          <dt className="sr-only">Recorded by</dt>
          <dd className="flex items-center gap-2">
            <Avatar
              name={rep?.display_name}
              email={rep?.email}
              className="h-6 w-6 text-[10px]"
            />
            <span className="font-medium">{repLabel}</span>
          </dd>
        </div>
        <Meta icon={<Calendar className="h-4 w-4" />} label="Date">
          {formatDate(call.recorded_at)}
        </Meta>
        <Meta icon={<Clock className="h-4 w-4" />} label="Time">
          {formatTime(call.recorded_at)}
        </Meta>
        <Meta icon={<Timer className="h-4 w-4" />} label="Duration">
          {formatDuration(call.duration_seconds)}
        </Meta>
      </dl>

      {call.status === "failed" && call.error_message && (
        <p className="rounded-xl bg-danger/15 px-3 py-2 text-sm text-danger">
          {call.error_message}
        </p>
      )}
    </header>
  );
}

function Meta({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <span aria-hidden>{icon}</span>
      <dt className="sr-only">{label}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  );
}
