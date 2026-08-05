/**
 * The data model, hand-written for the demo.
 *
 * Production generates this file from the live Postgres schema
 * (`supabase gen types`) and it runs to ~1,200 lines carrying roughly twenty
 * columns the interface never reads — `organization_id`, `processing_attempts`,
 * `assemblyai_transcript_id`, and so on. Copying that into a front-end-only demo
 * would import the whole backend's shape for no benefit.
 *
 * So these are deliberately slim: only the fields the UI actually renders. The
 * TYPE NAMES are kept identical to production's, which is why every copied
 * component imports `@/lib/db/types` unchanged.
 *
 * If a component needs a field that isn't here, `tsc` will say so — that is the
 * intended way to discover it, rather than shipping a silently blank cell.
 */

export type CallStatusValue =
  | "created"
  | "uploading"
  | "uploaded"
  | "transcribing"
  | "summarizing"
  | "ready"
  | "failed"
  | "deleted";

export type MemberRoleValue = "admin" | "member";
export type MemberStatusValue = "invited" | "active" | "inactive";
export type OrgStatusValue = "active" | "disabled";

export interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  status: OrgStatusValue;
  created_at: string;
}

export interface OrganizationMemberRow {
  id: string;
  /** Null for someone invited who has never signed in. */
  user_id: string | null;
  email: string;
  display_name: string | null;
  role: MemberRoleValue;
  status: MemberStatusValue;
  joined_at: string | null;
  last_login_at: string | null;
  created_at: string;
}

export interface CallRow {
  id: string;
  name: string;
  recorded_at: string;
  recorded_by: string;
  duration_seconds: number | null;
  status: CallStatusValue;
  error_message: string | null;
  audio_mime_type: string | null;
  audio_storage_path: string | null;
  notes: string | null;
  created_at: string;
}

export interface CallSummaryRow {
  call_id: string;
  participants_context: string | null;
  summary: string | null;
  /** Already coerced to string arrays — production stores these as Json. */
  main_takeaways: string[];
  next_steps: string[];
  created_at: string;
}

export interface TranscriptUtteranceRow {
  id: string;
  call_id: string;
  /** Diarization label: "A", "B", … exactly as the transcription service emits. */
  speaker: string;
  start_ms: number;
  end_ms: number;
  text: string;
  sequence_number: number;
}

export interface ConversationAnalysisRow {
  call_id: string;
  outcome: string | null;
  primary_improvement: string | null;
  /** Free-form insights payload; see `Insights` in lib/insights-shape.ts. */
  result: unknown;
  created_at: string;
}

export interface CommentRow {
  id: string;
  call_id: string;
  author_user_id: string;
  target_rep_user_id: string;
  body: string;
  /** Playback offset this message is anchored to, if any. */
  timestamp_ms: number | null;
  /** Root comment id for a reply; null for a thread root. */
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamRow {
  id: string;
  name: string;
}
