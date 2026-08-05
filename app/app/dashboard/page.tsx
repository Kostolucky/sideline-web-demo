import { Suspense } from "react";
import Loading from "./loading";
import { DashboardScreen } from "./dashboard-screen";

export const metadata = { title: "Dashboard · Sideline AI" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<Loading />}>
      <DashboardScreen />
    </Suspense>
  );
}
