"use client";

import { notFound } from "next/navigation";
import { CallHeader } from "@/components/calls/call-header";
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

export function CallScreen({ callId }: { callId: string }) {
  const state = useDemoState();

  const detail = getCallDetail(state, callId);
  const comments = getCallComments(state, callId);
  const lastReadAt = getCoachingReadAt(state, callId);
  const me = currentMember(state);

  // A rep asking for someone else's call gets the same 404 an unauthorised
  // read produces in production — the scoping lives in `getCallDetail`.
  if (!detail) notFound();

  const { call, rep, utterances, summary, audioUrl } = detail;
  const canComment = me.role === "admin";
  const isTargetRep = call.recorded_by === state.personaId;

  return (
    <DemoGate fallback={<Loading />}>
      <div className="space-y-5">
        <CallHeader call={call} rep={rep} />

        <CallWorkspace
          call={call}
          summary={summary}
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
      </div>
    </DemoGate>
  );
}
