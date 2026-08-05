"use client";

import * as React from "react";
import { injectIncomingComment, getState } from "@/lib/demo/store";
import { TIMINGS } from "@/lib/demo/timings";
import { ADMIN_PERSON_ID, REP_PERSON_ID } from "@/lib/demo/content";

/**
 * The scripted "a coaching message just arrived" moment.
 *
 * Production has no push channel — both clients poll — so a message genuinely
 * does appear a few seconds after it is written. This reproduces that once,
 * about twenty seconds into a session, so an unread badge visibly lands on the
 * calls list while someone is looking at it. Far more convincing than a badge
 * that was simply there from the first paint.
 *
 * Fires at most once per page load, and only for the persona who would actually
 * receive it. Switch it off in `timings.ts`.
 */
export function IncomingCoaching() {
  const fired = React.useRef(false);

  React.useEffect(() => {
    const { enabled, afterMs, callId } = TIMINGS.incomingCoaching;
    if (!enabled || fired.current) return;

    const timer = setTimeout(() => {
      if (fired.current) return;
      fired.current = true;

      const state = getState();
      // Send it from whoever the viewer is NOT, so it always lands as unread.
      const viewerIsAdmin =
        state.members.find((m) => m.user_id === state.personaId)?.role ===
        "admin";
      const authorId = viewerIsAdmin ? REP_PERSON_ID : ADMIN_PERSON_ID;

      injectIncomingComment(
        callId,
        authorId,
        viewerIsAdmin
          ? "Just re-listened to the ridge vent part — I'm going to use that framing on the Delgado appeal too. Thanks for flagging it."
          : "One more thing on this one: when the carrier calls back, lead with the test-square count rather than the photos. The number is what moves them.",
        null,
      );
    }, afterMs);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
