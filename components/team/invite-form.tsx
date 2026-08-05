"use client";

import * as React from "react";
import { UserPlus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { inviteMemberAction } from "@/lib/team/actions";

/** Admin form to approve a new email for the workspace. */
export function InviteForm() {
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
    const result = await inviteMemberAction(email);
    if (result.ok) {
      setSuccess(`${email.trim().toLowerCase()} can now sign in with Google.`);
      setEmail("");
    } else {
      setError(result.error);
    }
    setPending(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          inputMode="email"
          autoComplete="off"
          placeholder="teammate@company.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
            setSuccess(null);
          }}
          required
          className="flex-1"
        />
        <Button type="submit" disabled={pending || !email.trim()}>
          {pending ? <Spinner /> : <UserPlus className="h-4 w-4" />}
          Add member
        </Button>
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
    </form>
  );
}
