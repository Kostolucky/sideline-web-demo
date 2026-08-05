"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mic, Pause, Play, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDuration, suggestedCallName } from "@/lib/format";
import { insertRecordedCall } from "@/lib/demo/store";
import { runRecordingPipeline } from "@/lib/demo/pipeline";

/**
 * The in-browser recorder.
 *
 * Visually and behaviourally the production component, with the microphone and
 * the network taken out. Production asks for `getUserMedia`, streams into a
 * `MediaRecorder`, uploads the blob to storage and kicks off transcription. Here
 * a timer stands in for capture and `runRecordingPipeline` stands in for the
 * backend — the same phases, in the same order, at a believable pace.
 *
 * The `unsupported` and `denied` phases are gone: without a real microphone
 * there is no permission to be refused, and a dead-end error screen is not
 * something a demo should be able to wander into.
 */
type Phase = "idle" | "recording" | "paused" | "review" | "uploading";

const MIN_DURATION_SECONDS = 1;

export function Recorder() {
  const router = useRouter();

  const [phase, setPhase] = React.useState<Phase>("idle");
  const [elapsed, setElapsed] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [callName, setCallName] = React.useState("");
  const [uploadStage, setUploadStage] = React.useState<string>("");
  const [uploadPct, setUploadPct] = React.useState(0);

  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelPipelineRef = React.useRef<(() => void) | null>(null);
  const submittingRef = React.useRef(false);

  // Warn before leaving while "recording" — same guard as production.
  React.useEffect(() => {
    const risky =
      phase === "recording" || phase === "paused" || phase === "uploading";
    if (!risky) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  function startTimer() {
    stopTimer();
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  }
  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  // Declared after the helpers above so the cleanup doesn't reach backwards for
  // a function that hasn't been initialised yet. Capture the ref OBJECTS, not
  // their current values — those are both null at mount, and what needs
  // clearing is whatever they hold when the component actually goes away.
  React.useEffect(() => {
    const timer = timerRef;
    const cancel = cancelPipelineRef;
    return () => {
      if (timer.current) clearInterval(timer.current);
      cancel.current?.();
    };
  }, []);

  function resetToIdle() {
    stopTimer();
    submittingRef.current = false;
    setElapsed(0);
    setError(null);
    setCallName("");
    setUploadStage("");
    setUploadPct(0);
    setPhase("idle");
  }

  function startRecording() {
    setError(null);
    setElapsed(0);
    setPhase("recording");
    startTimer();
  }

  function pauseRecording() {
    stopTimer();
    setPhase("paused");
  }

  function resumeRecording() {
    startTimer();
    setPhase("recording");
  }

  function endRecording() {
    stopTimer();
    setCallName(suggestedCallName());
    setPhase("review");
  }

  function deleteRecording() {
    resetToIdle();
  }

  function uploadRecording() {
    if (submittingRef.current) return;
    const name = callName.trim();

    if (!name) {
      setError("Please enter a name for this call.");
      return;
    }
    if (elapsed < MIN_DURATION_SECONDS) {
      setError("This recording is too short to process.");
      return;
    }

    submittingRef.current = true;
    setError(null);
    setPhase("uploading");
    setUploadStage("Preparing upload");
    setUploadPct(10);

    const callId = insertRecordedCall(name, elapsed);
    cancelPipelineRef.current = runRecordingPipeline(callId, ({ stage, pct }) => {
      setUploadStage(stage);
      setUploadPct(pct);
    });

    // Leave for the call as soon as the upload half is done, exactly as
    // production does — the rest of the pipeline finishes on the call page,
    // where the status badge advances in place.
    setTimeout(() => router.push(`/app/calls/${callId}`), 5_200);
  }

  /* ---------------------------- render ---------------------------- */

  if (phase === "uploading") {
    return (
      <Centered>
        <div className="w-full max-w-sm text-center">
          <Spinner className="mx-auto h-7 w-7 text-brand-text" />
          <p className="mt-4 font-medium">{uploadStage}…</p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-brand-text transition-all duration-500"
              style={{ width: `${uploadPct}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Keep this screen open — we&apos;re saving your recording.
          </p>
        </div>
      </Centered>
    );
  }

  if (phase === "review") {
    return (
      <div className="mx-auto w-full max-w-sm">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Recording complete</p>
          <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">
            {formatDuration(elapsed)}
          </p>
        </div>

        <div className="mt-6 space-y-2">
          <Label htmlFor="call-name">Call name</Label>
          <Input
            id="call-name"
            value={callName}
            onChange={(e) => setCallName(e.target.value)}
            placeholder="Name this call"
            autoFocus
          />
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-danger/15 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-6 space-y-3">
          <Button
            size="lg"
            className="w-full"
            onClick={uploadRecording}
            disabled={!callName.trim()}
          >
            Upload &amp; process
          </Button>
          <ConfirmDialog
            title="Discard this recording?"
            description="The audio will be deleted from this device and won't be uploaded, transcribed, or summarized."
            confirmLabel="Discard recording"
            onConfirm={deleteRecording}
          >
            <Button variant="dangerSoft" className="w-full">
              <Trash2 className="h-4 w-4" /> Discard
            </Button>
          </ConfirmDialog>
        </div>
      </div>
    );
  }

  // idle / recording / paused
  const isRecording = phase === "recording";
  const isPaused = phase === "paused";
  const isActive = isRecording || isPaused;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center">
      <div className="flex flex-col items-center pt-6">
        {/* Idle is the deep green, active capture is the electric green — two
            distinct states. (On the dark theme idle was a neutral off-white;
            on light, `--primary` IS the green, so idle needs its own value or
            the two states would look identical.) */}
        <div
          className={`flex h-40 w-40 items-center justify-center rounded-full ${
            isActive ? "bg-record/25" : "bg-brand-tint"
          } ${isRecording ? "animate-pulse-ring" : ""}`}
        >
          <div
            className={`flex h-28 w-28 items-center justify-center rounded-full border border-brand-text ${
              isActive
                ? "bg-record text-record-foreground"
                : "bg-brand-text text-white"
            }`}
          >
            <Mic className="h-12 w-12" />
          </div>
        </div>

        {isActive ? (
          <>
            <p className="mt-8 font-mono text-5xl font-semibold tabular-nums">
              {formatDuration(elapsed)}
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm font-medium">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isRecording ? "animate-pulse bg-brand-text" : "bg-warning"
                }`}
              />
              {isRecording ? "Recording" : "Paused"}
            </p>
          </>
        ) : (
          <div className="mt-8 text-center">
            <h1 className="text-xl font-semibold">Record a call</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Place your phone between you and the customer. Sideline records the
              in-person conversation through your microphone.
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-6 w-full rounded-xl bg-danger/15 px-3 py-2 text-center text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-10 w-full">
        {!isActive && (
          <Button
            variant="record"
            size="lg"
            className="h-14 w-full text-base"
            onClick={startRecording}
          >
            <Mic className="h-5 w-5" /> Start call recording
          </Button>
        )}

        {isActive && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {isRecording ? (
                <Button
                  variant="secondary"
                  size="lg"
                  className="h-14"
                  onClick={pauseRecording}
                >
                  <Pause className="h-5 w-5" /> Pause
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="lg"
                  className="h-14"
                  onClick={resumeRecording}
                >
                  <Play className="h-5 w-5" /> Resume
                </Button>
              )}
              <Button
                variant="primary"
                size="lg"
                className="h-14"
                onClick={endRecording}
              >
                <Square className="h-5 w-5" /> End call
              </Button>
            </div>
            <ConfirmDialog
              title="Delete this recording?"
              description="Recording will stop and the audio will be removed from this device. Nothing is uploaded or processed."
              confirmLabel="Delete recording"
              onConfirm={deleteRecording}
            >
              <Button variant="dangerSoft" className="w-full">
                <Trash2 className="h-4 w-4" /> Delete recording
              </Button>
            </ConfirmDialog>
          </div>
        )}
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      {children}
    </div>
  );
}
