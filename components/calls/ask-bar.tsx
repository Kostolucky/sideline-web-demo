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
 * Two states. Collapsed it is just the pill. Clicking it opens a card that
 * grows UPWARD from the pill: the quick actions listed inside, then the
 * conversation once there is one, with the field staying put at the bottom.
 * Growing upward matters — the field must not move out from under the cursor
 * that just clicked it.
 *
 * The card is capped and scrolls internally. It sits over the summary and
 * notes, so it has to stay a panel rather than become the page.
 *
 * Positioning is the page's job, not the bar's. Each surface wraps it in its
 * own container — pinned in the call's fixed-height column, fixed over the
 * scrolling list — so one component can sit correctly in two different layouts.
 *
 * `reply` is what makes it answer. Given one, the bar is live: it expands, and
 * sending writes that reply out word by word. Without one — the call list,
 * where there is no single call to answer about — the same bar stays a
 * collapsed, inert pill.
 *
 * SCRIPTED, NOT INTELLIGENT. There is no model. The reveal is deliberate rather
 * than instant: a wall of text appearing at once reads as canned, whereas
 * watching it being written reads as generated. Both delays live in
 * `timings.ts`. Nothing is persisted; it resets when you leave.
 */
export function AskBar({ reply }: { reply?: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const [messages, setMessages] = React.useState<AskMessage[]>([]);
  const [draft, setDraft] = React.useState("");
  /** True from the moment a message is sent until the last word lands. */
  const [generating, setGenerating] = React.useState(false);
  /** The assistant has started writing — the "Generating…" line gives way. */
  const [streaming, setStreaming] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);
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

  function open() {
    if (!reply) return;
    setExpanded(true);
    // Let the card paint before moving focus into it.
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  /** Clicking away from an untouched panel closes it again. */
  function onBlur() {
    if (!hasConversation && !draft.trim() && !generating) setExpanded(false);
  }

  // Collapsed: the pill on its own. This is the only state the call list has.
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={open}
        aria-expanded={false}
        aria-label={reply ? "Ask a question about this call" : "Ask anything"}
        className="flex w-full items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2.5 text-left shadow-lg transition-colors hover:border-border-strong"
      >
        <Sparkles className="h-4 w-4 shrink-0 text-brand-text" />
        <span className="flex-1 truncate text-sm text-muted-foreground">
          {reply ? "Ask a question about this call…" : "Ask anything"}
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
          <Mic className="h-4 w-4 text-muted-foreground" />
        </span>
      </button>
    );
  }

  return (
    // Capped so the panel stays a panel. `flex-col` with a scrolling body keeps
    // the field pinned to the bottom edge however tall the content gets.
    <div className="flex max-h-[26rem] w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-3">
        {hasConversation ? (
          <div className="space-y-3">
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
        ) : (
          // Listed as rows, not chips: they read as things you can ask for
          // rather than filters, and they leave the field the only input.
          <ul className="space-y-0.5">
            {QUICK_ACTIONS.map((label) => (
              <li key={label}>
                <button
                  type="button"
                  // `onMouseDown` so the action fires before the field's blur
                  // closes the panel out from under the click.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    send(label);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-secondary"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border">
                    <Sparkles className="h-3 w-3 text-brand-text" />
                  </span>
                  {label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="shrink-0 border-t border-border p-2"
      >
        <div className="flex items-center gap-2.5 rounded-full border border-brand-text bg-card px-4 py-2 ring-2 ring-brand-text/20">
          <Sparkles className="h-4 w-4 shrink-0 text-brand-text" />
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={onBlur}
            disabled={generating}
            placeholder="Ask anything"
            aria-label="Ask anything about this call"
            className="min-w-0 flex-1 bg-transparent py-0.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
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
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Mic className="h-3.5 w-3.5 text-muted-foreground" />
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
