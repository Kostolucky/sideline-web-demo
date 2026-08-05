import { redirect } from "next/navigation";

/**
 * Entry point.
 *
 * Production checks for a session and a workspace membership here and sends
 * people to /login or /unauthorized. The demo has no auth, so it opens straight
 * into the product — which is the whole point of a demo build. Both of those
 * screens are still reachable directly if you want to show them.
 */
export default function Home() {
  redirect("/app/calls");
}
