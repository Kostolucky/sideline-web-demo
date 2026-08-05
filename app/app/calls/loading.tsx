import { Skeleton } from "@/components/ui/misc";

/** Mirrors the real page: title, filter card, count, then the call table. */
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>

      <Skeleton className="h-[5.5rem] w-full rounded-2xl" />

      <div className="space-y-3">
        <Skeleton className="h-4 w-16" />
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border bg-secondary px-4 py-3">
            <Skeleton className="h-3 w-full max-w-md" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-4 py-3">
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
