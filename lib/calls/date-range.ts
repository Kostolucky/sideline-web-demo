/**
 * Date-range presets for the Calls page. Pure functions with no server imports,
 * so the client filter bar and the server page share one definition instead of
 * each having their own idea of what "Last 7 days" means.
 */

export const DATE_RANGES = [
  { value: "all", label: "All time" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "custom", label: "Custom range" },
] as const;

export type DateRangeValue = (typeof DATE_RANGES)[number]["value"];

const VALUES = DATE_RANGES.map((r) => r.value) as readonly string[];

/** Narrow an untrusted search param. Defaults to "all time". */
export function parseDateRange(value: string | undefined): DateRangeValue {
  return (VALUES.includes(value ?? "") ? value : "all") as DateRangeValue;
}

/** `YYYY-MM-DD` -> local start of that day, or null if unparseable. */
function startOfDay(day: string | undefined): Date | null {
  if (!day) return null;
  const d = new Date(`${day}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** `YYYY-MM-DD` -> local end of that day, or null if unparseable. */
function endOfDay(day: string | undefined): Date | null {
  if (!day) return null;
  const d = new Date(`${day}T23:59:59.999`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Turn a preset (plus custom bounds) into ISO boundaries for the query.
 *
 * The rolling presets are measured back from `now`, so "Last 24 hours" really
 * means the last 24 hours and not "since midnight". A custom range is
 * day-inclusive at both ends: picking Aug 1 – Aug 3 includes everything on Aug 3.
 */
export function resolveDateRange(
  range: DateRangeValue,
  from: string | undefined,
  to: string | undefined,
  now: Date = new Date(),
): { from?: string; to?: string } {
  const daysAgo = (days: number) =>
    new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  switch (range) {
    case "24h":
      return { from: daysAgo(1) };
    case "7d":
      return { from: daysAgo(7) };
    case "30d":
      return { from: daysAgo(30) };
    case "custom": {
      const start = startOfDay(from);
      const end = endOfDay(to);
      return {
        ...(start ? { from: start.toISOString() } : {}),
        ...(end ? { to: end.toISOString() } : {}),
      };
    }
    default:
      return {};
  }
}

/** True when this range actually narrows the results. */
export function isDateRangeActive(
  range: DateRangeValue,
  from?: string,
  to?: string,
): boolean {
  if (range === "all") return false;
  if (range === "custom") return Boolean(from || to);
  return true;
}

function shortDay(day: string | undefined): string {
  const d = startOfDay(day);
  if (!d) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Human summary of the active range, for the filter chip. */
export function dateRangeLabel(
  range: DateRangeValue,
  from?: string,
  to?: string,
): string {
  if (range !== "custom") {
    return DATE_RANGES.find((r) => r.value === range)?.label ?? "All time";
  }
  if (from && to) return `${shortDay(from)} – ${shortDay(to)}`;
  if (from) return `From ${shortDay(from)}`;
  if (to) return `Until ${shortDay(to)}`;
  return "Custom range";
}
