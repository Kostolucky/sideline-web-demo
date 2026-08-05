import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-12 text-center">
      <div className="w-full max-w-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/15 text-danger">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Access not approved
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The Google account you used isn&apos;t approved for any workspace, or
          your access has been revoked. Ask your company administrator to add or
          re-enable your email address, then sign in again.
        </p>
        <div className="mt-6">
          <Link
            href="/login"
            className={buttonVariants({ variant: "secondary" }) + " w-full"}
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
