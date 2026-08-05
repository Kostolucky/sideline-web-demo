import { Suspense } from "react";
import Loading from "./loading";
import { AccountScreen } from "./account-screen";

export const metadata = { title: "Account · Sideline AI" };

export default function AccountPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AccountScreen />
    </Suspense>
  );
}
