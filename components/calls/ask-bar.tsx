"use client";

import * as React from "react";
import { ArrowUp, Mic, Sparkles } from "lucide-react";
import { TIMINGS } from "@/lib/demo/timings";
import { tokenize } from "@/lib/calls/ask-reply";
import { cn } from "@/lib/utils";

/** Static quick actions. Each one sends its label. */
const QUICK_ACTIONS = [
  "Write follow-up email",
  "Summarize objections",
  "Draft next steps",
];

interface AskMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

/**
 * The ask bar — one component, both surfaces that carry it: the call list and
 * a call's Summary tab. A floating bubble rather than a docked strip, so it
 * hovers over the content instead of being welded to the bottom edge.
 *
 * Positioning is the page's job, not the bar's. Each surface wraps it in its
 * own container — pinned in the call's fixed-height column, fixed over the
 * scrolling list — so one component can sit correctly in two different layouts.
 *
 * `reply` is what makes it answer. Given one, the bar is live: send anything
 * and the assistant pauses as if thinking, then writes that reply out word by
 * word, with quick actions offered above. Without one — the call list, where
 * there is no single call to answer about — the same bar renders inert.
 *
 * SCRIPTED, NOT INTELLIGENT. There is no model. The reveal is deliberate rather
 * than instant: a wall of text appearing at once reads as canned, whereas
 * watching it being written reads as generated. Both delays live in
 * `timings.ts`.
 *
 * The conversation expands upward into a bounded, scrollable area directly
 * above the composer rather than into the page body — the body belongs to the
 * summary, and a Q&A growing inside it would push the call you are reading off
 * the screen. Nothing is persisted; it resets when you leave.
 */
export function AskBar({ reply }: { reply?: string }) {
  const [messages, setMessages] = React.useState<AskMessage[]>([]);
  const [draft, setDraft] = React.useState("");
  /** True from the moment a message is sent until the last word lands. */
  const [generating, setGenerating] = React.useState(false);
  /** The assistant has started writing — the "Generating…" line gives way. */
  const [streaming, setStreaming] = React.useState(false);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  // Nothing should keep ticking after this unmounts.
  React.useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const t of pending) clearTimeout(t);
    };
  }, []);

  // Follow the reply as it's written.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = React.useCallback(
    (body: string) => {
      const text = body.trim();
      if (!text || generating || !reply) return;

      const stamp = Date.now();
      setMessages((prev) => [...prev, { id: `u-${stamp}`, role: "user", text }]);
      setDraft("");
      setGenerating(true);
      setStreaming(false);

      const tokens = tokenize(reply);
      const assistantId = `a-${stamp}`;
      const { thinkingMs, tokenMs } = TIMINGS.chat;

      // Think first, then reveal one token at a time. Individual timers rather
      // than one interval, so each step is separately cancellable on unmount.
      timers.current.push(
        setTimeout(() => {
          setStreaming(true);
          setMessages((prev) => [
            ...prev,
            { id: assistantId, role: "assistant", text: "" },
          ]);

          tokens.forEach((_, i) => {
            timers.current.push(
              setTimeout(
                () => {
                  const shown = tokens.slice(0, i + 1).join("");
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, text: shown } : m,
                    ),
                  );
                  if (i === tokens.length - 1) {
                    setGenerating(false);
                    setStreaming(false);
                  }
                },
                tokenMs * (i + 1),
              ),
            );
          });
        }, thinkingMs),
      );
    },
    [reply, generating],
  );

  const hasConversation = messages.length > 0;

  return (
    <div className="flex flex-col gap-2">
      {hasConversation && (
        <div
          ref={scrollRef}
          className="max-h-[38vh] space-y-3 overflow-y-auto rounded-2xl border border-border bg-card p-3 shadow-lg"
        >
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-brand-tint px-3 py-2 text-sm">
                  {m.text}
                </p>
              </div>
            ) : (
              // Long-form writing meant to be read and copied, so it is plain
              // text rather than a bubble.
              <p
                key={m.id}
                className="whitespace-pre-line text-sm leading-relaxed text-foreground/90"
              >
                {m.text}
              </p>
            ),
          )}
          {generating && !streaming && (
            <p className="text-sm italic text-muted-foreground">Generating…</p>
          )}
        </div>
      )}

      {/* The prompts have served their purpose once the thread has started. */}
      {reply && !hasConversation && (
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => send(label)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="flex w-full items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2 shadow-lg transition-colors focus-within:border-brand-text hover:border-border-strong"
      >
        <Sparkles className="h-4 w-4 shrink-0 text-brand-text" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={generating || !reply}
          placeholder={
            reply ? "Ask a question about this call…" : "Ask anything"
          }
          aria-label={reply ? "Ask a question about this call" : "Ask anything"}
          className="min-w-0 flex-1 bg-transparent py-0.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-default disabled:opacity-100"
        />
        {draft.trim() ? (
          <button
            type="submit"
            disabled={generating}
            aria-label="Send"
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors",
              generating
                ? "bg-secondary text-muted-foreground"
                : "border border-brand-text bg-brand text-brand-foreground",
            )}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        ) : (
          <Mic className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </form>
    </div>
  );
}
