import type { ComparisonResult } from "./compareExtractions";
import type { Extraction } from "./extraction";

export const EVIDENCE_TITLE = "Summary of differences between job offer and employment contract";
export const EVIDENCE_DECLARATION = "Prepared by the worker using TrueTerms. Information only, not legal advice. This summary has not been submitted to any authority.";

export function evidenceRows(comparison: ComparisonResult, offer: Extraction, contract: Extraction) {
  return comparison.rows.filter((row) => row.status === "different").map((row) => ({
    ...row,
    offer_quote: offer.source_quotes[row.field] ?? "",
    contract_quote: contract.source_quotes[row.field] ?? "",
  }));
}

export function generatedDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai", day: "numeric", month: "long", year: "numeric",
  }).format(date);
}
