"use client";

import * as React from "react";
import { getState, subscribe, type DemoState } from "./store";
import { currentMember, isAdmin } from "@/lib/queries";
import type { OrganizationMemberRow } from "@/lib/db/types";

/** Subscribe to the demo store. Re-renders on every mutation. */
export function useDemoState(): DemoState {
  return React.useSyncExternalStore(subscribe, getState, getState);
}

export function useCurrentMember(): OrganizationMemberRow {
  const state = useDemoState();
  return currentMember(state);
}

export function useIsAdmin(): boolean {
  return isAdmin(useDemoState());
}

/**
 * True once the component has mounted on the client.
 *
 * The fixtures are built from `Date.now()` at module load, so a server render
 * and the subsequent client render would disagree about every timestamp and
 * React would report a hydration mismatch. Gating page content on mount avoids
 * that entirely — and the skeleton it shows in the meantime is the simulated
 * loading state we wanted anyway.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
}

/**
 * Mount gate plus a deliberate delay, so skeletons are actually visible rather
 * than flashing for one frame. Returns false until both have elapsed.
 */
export function useSettled(delayMs: number): boolean {
  const [settled, setSettled] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setSettled(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);
  return settled;
}
