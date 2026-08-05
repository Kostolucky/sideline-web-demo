"use client";

import * as React from "react";
import { MessageSquareText } from "lucide-react";
import type { TranscriptUtteranceRow } from "@/lib/db/types";
import { formatTimestamp, formatSpeaker } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Stable accent per speaker, so turns are distinguishable at a glance. */
function speakerAccent(speaker: string): string {
  const code = (speaker || "A").toUpperCase().charCodeAt(0) || 65;
  return (code - 65) % 2 === 0 ? "bg-brand-text" : "bg-warning";
}

/**
 * Diarized transcript: speaker turns, each line stamped and seekable.
 *
 * Every line answers who / what / when, and clicking a line jumps the recording
 * there. Turns are separated by whitespace and a speaker heading rather than
 * rendered as chat bubbles — over a long conversation a bubble column is harder
 * to read and much harder to scan for a particular speaker.
 *
 * Presentational: the audio element lives once in `CallWorkspace`, which feeds
 * the position down and takes seeks back up.
 */
export function TranscriptView({
  utterances,
  currentMs,
  playing,
  onSeek,
  hasAudio,
}: {
  utterances: TranscriptUtteranceRow[];
  currentMs: number;
  playing: boolean;
  onSeek: (ms: number) => void;
  hasAudio: boolean;
}) {
  const activeRef = React.useRef<HTMLButtonElement>(null);

  const activeIndex = React.useMemo(() => {
    let idx = -1;
    for (let i = 0; i < utterances.length; i++) {
      if (currentMs >= utterances[i].start_ms) idx = i;
      else break;
    }
    return idx;
  }, [currentMs, utterances]);

  React.useEffect(() => {
    if (playing) {
      activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeIndex, playing]);

  if (utterances.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-5 py-10 text-center">
        <MessageSquareText className="mx-auto mb-2.5 h-7 w-7 text-muted-foreground" />
        <p className="text-sm font-medium">Transcript not available yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          The speaker-separated transcript appears here once processing finishes.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-2 sm:p-3">
      {utterances.map((u, i) => {
        const startsTurn = i === 0 || utterances[i - 1].speaker !== u.speaker;
        const active = i === activeIndex;
        return (
          <div key={u.id} className={cn(startsTurn && i > 0 && "mt-4")}>
            {startsTurn && (
              <p className="flex items-center gap-1.5 px-2 pb-1 text-xs font-semibold">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    speakerAccent(u.speaker),
                  )}
                  aria-hidden
                />
                {formatSpeaker(u.speaker)}
              </p>
            )}
            <button
              type="button"
              ref={active ? activeRef : undefined}
              onClick={() => onSeek(u.start_ms)}
              disabled={!hasAudio}
              title={hasAudio ? "Play from here" : undefined}
              aria-current={active ? "true" : undefined}
              className={cn(
                "grid w-full grid-cols-[3.25rem_minmax(0,1fr)] items-baseline gap-3 rounded-md px-2 py-1.5 text-left transition-colors",
                active ? "bg-brand-tint" : "hover:bg-secondary",
                hasAudio && "cursor-pointer",
              )}
            >
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                {formatTimestamp(u.start_ms)}
              </span>
              <span className="text-[15px] leading-relaxed">{u.text}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
