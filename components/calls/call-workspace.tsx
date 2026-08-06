"use client";

import * as React from "react";
import { SummaryView } from "@/components/calls/summary-view";
import { TranscriptView } from "@/components/calls/transcript-view";
import {
  AudioPlayer,
  type AudioPlayerHandle,
} from "@/components/calls/audio-player";
import { CoachingPanel } from "@/components/coaching/coaching-panel";
import { cn } from "@/lib/utils";
import type {
  CallRow,
  CallSummaryRow,
  TranscriptUtteranceRow,
} from "@/lib/db/types";
import type { CommentWithAuthor } from "@/lib/queries";

type Tab = "summary" | "recording";

const TABS: { value: Tab; label: string }[] = [
  { value: "summary", label: "Summary" },
  { value: "recording", label: "Recording" },
];

/**
 * The call review workspace: review modes on the left, coaching on the right.
 *
 * Summary and Recording are two ways of *reviewing* the call; coaching is the
 * action you take *while* reviewing it. So coaching is a persistent column, not a
 * third tab — otherwise you'd have to leave the evidence to write about it.
 *
 * The player is mounted once and stays mounted across tab switches (it's only
 * hidden on the other tabs). Two reasons: flipping to Summary mid-listen doesn't
 * stop playback, and the position stays live, so an Admin can listen, switch
 * tabs, and still attach that moment to a coaching message. Position flows down
 * to the transcript (highlight, auto-scroll) and to the coaching composer.
 */
export function CallWorkspace({
  call,
  summary,
  utterances,
  audioUrl,
  comments,
  currentUserId,
  repName,
  notes,
  canComment,
  isTargetRep,
  coachingLastReadAt,
}: {
  call: CallRow;
  summary: CallSummaryRow | null;
  utterances: TranscriptUtteranceRow[];
  audioUrl: string | null;
  comments: CommentWithAuthor[];
  currentUserId: string;
  repName: string;
  notes: string | null;
  canComment: boolean;
  isTargetRep: boolean;
  /** This viewer's own coaching read watermark for this call. */
  coachingLastReadAt: string | null;
}) {
  const [tab, setTab] = React.useState<Tab>("summary");
  const [currentMs, setCurrentMs] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const playerRef = React.useRef<AudioPlayerHandle>(null);

  // A finished call always has a recording to scrub, whether or not a real audio
  // file has been dropped in — the simulated clock stands in for one.
  const hasAudio = call.status === "ready";

  /** Seek within the Recording tab (transcript lines). */
  const seek = React.useCallback((ms: number) => {
    playerRef.current?.seek(ms);
  }, []);

  /** Jump into the recording from elsewhere — a coaching stamp. */
  const seekAndShowRecording = React.useCallback((ms: number) => {
    setTab("recording");
    // Let the tab paint before seeking so the active line can scroll into view.
    requestAnimationFrame(() => playerRef.current?.seek(ms));
  }, []);

  return (
    // ~67% / ~33% — enough for readable transcript lines on the left and a
    // legible conversation on the right.
    //
    // On xl the grid is a fixed height and each column scrolls inside itself,
    // so the coaching composer stays pinned in view instead of hanging off the
    // bottom of a short page. The offset accounts for the page padding and the
    // call header above. Below xl this unwinds and the page scrolls normally.
    <div className="grid gap-6 xl:h-[calc(100dvh-11rem)] xl:grid-cols-[2fr_1fr]">
      <div className="flex min-w-0 flex-col xl:overflow-hidden">
        <div
          role="tablist"
          aria-label="Call review mode"
          className="flex flex-wrap items-center gap-x-1 border-b border-border"
        >
          {TABS.map((t) => {
            const selected = tab === t.value;
            return (
              <button
                key={t.value}
                id={`call-tab-${t.value}`}
                role="tab"
                aria-selected={selected}
                aria-controls="call-tabpanel"
                onClick={() => setTab(t.value)}
                className={cn(
                  "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                  selected
                    ? "border-brand-text text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            );
          })}

          {/* Below xl the coaching column flows underneath — offer a jump. */}
          <a
            href="#coaching"
            className="ml-auto px-2 py-2.5 text-sm font-medium text-brand-text hover:underline xl:hidden"
          >
            Coaching{comments.length > 0 ? ` (${comments.length})` : ""}
          </a>
        </div>

        <div
          id="call-tabpanel"
          role="tabpanel"
          aria-labelledby={`call-tab-${tab}`}
          // Scrolls independently of the coaching column beside it.
          className="mt-4 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1"
        >
          {/* Mounted in every tab, shown only in Recording — see the note above. */}
          {hasAudio && (
            <div
              className={cn(
                tab === "recording"
                  ? "lg:sticky lg:top-0 lg:z-20 lg:bg-background lg:pb-3 lg:pt-1"
                  : "hidden",
              )}
            >
              <AudioPlayer
                ref={playerRef}
                audioUrl={audioUrl}
                mimeType={call.audio_mime_type}
                durationSeconds={call.duration_seconds ?? 0}
                onTime={setCurrentMs}
                onPlayingChange={setPlaying}
              />
            </div>
          )}

          {tab === "summary" && (
            <SummaryView
              call={call}
              summary={summary}
              notes={notes}
              repName={repName}
              canEditNotes={isTargetRep}
            />
          )}
          {tab === "recording" && (
            <TranscriptView
              utterances={utterances}
              currentMs={currentMs}
              playing={playing}
              onSeek={seek}
              hasAudio={hasAudio}
            />
          )}
        </div>
      </div>

      {/* A full-height column, not a stack of cards: the conversation scrolls
          inside it and the composer stays pinned at the bottom, so the rail
          behaves like a chat window rather than more page content. Below xl it
          stacks under the review content and falls back to its own height. */}
      <aside id="coaching-rail" className="min-w-0 xl:h-full xl:overflow-hidden">
        <CoachingPanel
          callId={call.id}
          comments={comments}
          currentUserId={currentUserId}
          canComment={canComment}
          role={canComment ? "admin" : "member"}
          lastReadAt={coachingLastReadAt}
          currentMs={currentMs}
          hasAudio={hasAudio}
          onSeek={seekAndShowRecording}
        />
      </aside>
    </div>
  );
}
