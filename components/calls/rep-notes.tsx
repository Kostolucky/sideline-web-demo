"use client";

import * as React from "react";
import { NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";
import { saveNotesAction } from "@/lib/calls/actions";

/**
 * The rep's notes on a call — now stored on `calls.notes`, so they're the same
 * text the mobile app reads and writes.
 *
 * Editable at any time, not just during the recording: you can come back days
 * later and add to them. Only the rep who recorded the call can edit (the API
 * enforces it); an Admin reading someone else's call sees them read-only,
 * because manager input belongs in coaching.
 */
export function RepNotes({
  callId,
  initialNotes,
  canEdit,
  repName,
}: {
  callId: string;
  initialNotes: string | null;
  /** The viewer recorded this call. */
  canEdit: boolean;
  repName: string;
}) {
  const [notes, setNotes] = React.useState(initialNotes ?? "");
  const [draft, setDraft] = React.useState(initialNotes ?? "");
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Track the server value if it changes underneath us (e.g. edited on mobile
  // and this page revalidated).
  React.useEffect(() => {
    setNotes(initialNotes ?? "");
    setDraft(initialNotes ?? "");
  }, [initialNotes]);

  async function save() {
    setSaving(true);
    setError(null);
    const res = await saveNotesAction(callId, draft);
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setNotes(draft.trim());
    setEditing(false);
  }

  return (
    <section>
      <h3 className="flex items-center gap-2 text-section-label text-muted-foreground">
        <NotebookPen className="h-4 w-4" />
        Notes
      </h3>

      {editing ? (
        <div className="mt-2.5">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            autoFocus
            disabled={saving}
            aria-label="Call notes"
            placeholder="What happened on this call? Anything to remember for the follow-up?"
            className="w-full resize-y rounded-xl border border-input bg-card px-3 py-2 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground hover:border-muted-foreground focus-visible:border-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
          />
          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
          <div className="mt-2 flex items-center gap-2">
            <Button size="sm" onClick={save} disabled={saving}>
              {saving && <Spinner />}
              Save notes
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={saving}
              onClick={() => {
                setDraft(notes);
                setError(null);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : notes ? (
        <>
          <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">
            {notes}
          </p>
          {canEdit && (
            <Button
              size="sm"
              variant="ghost"
              className="mt-2 -ml-3"
              onClick={() => setEditing(true)}
            >
              Edit notes
            </Button>
          )}
        </>
      ) : canEdit ? (
        <div className="mt-2">
          <p className="text-sm text-muted-foreground">
            No notes on this call yet.
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-2"
            onClick={() => setEditing(true)}
          >
            Add notes
          </Button>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          {repName} hasn&apos;t added notes for this call.
        </p>
      )}
    </section>
  );
}
