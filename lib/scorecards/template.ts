/**
 * Default home-services scorecard (spec §11). Seeded as the initial template while
 * keeping the system configurable — orgs can edit criteria later. No server-only
 * imports so both the seed and the UI can share the labels.
 */
export const DEFAULT_SCORECARD_NAME = "Home Services";

export const DEFAULT_SCORECARD_CRITERIA: {
  name: string;
  description: string;
}[] = [
  { name: "Rapport & agenda", description: "Built rapport and set a clear agenda for the visit." },
  { name: "Discovery", description: "Asked open questions to understand the customer's situation." },
  { name: "Problem & consequence", description: "Surfaced the problem and its consequences if unaddressed." },
  { name: "Decision-maker confirmation", description: "Confirmed all decision-makers were present/involved." },
  { name: "Solution presentation", description: "Presented a solution tied to the customer's needs." },
  { name: "Differentiation & trust", description: "Differentiated the offer and built trust/credibility." },
  { name: "Financing or payment", description: "Presented financing or payment options clearly." },
  { name: "Objection handling", description: "Acknowledged and addressed objections effectively." },
  { name: "Closing attempt", description: "Made a clear attempt to close or advance the sale." },
  { name: "Clear next step", description: "Established a specific, mutually-agreed next step." },
];

export const SCORECARD_RESULTS = [
  "met",
  "partially_met",
  "not_met",
  "not_applicable",
] as const;
export type ScorecardResult = (typeof SCORECARD_RESULTS)[number];

export const SCORECARD_RESULT_LABEL: Record<ScorecardResult, string> = {
  met: "Met",
  partially_met: "Partial",
  not_met: "Not met",
  not_applicable: "N/A",
};
