/**
 * Platform-owner provisioning actions — demo implementations.
 *
 * In production these run with the Supabase service role after confirming the
 * caller's email is on `PLATFORM_OWNER_EMAILS`. There are no secrets and no
 * allowlist here; the console is simply reachable in the demo.
 */

import {
  createOrganization,
  getState,
  setOrganizationStatus,
} from "@/lib/demo/store";
import { isValidEmail, normalizeEmail } from "@/lib/utils";

export type ActionResult =
  | { ok: true; organizationId?: string }
  | { ok: false; error: string };

export async function createOrganizationAction(
  name: string,
  adminEmail: string,
): Promise<ActionResult> {
  const trimmedName = name.trim();
  const email = normalizeEmail(adminEmail);

  if (!trimmedName) return { ok: false, error: "Give the workspace a name." };
  if (!isValidEmail(email)) {
    return { ok: false, error: "Enter a valid administrator email." };
  }
  if (
    getState().organizations.some(
      (o) => o.name.toLowerCase() === trimmedName.toLowerCase(),
    )
  ) {
    return { ok: false, error: "A workspace with that name already exists." };
  }

  createOrganization(trimmedName);
  return { ok: true };
}

export async function setOrganizationStatusAction(
  organizationId: string,
  status: "active" | "disabled",
): Promise<ActionResult> {
  setOrganizationStatus(organizationId, status);
  return { ok: true };
}
