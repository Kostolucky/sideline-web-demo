import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-11 w-full" />
    </div>
  );
}
