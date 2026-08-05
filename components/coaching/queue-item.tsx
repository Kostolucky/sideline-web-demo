"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { Avatar } from "@/components/ui/misc";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { markCallReviewedAction } from "@/lib/coaching/actions";
import { formatDate, formatDuration } from "@/lib/format";
import type { CallRow, OrganizationMemberRow } from "@/lib/db/types";

export function QueueItem({
  call,
  rep,
  summarySnippet,
  reason,
}: {
  call: CallRow;
  rep: OrganizationMemberRow | null;
  summarySnippet: string | null;
  reason: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function markReviewed() {
    startTransition(async () => {
      await markCallReviewedAction(call.id);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={rep?.display_name} email={rep?.email} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {rep?.display_name || rep?.email || "Unknown rep"}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(call.recorded_at)} · {formatDuration(call.duration_seconds)}
            </p>
          </div>
        </div>
        <Badge>{reason}</Badge>
      </div>

      <Link
        href={`/app/calls/${call.id}`}
        className="mt-3 block truncate text-sm font-medium hover:underline"
      >
        {call.name}
      </Link>
      {summarySnippet ? (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {summarySnippet}
        </p>
      ) : null}

      <div className="mt-4 flex items-center gap-2">
        <Link
          href={`/app/calls/${call.id}`}
          className={buttonVariants({ size: "sm", variant: "secondary" })}
        >
          Review <ChevronRight className="h-4 w-4" />
        </Link>
        <Button
          size="sm"
          variant="ghost"
          onClick={markReviewed}
          disabled={pending}
        >
          <Check className="h-4 w-4" /> Mark reviewed
        </Button>
      </div>
    </div>
  );
}
