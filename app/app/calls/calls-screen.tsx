"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CallsList } from "@/components/calls/calls-list";
import {
  CallsFilters,
  type MemberOption,
} from "@/components/calls/calls-filters";
import { DemoGate } from "@/components/demo/demo-gate";
import { AskBar } from "@/components/calls/ask-bar";
import { buttonVariants } from "@/components/ui/button";
import { useDemoState } from "@/lib/demo/use-demo";
import { getUnreadCoachingByCall, listCalls, listMembers } from "@/lib/queries";
import {
  isDateRangeActive,
  parseDateRange,
  resolveDateRange,
} from "@/lib/calls/date-range";
import Loading from "./loading";

export function CallsScreen() {
  const params = useSearchParams();
  const state = useDemoState();

  const member = params.get("member") ?? undefined;
  const range = params.get("range") ?? undefined;
  const from = params.get("from") ?? undefined;
  const to = params.get("to") ?? undefined;
  const q = params.get("q") ?? undefined;

  const activeRange = parseDateRange(range);
  const bounds = resolveDateRange(activeRange, from, to);

  const members = listMembers(state);
  // Ordered by `recorded_at` descending, so same-day calls still come back
  // newest first even though the table shows only the date.
  const calls = listCalls(state, { recordedBy: member, search: q, ...bounds });
  const unreadCoaching = getUnreadCoachingByCall(state);

  // Members who could have recorded calls (have signed in at least once).
  const memberOptions: MemberOption[] = members
    .filter((m) => m.user_id)
    .map((m) => ({
      userId: m.user_id as string,
      name: m.display_name || m.email,
    }));

  const filtersActive =
    Boolean(member) ||
    Boolean(q?.trim()) ||
    isDateRangeActive(activeRange, from, to);

  return (
    <DemoGate fallback={<Loading />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calls</h1>
          <p className="text-sm text-muted-foreground">
            Review recorded conversations across your team.
          </p>
        </div>

        <CallsFilters
          members={memberOptions}
          member={member}
          range={range}
          from={from}
          to={to}
          search={q}
        />

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {calls.length} {calls.length === 1 ? "call" : "calls"}
          </p>

          <CallsList
            calls={calls}
            unreadCoaching={unreadCoaching}
            // Two distinct messages: an empty workspace and a filter that
            // matched nothing are very different problems.
            emptyTitle={
              filtersActive
                ? "No calls match these filters"
                : "No calls recorded yet"
            }
            emptyDescription={
              filtersActive
                ? "Try a wider date range, a different team member, or clear the search."
                : "Recorded calls will appear here once someone records and uploads one."
            }
            emptyAction={
              filtersActive ? (
                <Link
                  href="/app/calls"
                  className={buttonVariants({
                    variant: "secondary",
                    size: "sm",
                  })}
                >
                  Clear all filters
                </Link>
              ) : undefined
            }
          />
        </div>

        {/* The same bar as a call's Summary tab, floating over the list.
            No `reply`: there is no single call to answer about here, so it is
            inert — the surface exists, the answering does not. Positioning
            lives here rather than in the component, since the two surfaces sit
            in very different layouts. Raised above the mobile bottom nav and
            offset past the sidebar on desktop. */}
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 px-4 lg:bottom-6 lg:left-64">
          <div className="pointer-events-auto mx-auto w-full max-w-2xl">
            <AskBar />
          </div>
        </div>
      </div>
    </DemoGate>
  );
}
