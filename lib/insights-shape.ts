/**
 * Shape of `conversation_analyses.result`.
 *
 * Every field is optional because the column is free-form JSON in production and
 * older rows predate any given field. Mirrors the production `Insights` type.
 */
export interface Insights {
  outcome?: string;
  strengths?: string[];
  primary_improvement?: { area?: string; suggestion?: string };
  objections?: string[];
  next_steps?: string[];
  coaching_note?: string;
  customer_follow_up_draft?: string;
}

export function parseInsights(result: unknown): Insights | null {
  return result && typeof result === "object" ? (result as Insights) : null;
}
