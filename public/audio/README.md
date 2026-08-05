# Optional real audio

Empty on purpose. The demo drives the scrubber, the position readout and the
transcript highlighting from a simulated clock, so no audio file is needed.

To use a real recording: drop the file here and map it in `AUDIO_OVERRIDES` in
`lib/demo/timings.ts`, e.g.

    export const AUDIO_OVERRIDES = { "call-hollis": "/audio/hollis.m4a" };

The player switches to a real `<audio>` element automatically for that call.
Note the transcript timings in `lib/demo/content.ts` are written for the
simulated durations and will drift against a real recording.
