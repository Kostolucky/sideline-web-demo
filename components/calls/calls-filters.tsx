"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarRange, Search, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DATE_RANGES,
  dateRangeLabel,
  isDateRangeActive,
  parseDateRange,
  type DateRangeValue,
} from "@/lib/calls/date-range";
import { cn } from "@/lib/utils";

export interface MemberOption {
  userId: string;
  name: string;
}

const controlClass =
  "h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground transition-colors hover:border-muted-foreground focus-visible:border-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const labelClass =
  "flex items-center gap-1.5 text-xs font-medium text-muted-foreground";

/**
 * Team member + date range + name search, presented as one filter group rather
 * than three loose controls. State lives in the URL search params so the server
 * component re-queries and the view is shareable/bookmarkable.
 *
 * "Custom range" reveals two native date inputs — every current browser renders
 * those as a real calendar picker, which gets us keyboard and screen-reader
 * behaviour for free. A bespoke two-month range calendar would need a new
 * dependency; worth doing only if the presets prove insufficient.
 */
export function CallsFilters({
  members,
  member,
  range,
  from,
  to,
  search,
}: {
  members: MemberOption[];
  member?: string;
  range?: string;
  from?: string;
  to?: string;
  search?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const activeRange = parseDateRange(range);

  const [term, setTerm] = React.useState(search ?? "");
  const [draftFrom, setDraftFrom] = React.useState(from ?? "");
  const [draftTo, setDraftTo] = React.useState(to ?? "");

  // Keep the inputs honest if the URL changes underneath us (back button, chip
  // dismissal, "Clear all").
  React.useEffect(() => setTerm(search ?? ""), [search]);
  React.useEffect(() => setDraftFrom(from ?? ""), [from]);
  React.useEffect(() => setDraftTo(to ?? ""), [to]);

  const apply = React.useCallback(
    (changes: Record<string, string | undefined>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      const qs = next.toString();
      router.push(qs ? `/app/calls?${qs}` : "/app/calls");
    },
    [params, router],
  );

  const memberName = members.find((m) => m.userId === member)?.name;
  const rangeActive = isDateRangeActive(activeRange, from, to);
  const searchActive = Boolean(search?.trim());
  const anyActive = Boolean(memberName) || rangeActive || searchActive;

  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>
            <Users className="h-3.5 w-3.5" />
            Team member
          </span>
          <select
            value={member ?? ""}
            onChange={(e) => apply({ member: e.target.value })}
            className={cn(controlClass, "min-w-[12rem]")}
          >
            <option value="">All members</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>
            <CalendarRange className="h-3.5 w-3.5" />
            Date range
          </span>
          <select
            value={activeRange}
            onChange={(e) => {
              const value = e.target.value as DateRangeValue;
              // Switching away from custom drops the bounds so a stale range
              // can't keep filtering invisibly.
              apply(
                value === "custom"
                  ? { range: value }
                  : { range: value === "all" ? undefined : value, from: undefined, to: undefined },
              );
            }}
            className={cn(controlClass, "min-w-[11rem]")}
          >
            {DATE_RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            apply({ q: term.trim() || undefined });
          }}
          className="flex min-w-[14rem] flex-1 flex-col gap-1.5"
        >
          <span className={labelClass}>
            <Search className="h-3.5 w-3.5" />
            Search by call name
          </span>
          <div className="relative">
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search by name, then press Enter…"
              aria-label="Search calls by name"
              className={cn(controlClass, "w-full", term && "pr-9")}
            />
            {term && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setTerm("");
                  apply({ q: undefined });
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </form>
      </div>

      {activeRange === "custom" && (
        <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-border pt-3">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Start date</span>
            <input
              type="date"
              value={draftFrom}
              max={draftTo || undefined}
              onChange={(e) => setDraftFrom(e.target.value)}
              className={cn(controlClass, "min-w-[10rem]")}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>End date</span>
            <input
              type="date"
              value={draftTo}
              min={draftFrom || undefined}
              onChange={(e) => setDraftTo(e.target.value)}
              className={cn(controlClass, "min-w-[10rem]")}
            />
          </label>
          <Button
            type="button"
            size="md"
            disabled={!draftFrom && !draftTo}
            onClick={() =>
              apply({
                range: "custom",
                from: draftFrom || undefined,
                to: draftTo || undefined,
              })
            }
          >
            Apply range
          </Button>
          {(from || to) && (
            <Button
              type="button"
              size="md"
              variant="ghost"
              onClick={() => {
                setDraftFrom("");
                setDraftTo("");
                apply({ range: undefined, from: undefined, to: undefined });
              }}
            >
              Clear range
            </Button>
          )}
        </div>
      )}

      {anyActive && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span className="text-xs font-medium text-muted-foreground">
            Filters
          </span>
          {memberName && (
            <FilterChip
              label={memberName}
              onClear={() => apply({ member: undefined })}
            />
          )}
          {rangeActive && (
            <FilterChip
              label={dateRangeLabel(activeRange, from, to)}
              onClear={() =>
                apply({ range: undefined, from: undefined, to: undefined })
              }
            />
          )}
          {searchActive && (
            <FilterChip
              label={`“${search}”`}
              onClear={() => {
                setTerm("");
                apply({ q: undefined });
              }}
            />
          )}
          <button
            type="button"
            onClick={() => router.push("/app/calls")}
            className="ml-1 text-xs font-medium text-brand-text underline-offset-2 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-tint py-0.5 pl-2.5 pr-1 text-xs font-medium text-brand-text">
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label={`Remove filter: ${label}`}
        className="rounded-full p-0.5 transition-colors hover:bg-brand-tint-hover"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
