"use client";

import { Sparkles } from "lucide-react";
import type { CallRow, CallSummaryRow } from "@/lib/db/types";
import { RetryButton } from "@/components/calls/retry-button";
import { RepNotes } from "@/components/calls/rep-notes";
import { ReviewPanel, ReviewSection } from "@/components/calls/review-section";
import { IN_PROGRESS_STATUSES } from "@/lib/constants";

/**
 * The Summary tab: the AI account of the call, then the rep's notes. Nothing else.
 *
 * It previously also carried next steps, focus/strengths/objections, a drafted
 * follow-up, cited evidence and a coaching note. That was too much to read past
 * to find the two things people actually come here for, so the rest is gone —
 * recoverable from git history if any of it is wanted back.
 */
export function SummaryView({
  call,
  summary,
  notes,
  repName,
  canEditNotes,
}: {
  call: CallRow;
  summary: CallSummaryRow | null;
  notes: string | null;
  repName: string;
  /** The viewer recorded this call, so they may write the notes. */
  canEditNotes: boolean;
}) {
  const inProgress = IN_PROGRESS_STATUSES.includes(call.status);
  const context = [summary?.participants_context, summary?.summary]
    .filter((s) => s && s.trim().length > 0)
    .join("\n\n");

  return (
    <ReviewPanel>
      <ReviewSection
        title="AI summary"
        icon={<Sparkles className="h-4 w-4 text-brand-text" />}
      >
        {summary ? (
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">
            {context}
          </p>
        ) : call.status === "failed" ? (
          <div>
            <p className="text-sm text-muted-foreground">
              {call.error_message || "Summary generation failed."}
            </p>
            <div className="mt-3">
              <RetryButton callId={call.id} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {inProgress
              ? "Generating summary… this updates automatically when it's ready."
              : "The summary is generated automatically once the transcript is ready."}
          </p>
        )}
      </ReviewSection>

      {/* RepNotes brings its own heading, so it sits in a plain padded row. */}
      <div className="p-4 sm:p-5">
        <RepNotes
          callId={call.id}
          initialNotes={notes}
          canEdit={canEditNotes}
          repName={repName}
        />
      </div>
    </ReviewPanel>
  );
}
