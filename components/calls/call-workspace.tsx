"use client";

import * as React from "react";
import { SummaryView } from "@/components/calls/summary-view";
import { TranscriptView } from "@/components/calls/transcript-view";
import {
  AudioPlayer,
  type AudioPlayerHandle,
} from "@/components/calls/audio-player";
import { CallHeader } from "@/components/calls/call-header";
import { cn } from "@/lib/utils";
import type {
  CallRow,
  CallSummaryRow,
  OrganizationMemberRow,
  TranscriptUtteranceRow,
} from "@/lib/db/types";

type Tab = "summary" | "recording";

const TABS: { value: Tab; label: string }[] = [
  { value: "summary", label: "Summary" },
  { value: "recording", label: "Recording" },
];

/**
 * The call review workspace: two ways of reading one call.
 *
 * Summary and Recording are review modes, not separate pages — the whole point
 * is to move between the account of the call and the evidence for it without
 * losing your place.
 *
 * The player is mounted once and stays mounted across tab switches (it's only
 * hidden on the other tab), so flipping to Summary mid-listen doesn't stop
 * playback and the position stays live. Position flows down to the transcript
 * for highlighting and auto-scroll.
 */
export function CallWorkspace({
  call,
  rep,
  summary,
  utterances,
  audioUrl,
  repName,
  notes,
  isTargetRep,
}: {
  call: CallRow;
  rep: OrganizationMemberRow | null;
  summary: CallSummaryRow | null;
  utterances: TranscriptUtteranceRow[];
  audioUrl: string | null;
  repName: string;
  notes: string | null;
  isTargetRep: boolean;
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

  return (
    // A normal scrolling page. It briefly locked itself to the viewport height
    // so a pinned ask bar could sit under a scrolling transcript; with the bar
    // gone there is nothing to pin, and an inner scroller would only trap the
    // transcript in a box while the page around it stayed still.
    //
    // This route still opts out of the shared reading column (see
    // `ContentContainer`) because it owns its own header, so it puts the
    // padding back here.
    <div className="min-w-0">
      <div className="mx-auto flex w-full max-w-[72rem] flex-col gap-5 px-4 py-6 sm:px-6 lg:py-8">
        <CallHeader call={call} rep={rep} />

        <div className="flex min-w-0 flex-col">
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
          </div>

          <div
            id="call-tabpanel"
            role="tabpanel"
            aria-labelledby={`call-tab-${tab}`}
            className="mt-4"
          >
            {/* Mounted in every tab, shown only in Recording — see above. */}
            {hasAudio && (
              <div
                className={cn(
                  tab === "recording"
                    ? "sticky top-0 z-20 bg-background pb-3 pt-1"
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
      </div>
    </div>
  );
}
