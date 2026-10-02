import { COMPARISON_FIELDS, type ComparisonField, type Extraction } from "./extraction";

export type ComparisonStatus = "same" | "different" | "not found";
export type ComparisonRow = {
  field: ComparisonField;
  offer: string | number | null;
  contract: string | number | null;
  status: ComparisonStatus;
};
export type ComparisonResult = { rows: ComparisonRow[]; different_count: number };

export function compareExtractions(offer: Extraction, contract: Extraction): ComparisonResult {
  const rows = COMPARISON_FIELDS.map((field): ComparisonRow => {
    const offerValue = offer[field];
    const contractValue = contract[field];
    let status: ComparisonStatus;
    if (offerValue === null || contractValue === null) {
      status = "not found";
    } else {
      const normalize = (value: string | number) =>
        typeof value === "string" ? value.trim().toLowerCase() : value;
      status = normalize(offerValue) === normalize(contractValue) ? "same" : "different";
    }
    return { field, offer: offerValue, contract: contractValue, status };
  });
  return { rows, different_count: rows.filter((row) => row.status === "different").length };
}
