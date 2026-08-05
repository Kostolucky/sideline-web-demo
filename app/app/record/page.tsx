import { Recorder } from "@/components/record/recorder";
import { RecordOnMobile } from "@/components/record/record-on-mobile";
import { flags } from "@/lib/flags";

export const metadata = { title: "Record a call · Sideline AI" };

/**
 * Both variants are worth demoing: the in-browser recorder, and the
 * "record on the mobile app" notice shown when browser recording is off.
 * Flip `flags.browserRecording` in `lib/flags.ts` to switch between them.
 */
export default function RecordPage() {
  return (
    <div className="py-2">
      {flags.browserRecording ? <Recorder /> : <RecordOnMobile />}
    </div>
  );
}
