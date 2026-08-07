"use client";

import { notFound } from "next/navigation";
import { CallWorkspace } from "@/components/calls/call-workspace";
import { DemoGate } from "@/components/demo/demo-gate";
import { useDemoState } from "@/lib/demo/use-demo";
import {
  currentMember,
  getCallComments,
  getCallDetail,
  getCoachingReadAt,
} from "@/lib/queries";
import Loading from "./loading";

/**
 * Full-bleed: this route opts out of the shared reading column (see
 * `ContentContainer`) so the coaching rail can sit flush against the right edge
 * of the viewport. `CallWorkspace` owns the whole page layout, header included,
 * because the review side and the coaching side share one audio player.
 */
export function CallScreen({ callId }: { callId: string }) {
  const state = useDemoState();

  const detail = getCallDetail(state, callId);
  const comments = getCallComments(state, callId);
  const lastReadAt = getCoachingReadAt(state, callId);
  const me = currentMember(state);

  // A rep asking for someone else's call gets the same 404 an unauthorised
  // read produces in production — the scoping lives in `getCallDetail`.
  if (!detail) notFound();

  const { call, rep, utterances, summary, analysis, audioUrl } = detail;
  const canComment = me.role === "admin";
  const isTargetRep = call.recorded_by === state.personaId;

  return (
    <DemoGate
      fallback={
        <div className="mx-auto w-full max-w-[72rem] px-4 py-6 sm:px-6 lg:py-8">
          <Loading />
        </div>
      }
    >
      <CallWorkspace
        call={call}
        rep={rep}
        summary={summary}
        analysis={analysis}
        utterances={utterances}
        audioUrl={audioUrl}
        comments={comments}
        currentUserId={state.personaId}
        repName={rep?.display_name || rep?.email || "Unknown rep"}
        notes={call.notes}
        canComment={canComment}
        isTargetRep={isTargetRep}
        coachingLastReadAt={lastReadAt}
      />
    </DemoGate>
  );
}
