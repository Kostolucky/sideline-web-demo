"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { createOrganizationAction } from "@/lib/internal/actions";

export function CreateOrgForm() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    setSuccess(null);
    const result = await createOrganizationAction(name, email);
    setPending(false);
    if (result.ok) {
      setSuccess(`Created "${name.trim()}". ${email.trim().toLowerCase()} can now sign in as admin.`);
      setName("");
      setEmail("");
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="org-name">Organization name</Label>
        <Input
          id="org-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Acme Windows & Doors"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-email">First administrator email</Label>
        <Input
          id="admin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@acme.com"
          required
        />
      </div>
      {error && (
        <p className="rounded-xl bg-danger/15 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      {success && (
        <p className="flex items-center gap-2 rounded-xl bg-success/15 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" /> {success}
        </p>
      )}
      <Button type="submit" disabled={pending || !name.trim() || !email.trim()}>
        {pending ? <Spinner /> : <Building2 className="h-4 w-4" />}
        Create organization
      </Button>
    </form>
  );
}
