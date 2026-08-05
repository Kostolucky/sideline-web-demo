"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { setOrganizationStatusAction } from "@/lib/internal/actions";

export function OrgStatusToggle({
  organizationId,
  name,
  disabled,
}: {
  organizationId: string;
  name: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function set(status: "active" | "disabled") {
    setPending(true);
    const result = await setOrganizationStatusAction(organizationId, status);
    setPending(false);
    if (!result.ok) throw new Error(result.error);
    router.refresh();
  }

  if (disabled) {
    return (
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() => set("active").catch(() => {})}
      >
        {pending ? <Spinner /> : <Power className="h-4 w-4" />} Enable
      </Button>
    );
  }

  return (
    <ConfirmDialog
      title={`Disable ${name}?`}
      description="Members will immediately lose access to the workspace. Data is preserved and access can be restored later."
      confirmLabel="Disable workspace"
      onConfirm={() => set("disabled")}
    >
      <Button variant="ghost" size="sm" className="text-danger" disabled={pending}>
        <PowerOff className="h-4 w-4" /> Disable
      </Button>
    </ConfirmDialog>
  );
}
