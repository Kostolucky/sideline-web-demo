import { Suspense } from "react";
import Loading from "./loading";
import { TeamScreen } from "./team-screen";

export const metadata = { title: "Team · Sideline AI" };

export default function TeamPage() {
  return (
    <Suspense fallback={<Loading />}>
      <TeamScreen />
    </Suspense>
  );
}
