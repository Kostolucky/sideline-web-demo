"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";
import { formatTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Text input for a coaching message or a reply.
 *
 * Attaching the current recording position is OPT-IN. Coaching splits into two
 * kinds — general feedback about the call, and feedback about a specific moment —
 * and stamping every message with wherever the player happens to sit (usually
 * 0:00, before anyone has pressed play) would make the timestamp meaningless.
 */
export function CommentComposer({
  onSubmit,
  placeholder,
  submitLabel,
  attachMs,
  canAttach = false,
  rows = 3,
  autoFocus,
  compact,
  footnote,
  onCancel,
}: {
  /** Return an error string to surface it inline; null/void on success. */
  onSubmit: (
    body: string,
    timestampMs: number | null,
  ) => Promise<string | null | void> | string | null | void;
  placeholder: string;
  submitLabel: string;
  /** Live playback position, offered as an optional anchor. */
  attachMs?: number;
  /** There's a recording to anchor to. */
  canAttach?: boolean;
  rows?: number;
  autoFocus?: boolean;
  compact?: boolean;
  footnote?: string;
  onCancel?: () => void;
}) {
  const [body, setBody] = React.useState("");
  const [attach, setAttach] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    try {
      const stamp = attach && attachMs != null ? Math.round(attachMs) : null;
      const result = await onSubmit(text, stamp);
      if (typeof result === "string") setError(result);
      else {
        setBody("");
        setAttach(false);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          // ⌘/Ctrl+Enter submits — the usual shortcut for a threaded composer.
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit(e);
          if (e.key === "Escape" && onCancel) onCancel();
        }}
        placeholder={placeholder}
        rows={rows}
        autoFocus={autoFocus}
        aria-label={placeholder}
        className={cn(
          "w-full resize-none rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground hover:border-muted-foreground focus-visible:border-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          compact && "text-[13px]",
        )}
      />

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        {canAttach && attachMs != null ? (
          <button
            type="button"
            onClick={() => setAttach((v) => !v)}
            aria-pressed={attach}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-colors",
              attach
                ? "border-brand-text/40 bg-brand-tint text-brand-text"
                : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            {attach ? "Attached at" : "Attach current moment:"}{" "}
            {formatTimestamp(Math.round(attachMs))}
          </button>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" size="sm" disabled={busy || !body.trim()}>
            {busy && <Spinner />}
            {submitLabel}
          </Button>
        </div>
      </div>

      {footnote && (
        <p className="mt-1.5 text-meta text-muted-foreground">{footnote}</p>
      )}
    </form>
  );
}
