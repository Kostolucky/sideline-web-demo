import { notFound } from "next/navigation";
import { Suspense } from "react";
import { flags } from "@/lib/flags";
import Loading from "./loading";
import { CoachingScreen } from "./coaching-screen";

export const metadata = { title: "Coaching · Sideline AI" };

export default function CoachingPage() {
  // Kept so the flag still governs the route, exactly as in production — the
  // difference is only that the demo turns the flag on.
  if (!flags.coachingQueue) notFound();

  return (
    <Suspense fallback={<Loading />}>
      <CoachingScreen />
    </Suspense>
  );
}
