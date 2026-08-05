import { Suspense } from "react";
import Loading from "./loading";
import { CallScreen } from "./call-screen";

export const metadata = { title: "Call · Sideline AI" };

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ callId: string }>;
}) {
  const { callId } = await params;
  return (
    <Suspense fallback={<Loading />}>
      <CallScreen callId={callId} />
    </Suspense>
  );
}
