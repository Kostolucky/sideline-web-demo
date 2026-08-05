import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-40 w-full" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}
