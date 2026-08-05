/**
 * The scripted upload → processing → ready pipeline.
 *
 * Production does the real thing: direct-to-storage upload, AssemblyAI
 * transcription via webhook, then an OpenAI summary and insights pass. That
 * takes minutes and costs money. This walks a new call through the same visible
 * states on a timeline, then attaches pre-authored content so the call opens
 * onto something real instead of an empty shell.
 *
 * Every duration comes from `timings.ts` — nothing here hardcodes a delay.
 */

import { FRESH_CALL_CONTENT, isoDaysAgo } from "./content";
import { TIMINGS } from "./timings";
import { attachFreshContent, setCallStatus } from "./store";
import type {
  CallSummaryRow,
  ConversationAnalysisRow,
  TranscriptUtteranceRow,
} from "@/lib/db/types";

export interface PipelineProgress {
  stage: string;
  /** 0–100, for the upload progress bar. */
  pct: number;
}

function freshRows(callId: string): {
  utterances: TranscriptUtteranceRow[];
  summary: CallSummaryRow;
  analysis: ConversationAnalysisRow;
} {
  const now = isoDaysAgo(0, new Date().getHours(), new Date().getMinutes());
  const c = FRESH_CALL_CONTENT;

  return {
    utterances: c.utterances.map((u, i) => ({
      id: `${callId}-u${i}`,
      call_id: callId,
      speaker: u.speaker,
      start_ms: u.startMs,
      end_ms: u.endMs,
      text: u.text,
      sequence_number: i,
    })),
    summary: {
      call_id: callId,
      participants_context: c.summary.participantsContext,
      summary: c.summary.summary,
      main_takeaways: c.summary.mainTakeaways,
      next_steps: c.summary.nextSteps,
      created_at: now,
    },
    analysis: {
      call_id: callId,
      outcome: c.insights.outcome,
      primary_improvement: c.insights.primaryImprovement.area,
      result: {
        outcome: c.insights.outcome,
        strengths: c.insights.strengths,
        primary_improvement: c.insights.primaryImprovement,
        objections: c.insights.objections,
        next_steps: c.insights.nextSteps,
        coaching_note: c.insights.coachingNote,
        customer_follow_up_draft: c.insights.customerFollowUpDraft,
      },
      created_at: now,
    },
  };
}

/**
 * Advance a freshly inserted call through the pipeline.
 *
 * `onProgress` is optional — the recorder uses it to drive its progress bar,
 * while a call started elsewhere just needs the status transitions. Returns a
 * cancel function so a component that unmounts mid-pipeline doesn't leave
 * timers running.
 */
export function runRecordingPipeline(
  callId: string,
  onProgress?: (p: PipelineProgress) => void,
): () => void {
  const timers: ReturnType<typeof setTimeout>[] = [];
  const at = (ms: number, fn: () => void) => {
    timers.push(setTimeout(fn, ms));
  };

  const { queuedMs, uploadingMs, uploadedMs, processingMs } = TIMINGS.pipeline;

  onProgress?.({ stage: "Preparing upload", pct: 10 });

  at(queuedMs, () => {
    onProgress?.({ stage: "Uploading audio", pct: 35 });
    setCallStatus(callId, "uploading");

    // Ramp the bar across the upload window so it reads as real progress
    // rather than three jumps.
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      at(queuedMs + (uploadingMs / steps) * i, () => {
        onProgress?.({
          stage: "Uploading audio",
          pct: 35 + Math.round((35 * i) / steps),
        });
      });
    }
  });

  const uploadedAt = queuedMs + uploadingMs;
  at(uploadedAt, () => {
    onProgress?.({ stage: "Upload complete", pct: 72 });
    setCallStatus(callId, "uploaded");
  });

  const transcribeAt = uploadedAt + uploadedMs;
  at(transcribeAt, () => {
    onProgress?.({ stage: "Starting transcription", pct: 88 });
    setCallStatus(callId, "transcribing");
  });

  at(transcribeAt + processingMs, () => {
    const { utterances, summary, analysis } = freshRows(callId);
    attachFreshContent(callId, utterances, summary, analysis);
    onProgress?.({ stage: "Done", pct: 100 });
  });

  return () => {
    for (const t of timers) clearTimeout(t);
  };
}
