"use client";

import { InviteForm } from "@/components/team/invite-form";
import { MemberActions } from "@/components/team/member-actions";
import {
  TeamsManager,
  type TeamMemberOption,
} from "@/components/team/teams-manager";
import { Avatar } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoGate } from "@/components/demo/demo-gate";
import { roleLabel } from "@/lib/format";
import { toMemberRole } from "@/lib/constants";
import { useDemoState } from "@/lib/demo/use-demo";
import {
  currentMember,
  isAdmin as isAdminOf,
  listMembers,
  listTeamsWithAssignments,
} from "@/lib/queries";
import Loading from "./loading";

export function TeamScreen() {
  const state = useDemoState();
  const me = currentMember(state);
  const isAdmin = isAdminOf(state);
  const members = listMembers(state);
  const teams = isAdmin ? listTeamsWithAssignments(state) : [];

  const teamMemberOptions: TeamMemberOption[] = members
    .filter((m) => m.status === "active")
    .map((m) => ({ id: m.id, name: m.display_name || m.email }));

  return (
    <DemoGate fallback={<Loading />}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Manage who can access your workspace."
              : "People in your workspace."}
          </p>
        </div>

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add a member</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Approve an email address. The person signs in with that Google
                account to join — no invitation email required.
              </p>
            </CardHeader>
            <CardContent>
              <InviteForm />
            </CardContent>
          </Card>
        )}

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Teams</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Group reps under a manager. Managers see the conversations of
                reps on the teams they manage.
              </p>
            </CardHeader>
            <CardContent>
              <TeamsManager teams={teams} members={teamMemberOptions} />
            </CardContent>
          </Card>
        )}

        {/* Mobile cards */}
        <ul className="flex flex-col gap-3 lg:hidden">
          {members.map((m) => (
            <li
              key={m.id}
              className="rounded-2xl border border-border bg-card shadow-sm p-4"
            >
              <div className="flex items-center gap-3">
                <Avatar name={m.display_name} email={m.email} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {m.display_name || m.email.split("@")[0]}
                    {m.id === me.id && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {m.email}
                  </p>
                </div>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {roleLabel(m.role)}
                </span>
              </div>
              {isAdmin && m.role !== "admin" && (
                <div className="mt-3 flex justify-end border-t border-border pt-3">
                  <MemberActions
                    memberId={m.id}
                    role={toMemberRole(m.role)}
                    isSelf={m.id === me.id}
                    label={m.display_name || m.email}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>

        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Role</th>
                {isAdmin && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={m.display_name}
                        email={m.email}
                        className="h-8 w-8 text-xs"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {m.display_name || m.email.split("@")[0]}
                          {m.id === me.id && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              (you)
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {m.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {roleLabel(m.role)}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <MemberActions
                        memberId={m.id}
                        role={toMemberRole(m.role)}
                        isSelf={m.id === me.id}
                        label={m.display_name || m.email}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DemoGate>
  );
}
