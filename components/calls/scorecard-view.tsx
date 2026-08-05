"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck } from "lucide-react";
import { EmptyState } from "@/components/ui/misc";
import { setScorecardOverrideAction } from "@/lib/scorecards/actions";
import {
  SCORECARD_RESULT_LABEL,
  type ScorecardResult,
} from "@/lib/scorecards/template";
import type { ScorecardCriterionResult } from "@/lib/queries";

const BADGE: Record<ScorecardResult, string> = {
  met: "bg-success/15 text-success",
  partially_met: "bg-warning/15 text-warning",
  not_met: "bg-danger/15 text-danger",
  not_applicable: "bg-muted text-muted-foreground",
};

export function ScorecardView({
  callId,
  criteria,
  canOverride,
}: {
  callId: string;
  criteria: ScorecardCriterionResult[];
  canOverride: boolean;
}) {
  const scored = criteria.filter((c) => c.result);
  const metCount = criteria.filter(
    (c) => (c.managerOverride ?? c.result) === "met",
  ).length;

  if (criteria.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardCheck className="h-8 w-8" />}
        title="No scorecard yet"
        description="The scorecard is evaluated automatically once the conversation is processed."
      />
    );
  }

  return (
    <div className="space-y-4">
      {scored.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {metCount} of {criteria.length} criteria met
        </p>
      )}
      <div className="space-y-3">
        {criteria.map((c) => (
          <CriterionRow key={c.criterionId} c={c} callId={callId} canOverride={canOverride} />
        ))}
      </div>
    </div>
  );
}

function CriterionRow({
  c,
  callId,
  canOverride,
}: {
  c: ScorecardCriterionResult;
  callId: string;
  canOverride: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const effective = c.managerOverride ?? c.result;

  function setOverride(value: string) {
    if (!c.evaluationId) return;
    const override = value === "" ? null : (value as ScorecardResult);
    startTransition(async () => {
      await setScorecardOverrideAction(c.evaluationId as string, callId, override);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{c.name}</p>
          {c.description && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {c.description}
            </p>
          )}
        </div>
        {effective ? (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE[effective]}`}
          >
            {SCORECARD_RESULT_LABEL[effective]}
            {c.managerOverride ? " · override" : ""}
          </span>
        ) : (
          <span className="shrink-0 text-xs text-muted-foreground">
            Pending
          </span>
        )}
      </div>

      {c.explanation && (
        <p className="mt-2 text-sm text-foreground/80">{c.explanation}</p>
      )}

      {canOverride && c.evaluationId && (
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">Manager override</span>
          <select
            value={c.managerOverride ?? ""}
            disabled={pending}
            onChange={(e) => setOverride(e.target.value)}
            className="rounded-xl border border-input bg-card px-2 py-1 text-xs"
          >
            <option value="">Use AI result</option>
            <option value="met">Met</option>
            <option value="partially_met">Partial</option>
            <option value="not_met">Not met</option>
            <option value="not_applicable">N/A</option>
          </select>
        </div>
      )}
    </div>
  );
}
