import { Suspense } from "react";
import Loading from "./loading";
import { CallsScreen } from "./calls-screen";

export const metadata = { title: "Calls · Sideline AI" };

/**
 * Thin server shell.
 *
 * The screen itself is a client component (it reads the demo store and the
 * URL's filter params), and `useSearchParams` needs a Suspense boundary above
 * it during prerender. Keeping the shell here also lets the route keep its
 * `metadata` export, which a client component can't have.
 */
export default function CallsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CallsScreen />
    </Suspense>
  );
}
