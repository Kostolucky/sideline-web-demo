"use client";

import * as React from "react";
import { Play, Pause, RotateCcw, RotateCw } from "lucide-react";
import { formatTimestamp } from "@/lib/format";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
const SKIP_SECONDS = 10;
/** How often the simulated clock advances. 100ms keeps the scrubber smooth. */
const TICK_MS = 100;

export interface AudioPlayerHandle {
  /** Seek to a position (ms) and start playing. */
  seek: (ms: number) => void;
}

/**
 * Playback for the call review workspace.
 *
 * Two modes behind one interface. When `audioUrl` is set — you dropped a real
 * file into `public/audio/` and mapped it in `lib/demo/timings.ts` — this is the
 * production component: a native `<audio>` element with the same controls. When
 * it is null, which is the normal case for this demo, a simulated clock drives
 * the same position, and the scrubber, timer, transcript highlighting and
 * coaching timestamps all behave exactly as they would with real audio.
 *
 * Everything downstream reads position through `onTime` and drives it through
 * `seek`, so nothing else in the app knows or cares which mode is running.
 */
export const AudioPlayer = React.forwardRef<
  AudioPlayerHandle,
  {
    audioUrl: string | null;
    mimeType: string | null;
    /** Used to bound the simulated clock. Ignored when there's a real file. */
    durationSeconds: number;
    onTime?: (ms: number) => void;
    onPlayingChange?: (playing: boolean) => void;
  }
>(function AudioPlayer(
  { audioUrl, mimeType, durationSeconds, onTime, onPlayingChange },
  ref,
) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [rate, setRate] = React.useState(1);
  /** Simulated position, in ms. Unused when a real file is playing. */
  const [simMs, setSimMs] = React.useState(0);

  const simulated = !audioUrl;
  const durationMs = Math.max(1, Math.round(durationSeconds * 1000));

  /* -------------------- simulated clock -------------------- */

  React.useEffect(() => {
    if (!simulated || !playing) return;
    const timer = setInterval(() => {
      setSimMs((prev) => {
        const next = prev + TICK_MS * rate;
        if (next >= durationMs) {
          setPlaying(false);
          onPlayingChange?.(false);
          return durationMs;
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [simulated, playing, rate, durationMs, onPlayingChange]);

  React.useEffect(() => {
    if (simulated) onTime?.(simMs);
  }, [simulated, simMs, onTime]);

  /* -------------------- shared controls -------------------- */

  React.useImperativeHandle(ref, () => ({
    seek(ms: number) {
      if (simulated) {
        setSimMs(Math.max(0, Math.min(ms, durationMs)));
        setPlaying(true);
        onPlayingChange?.(true);
        return;
      }
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = ms / 1000;
      void audio.play().catch(() => {});
    },
  }));

  function skip(deltaSeconds: number) {
    if (simulated) {
      setSimMs((prev) =>
        Math.max(0, Math.min(prev + deltaSeconds * 1000, durationMs)),
      );
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime + deltaSeconds);
  }

  function togglePlay() {
    if (simulated) {
      // Restarting from the end is friendlier than a dead play button.
      if (simMs >= durationMs) setSimMs(0);
      const next = !playing;
      setPlaying(next);
      onPlayingChange?.(next);
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play().catch(() => {});
    else audio.pause();
  }

  function changeRate(r: number) {
    setRate(r);
    if (audioRef.current) audioRef.current.playbackRate = r;
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card shadow-sm p-4">
      {simulated ? (
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {formatTimestamp(simMs)}
          </span>
          <input
            type="range"
            min={0}
            max={durationMs}
            step={100}
            value={simMs}
            onChange={(e) => setSimMs(Number(e.target.value))}
            aria-label="Playback position"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary"
          />
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {formatTimestamp(durationMs)}
          </span>
        </div>
      ) : (
        <audio
          ref={audioRef}
          controls
          preload="metadata"
          className="w-full"
          onTimeUpdate={(e) => onTime?.(e.currentTarget.currentTime * 1000)}
          onPlay={() => {
            setPlaying(true);
            onPlayingChange?.(true);
          }}
          onPause={() => {
            setPlaying(false);
            onPlayingChange?.(false);
          }}
        >
          <source src={audioUrl} type={mimeType ?? undefined} />
          Your browser does not support audio playback.
        </audio>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <ControlButton
            onClick={() => skip(-SKIP_SECONDS)}
            label={`Back ${SKIP_SECONDS} seconds`}
          >
            <RotateCcw className="h-4 w-4" />
            <span className="text-xs">{SKIP_SECONDS}</span>
          </ControlButton>
          <ControlButton onClick={togglePlay} label={playing ? "Pause" : "Play"}>
            {playing ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </ControlButton>
          <ControlButton
            onClick={() => skip(SKIP_SECONDS)}
            label={`Forward ${SKIP_SECONDS} seconds`}
          >
            <span className="text-xs">{SKIP_SECONDS}</span>
            <RotateCw className="h-4 w-4" />
          </ControlButton>
        </div>

        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Speed
          <select
            value={rate}
            onChange={(e) => changeRate(Number(e.target.value))}
            className="rounded-xl border border-input bg-card px-2 py-1 text-xs font-medium text-foreground"
            aria-label="Playback speed"
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
});

function ControlButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      // Light-gray fill + a 3:1 `--input` border so the control boundary is
      // identifiable against the white card it sits on.
      className="inline-flex items-center gap-0.5 rounded-xl border border-input bg-secondary px-2.5 py-1.5 text-foreground transition-colors hover:border-muted-foreground hover:bg-secondary-hover"
    >
      {children}
    </button>
  );
}
