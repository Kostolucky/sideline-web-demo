"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X } from "lucide-react";
import { renameCallAction } from "@/lib/calls/actions";
import { Spinner } from "@/components/ui/misc";

/**
 * Call title with inline editing. A pencil at the end signals it's editable;
 * clicking it swaps the title for an input (Enter saves, Esc cancels).
 */
export function EditableCallName({
  callId,
  initialName,
}: {
  callId: string;
  initialName: string;
}) {
  const router = useRouter();
  const [name, setName] = React.useState(initialName);
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(initialName);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function start() {
    setValue(name);
    setError(null);
    setEditing(true);
  }

  async function save() {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("The name can't be empty.");
      return;
    }
    if (trimmed === name) {
      setEditing(false);
      return;
    }
    setPending(true);
    setError(null);
    const result = await renameCallAction(callId, trimmed);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setName(result.name);
    setEditing(false);
    router.refresh();
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setEditing(false);
            }}
            disabled={pending}
            aria-label="Call name"
            className="w-full max-w-md rounded-xl border border-input bg-card px-2.5 py-1 text-2xl font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            onClick={save}
            disabled={pending}
            aria-label="Save name"
            className="rounded-md p-1.5 text-success transition-colors hover:bg-muted"
          >
            {pending ? <Spinner /> : <Check className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setEditing(false)}
            disabled={pending}
            aria-label="Cancel"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
      <button
        onClick={start}
        title="Click to edit the call name"
        aria-label="Edit call name"
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  );
}
