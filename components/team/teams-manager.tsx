"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Trash2, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  createTeamAction,
  deleteTeamAction,
  setTeamManagerAction,
  setTeamMemberAction,
} from "@/lib/team/actions";
import type { TeamWithAssignments } from "@/lib/queries";

export interface TeamMemberOption {
  id: string; // organization_members.id
  name: string;
}

export function TeamsManager({
  teams,
  members,
}: {
  teams: TeamWithAssignments[];
  members: TeamMemberOption[];
}) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const nameById = React.useMemo(
    () => new Map(members.map((m) => [m.id, m.name])),
    [members],
  );

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Something went wrong.");
      else {
        setError(null);
        router.refresh();
      }
    });
  }

  function createTeam(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    run(async () => {
      const res = await createTeamAction(trimmed);
      if (res.ok) setName("");
      return res;
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={createTeam} className="flex items-end gap-2">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            New team
          </span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. North region"
          />
        </label>
        <Button type="submit" disabled={pending || !name.trim()}>
          <Plus className="h-4 w-4" /> Add team
        </Button>
      </form>

      {error && <p className="text-sm text-danger">{error}</p>}

      {teams.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          No teams yet. Create one, then assign a manager and reps so managers see
          their team&apos;s conversations.
        </p>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className="rounded-2xl border border-border bg-card shadow-sm p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  <UsersRound className="h-4 w-4 text-muted-foreground" />
                  {team.name}
                </div>
                <ConfirmDialog
                  title={`Delete "${team.name}"?`}
                  description="Reps and managers will be unassigned. Conversations are not affected."
                  confirmLabel="Delete team"
                  onConfirm={() => run(() => deleteTeamAction(team.id))}
                >
                  <Button variant="ghost" size="sm" className="text-danger">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </ConfirmDialog>
              </div>

              <Assignment
                label="Managers"
                assignedIds={team.managerIds}
                nameById={nameById}
                members={members}
                disabled={pending}
                onAdd={(memberId) =>
                  run(() => setTeamManagerAction(team.id, memberId, true))
                }
                onRemove={(memberId) =>
                  run(() => setTeamManagerAction(team.id, memberId, false))
                }
              />
              <Assignment
                label="Reps"
                assignedIds={team.memberIds}
                nameById={nameById}
                members={members}
                disabled={pending}
                onAdd={(memberId) =>
                  run(() => setTeamMemberAction(team.id, memberId, true))
                }
                onRemove={(memberId) =>
                  run(() => setTeamMemberAction(team.id, memberId, false))
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Assignment({
  label,
  assignedIds,
  nameById,
  members,
  disabled,
  onAdd,
  onRemove,
}: {
  label: string;
  assignedIds: string[];
  nameById: Map<string, string>;
  members: TeamMemberOption[];
  disabled: boolean;
  onAdd: (memberId: string) => void;
  onRemove: (memberId: string) => void;
}) {
  const assigned = new Set(assignedIds);
  const available = members.filter((m) => !assigned.has(m.id));

  return (
    <div className="mt-3 border-t border-border pt-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {assignedIds.length === 0 && (
          <span className="text-sm text-muted-foreground">None yet</span>
        )}
        {assignedIds.map((id) => (
          <span
            key={id}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-sm"
          >
            {nameById.get(id) ?? "Unknown"}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRemove(id)}
              aria-label={`Remove ${nameById.get(id) ?? "member"}`}
              className="text-muted-foreground hover:text-danger"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        {available.length > 0 && (
          <select
            value=""
            disabled={disabled}
            onChange={(e) => e.target.value && onAdd(e.target.value)}
            className="h-8 rounded-xl border border-input bg-card px-2 text-sm"
          >
            <option value="">+ Add…</option>
            {available.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
