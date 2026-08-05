"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Phone, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { Avatar } from "@/components/ui/misc";
import { DemoGate } from "@/components/demo/demo-gate";
import { useDemoState } from "@/lib/demo/use-demo";
import { getDashboardStats, isAdmin } from "@/lib/queries";
import Loading from "./loading";

export function DashboardScreen() {
  const router = useRouter();
  const state = useDemoState();
  const admin = isAdmin(state);

  // Production's `requireAdmin()` sends a User quietly back to their calls
  // rather than showing a 403. Worth keeping — switching persona while sitting
  // on this page is one of the clearest ways to demonstrate the role model.
  React.useEffect(() => {
    if (!admin) router.replace("/app/calls");
  }, [admin, router]);

  if (!admin) return <Loading />;

  const stats = getDashboardStats(state);

  return (
    <DemoGate fallback={<Loading />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.last7Days} conversation{stats.last7Days === 1 ? "" : "s"}{" "}
            recorded in the last 7 days.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label="Conversations"
            value={stats.total}
            icon={<Phone className="h-4 w-4" />}
            tone="default"
          />
          <Stat
            label="Ready"
            value={stats.ready}
            icon={<CheckCircle2 className="h-4 w-4" />}
            tone="success"
          />
          <Stat
            label="Processing"
            value={stats.processing}
            icon={<Loader2 className="h-4 w-4" />}
            tone="progress"
          />
          <Stat
            label="Failed"
            value={stats.failed}
            icon={<AlertTriangle className="h-4 w-4" />}
            tone="danger"
          />
        </div>

        <section className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-5">
          <h2 className="text-sm font-semibold">Recording activity by rep</h2>
          {stats.byRep.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No conversations recorded yet.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {stats.byRep.map(({ rep, count }, i) => (
                <li key={rep?.id ?? i} className="flex items-center gap-3 py-2.5">
                  <Avatar name={rep?.display_name} email={rep?.email} />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {rep?.display_name || rep?.email || "Unknown rep"}
                  </span>
                  <span className="text-sm font-medium tabular-nums">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </DemoGate>
  );
}

const TONE: Record<string, string> = {
  default: "text-foreground",
  success: "text-success",
  /** In-flight work stays neutral, so green keeps meaning "ready". */
  progress: "text-foreground",
  danger: "text-danger",
};

function Stat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: keyof typeof TONE;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-4">
      <div
        className={`flex items-center gap-1.5 text-xs font-medium ${TONE[tone]}`}
      >
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
