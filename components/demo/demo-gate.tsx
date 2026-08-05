"use client";

import * as React from "react";
import { useMounted } from "@/lib/demo/use-demo";
import { TIMINGS } from "@/lib/demo/timings";

/**
 * Holds page content back until the client has mounted, showing a skeleton.
 *
 * Two jobs in one. The necessary one: the fixtures compute their timestamps
 * from `Date.now()` at module load, so a server render and the client render
 * that follows it would disagree about every date on the page and React would
 * report a hydration mismatch. Rendering nothing on the server sidesteps that
 * completely.
 *
 * The useful one: it gives us somewhere honest to show the loading skeletons
 * that production gets for free from Suspense, so the demo doesn't snap
 * instantly into a fully populated screen in a way no real app ever would.
 */
export function DemoGate({
  fallback,
  children,
  delayMs = TIMINGS.pageLoadMs,
}: {
  fallback: React.ReactNode;
  children: React.ReactNode;
  delayMs?: number;
}) {
  const mounted = useMounted();
  const [settled, setSettled] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setSettled(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);

  if (!mounted || !settled) return <>{fallback}</>;
  return <>{children}</>;
}
