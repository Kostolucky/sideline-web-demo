"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";
import { retryCallAction } from "@/lib/calls/actions";

/**
 * Retries a failed call's processing.
 *
 * In the demo the call goes back to "Transcribing" for a few seconds and then
 * fails again — the fixture has no transcript to recover, and pretending
 * otherwise would quietly remove the only failure state on the board.
 */
export function RetryButton({ callId }: { callId: string }) {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function retry() {
    setPending(true);
    setError(null);
    const res = await retryCallAction(callId);
    setPending(false);
    if (!res.ok) setError(res.error);
  }

  return (
    <div className="space-y-2">
      <Button variant="secondary" size="sm" onClick={retry} disabled={pending}>
        {pending ? <Spinner /> : <RefreshCw className="h-4 w-4" />}
        Retry processing
      </Button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
