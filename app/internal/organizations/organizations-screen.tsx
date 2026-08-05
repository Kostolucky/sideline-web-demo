"use client";

import { AudioLines } from "lucide-react";
import { CreateOrgForm } from "@/components/internal/create-org-form";
import { OrgStatusToggle } from "@/components/internal/org-status-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { DemoGate } from "@/components/demo/demo-gate";
import { formatDate } from "@/lib/format";
import { useDemoState } from "@/lib/demo/use-demo";
import { currentMember, listOrganizationsForOwner } from "@/lib/queries";

/**
 * Platform-owner provisioning console.
 *
 * Production gates this on a `PLATFORM_OWNER_EMAILS` allowlist read from the
 * environment. The demo reads no environment variables at all, so the route is
 * simply open — the point here is to show the surface, not to reproduce an
 * allowlist that has nothing to check against.
 *
 * Note it renders outside the /app shell, so there is no sidebar — matching
 * production.
 */
export function OrganizationsScreen() {
  const state = useDemoState();
  const owner = currentMember(state);
  const organizations = listOrganizationsForOwner(state);

  return (
    <DemoGate
      fallback={
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      }
    >
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-brand-foreground">
            <AudioLines className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">Provisioning console</h1>
            <p className="text-xs text-muted-foreground">
              Signed in as {owner.email}
            </p>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">
              Create a customer workspace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CreateOrgForm />
          </CardContent>
        </Card>

        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Organizations ({organizations.length})
        </h2>

        {organizations.length === 0 ? (
          <EmptyState
            title="No organizations yet"
            description="Create your first customer workspace above."
          />
        ) : (
          <ul className="space-y-3">
            {organizations.map((org) => (
              <li
                key={org.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card shadow-sm p-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{org.name}</p>
                    <Badge tone={org.status === "active" ? "success" : "danger"}>
                      {org.status === "active" ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {org.activeMembers} active member
                    {org.activeMembers === 1 ? "" : "s"} · created{" "}
                    {formatDate(org.createdAt)} ·{" "}
                    <span className="font-mono text-xs">{org.slug}</span>
                  </p>
                </div>
                <OrgStatusToggle
                  organizationId={org.id}
                  name={org.name}
                  disabled={org.status === "disabled"}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </DemoGate>
  );
}
