import { cn } from "@/lib/utils";
import type { CallStatus } from "@/lib/constants";

/**
 * Single source of truth for how a processing status looks. In-flight stages are
 * neutral (light-gray chip, near-black text) so the green keeps meaning "ready";
 * deleted is outlined so it can't be mistaken for an in-flight stage.
 */
const STATUS: Record<CallStatus, { label: string; className: string }> = {
  created: { label: "Processing", className: "bg-secondary text-foreground" },
  uploading: { label: "Uploading", className: "bg-secondary text-foreground" },
  uploaded: { label: "Processing", className: "bg-secondary text-foreground" },
  transcribing: { label: "Transcribing", className: "bg-secondary text-foreground" },
  summarizing: { label: "Summarizing", className: "bg-secondary text-foreground" },
  ready: { label: "Ready", className: "bg-success/15 text-success" },
  failed: { label: "Failed", className: "bg-danger/15 text-danger" },
  deleted: {
    label: "Deleted",
    className: "border border-border-strong text-muted-foreground",
  },
};

export function statusLabel(status: CallStatus): string {
  return STATUS[status].label;
}

/**
 * True when a status is worth showing in a list.
 *
 * A finished, usable call is the normal case, so badging every one of them with
 * "Ready" just adds noise to scan past — silence means fine. Only an active
 * state or a failure earns a badge. (The call *detail* header still shows the
 * status unconditionally, where a single explicit answer is useful.)
 */
export function isNoteworthyStatus(status: CallStatus): boolean {
  return status !== "ready" && status !== "deleted";
}

export function CallStatusBadge({
  status,
  className,
}: {
  status: CallStatus;
  className?: string;
}) {
  const meta = STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
