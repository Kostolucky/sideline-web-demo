"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  changeRoleAction,
  deleteMemberAction,
  type ActionResult,
} from "@/lib/team/actions";
import type { MemberRole } from "@/lib/constants";

/**
 * Per-member admin controls. Only rendered for admins (the parent gates it).
 *   - A "User" (member) can be promoted to Admin, or deleted (with confirm).
 *   - An "Admin" has no actions: admins can't be promoted or deleted.
 */
export function MemberActions({
  memberId,
  role,
  isSelf,
  label,
}: {
  memberId: string;
  role: MemberRole;
  isSelf: boolean;
  label: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function run(fn: () => Promise<ActionResult>) {
    setPending(true);
    setError(null);
    const result = await fn();
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      throw new Error(result.error); // surfaces inside ConfirmDialog too
    }
    router.refresh();
  }

  // Admins are protected: no promote, no delete.
  if (role === "admin") return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() =>
            run(() => changeRoleAction(memberId, "admin")).catch(() => {})
          }
        >
          <ShieldCheck className="h-4 w-4" /> Make admin
        </Button>

        <ConfirmDialog
          title="Delete team member?"
          description={`Are you sure you want to delete ${label}? They'll lose access to the workspace. This can't be undone.`}
          confirmLabel="Delete member"
          onConfirm={() => run(() => deleteMemberAction(memberId))}
        >
          <Button
            variant="ghost"
            size="sm"
            className="text-danger"
            disabled={pending || isSelf}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </ConfirmDialog>

        {pending && <Spinner className="text-muted-foreground" />}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
