import { Suspense } from "react";
import { AudioLines } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

const ERRORS: Record<string, string> = {
  unauthorized:
    "That Google account isn't approved for a workspace yet. Ask your administrator to add your email.",
  auth: "We couldn't complete sign-in. Please try again.",
};

/**
 * The sign-in screen.
 *
 * Reachable but never enforced — the demo opens straight into the workspace and
 * this page exists so the entry point can still be shown. Production redirects
 * an already-signed-in member away from here; that check is gone, because in
 * the demo everyone always is.
 *
 * The error banner still renders from `?error=unauthorized` or `?error=auth`,
 * so both failure messages can be demonstrated.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const errorMessage = error ? (ERRORS[error] ?? ERRORS.auth) : null;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-brand-foreground">
            <AudioLines className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Sideline AI</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Record in-person sales conversations, then review the transcript and
            AI summary with your whole team.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
          {errorMessage && (
            <p className="mb-4 rounded-xl bg-danger/15 px-3 py-2 text-sm text-danger">
              {errorMessage}
            </p>
          )}
          <Suspense fallback={null}>
            <GoogleSignInButton next={next} />
          </Suspense>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Access is invite-only. Sign in with the Google account your
            administrator approved.
          </p>
        </div>
      </div>
    </main>
  );
}
