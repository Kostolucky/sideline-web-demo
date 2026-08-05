"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui/misc";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PersonaSwitcher } from "@/components/demo/persona-switcher";
import { DemoGate } from "@/components/demo/demo-gate";
import { formatDate, formatDateTime, roleLabel } from "@/lib/format";
import { useDemoState } from "@/lib/demo/use-demo";
import { currentMember } from "@/lib/queries";
import Loading from "./loading";

export function AccountScreen() {
  const router = useRouter();
  const state = useDemoState();
  const member = currentMember(state);
  const organization = state.organization;

  // Production gates the provisioning console on a PLATFORM_OWNER_EMAILS
  // allowlist read from the environment. The demo reads no environment at all,
  // so the console is simply always reachable — see /internal/organizations.
  const owner = true;

  return (
    <DemoGate fallback={<Loading />}>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>

        <Card>
          <div className="flex items-center gap-4 p-5">
            <Avatar
              name={member.display_name}
              email={member.email}
              className="h-14 w-14 shrink-0 text-lg"
            />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">
                {member.display_name || member.email}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {member.email}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            <Row label="Organization" value={organization.name} />
            <Row label="Role" value={roleLabel(member.role)} />
            <Row label="Joined" value={formatDate(member.joined_at)} />
            <Row
              label="Last login"
              value={formatDateTime(member.last_login_at)}
            />
          </CardContent>
        </Card>

        {/* The one control with no production equivalent. */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Demo controls</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              This build runs entirely on sample data — no sign-in, no backend,
              no customer information.
            </p>
          </CardHeader>
          <CardContent>
            <PersonaSwitcher />
          </CardContent>
        </Card>

        {owner && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-brand-text" /> Platform
                owner
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                You have platform-owner access to provision customer workspaces.
              </p>
            </CardHeader>
            <CardContent>
              <Link
                href="/internal/organizations"
                className={buttonVariants({ variant: "secondary" })}
              >
                Open provisioning console
              </Link>
            </CardContent>
          </Card>
        )}

        <Button
          type="button"
          variant="dangerSoft"
          className="w-full"
          onClick={() => router.push("/login")}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </DemoGate>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
