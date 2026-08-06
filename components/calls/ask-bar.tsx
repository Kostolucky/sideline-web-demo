"use client";

import { Mic, Sparkles } from "lucide-react";

/**
 * Static quick actions. Placeholders — nothing is wired up.
 */
const QUICK_ACTIONS = [
  "Write follow-up email",
  "Summarize objections",
  "Draft next steps",
];

/**
 * The "ask about this call" bar, pinned under the review content.
 *
 * A SHELL: the chips and the field are inert. It exists so the surface can be
 * seen and agreed on before anything is wired up.
 *
 * It sits in the main column rather than under the coaching thread, for two
 * reasons. The coaching panel is closed by default, so anything docked inside
 * it would be invisible on arrival. And the two inputs mean different things —
 * coaching is a message to a colleague, this is a question about the call — so
 * they are kept visually and physically apart: different column, a mic and
 * sparkle rather than a send arrow, a muted single-line field rather than a
 * composer, and quick actions above it that the coaching composer has none of.
 */
export function AskBar() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((label) => (
          <button
            key={label}
            type="button"
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
          >
            {label}
          </button>
        ))}
      </div>

      {/* A button, not an input — collapsed until there's something behind it. */}
      <button
        type="button"
        aria-label="Ask a question about this call"
        className="flex w-full items-center gap-2.5 rounded-full border border-input bg-card px-4 py-2.5 text-left transition-colors hover:border-muted-foreground"
      >
        <Sparkles className="h-4 w-4 shrink-0 text-brand-text" />
        <span className="flex-1 truncate text-sm text-muted-foreground">
          Ask a question about this call…
        </span>
        <Mic className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
    </div>
  );
}
