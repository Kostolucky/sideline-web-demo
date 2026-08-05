import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export default function CallNotFound() {
  return (
    <div className="py-10">
      <EmptyState
        title="Call not found"
        description="This call doesn't exist, or it belongs to a different workspace."
        action={
          <Link href="/app/calls" className={buttonVariants({ variant: "secondary" })}>
            Back to calls
          </Link>
        }
      />
    </div>
  );
}
