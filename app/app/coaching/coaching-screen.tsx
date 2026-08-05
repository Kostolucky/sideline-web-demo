"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { QueueItem } from "@/components/coaching/queue-item";
import { DemoGate } from "@/components/demo/demo-gate";
import { useDemoState } from "@/lib/demo/use-demo";
import { isAdmin, listCoachingQueue } from "@/lib/queries";
import Loading from "./loading";

/**
 * The coaching queue.
 *
 * Flag-gated OFF in production — coaching lives inside a call, and this screen
 * was parked. It is switched on here so the demo can show it; see
 * `lib/flags.ts`.
 */
export function CoachingScreen() {
  const router = useRouter();
  const state = useDemoState();
  const admin = isAdmin(state);

  React.useEffect(() => {
    if (!admin) router.replace("/app/calls");
  }, [admin, router]);

  if (!admin) return <Loading />;

  const queue = listCoachingQueue(state);

  return (
    <DemoGate fallback={<Loading />}>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold">Coaching queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Conversations worth reviewing today. Marking one reviewed clears it
            from your queue.
          </p>
        </div>

        {queue.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
            <CheckCircle2 className="h-8 w-8 text-success" />
            <p className="text-sm text-muted-foreground">
              You&apos;re all caught up — nothing waiting for review.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((item) => (
              <QueueItem
                key={item.call.id}
                call={item.call}
                rep={item.rep}
                summarySnippet={item.summarySnippet}
                reason={item.reason}
              />
            ))}
          </div>
        )}
      </div>
    </DemoGate>
  );
}
