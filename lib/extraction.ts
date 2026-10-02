export const COMPARISON_FIELDS = [
  "employer_name",
  "job_title",
  "monthly_salary_aed",
  "allowances_aed",
  "work_location",
  "weekly_hours",
  "annual_leave_days",
  "contract_duration",
  "passport_clause",
] as const;

export type ComparisonField = (typeof COMPARISON_FIELDS)[number];
export type Extraction = {
  document_type: "offer" | "contract" | "unknown";
  employer_name: string | null;
  job_title: string | null;
  monthly_salary_aed: number | null;
  allowances_aed: number | null;
  work_location: string | null;
  weekly_hours: number | null;
  annual_leave_days: number | null;
  contract_duration: string | null;
  passport_clause: string | null;
  source_quotes: Partial<Record<ComparisonField, string>>;
};

export const NUMERIC_FIELDS: readonly ComparisonField[] = [
  "monthly_salary_aed", "allowances_aed", "weekly_hours", "annual_leave_days",
];

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

export function isExtraction(value: unknown): value is Extraction {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const keys = ["document_type", ...COMPARISON_FIELDS, "source_quotes"];
  if (Object.keys(record).length !== keys.length || keys.some((key) => !(key in record))) return false;
  if (typeof record.document_type !== "string" || !["offer", "contract", "unknown"].includes(record.document_type)) return false;
  if (!COMPARISON_FIELDS.every((field) => record[field] === null || (
    NUMERIC_FIELDS.includes(field)
      ? typeof record[field] === "number" && Number.isFinite(record[field])
      : typeof record[field] === "string"
  ))) return false;
  const quotes = record.source_quotes;
  return Boolean(quotes && typeof quotes === "object" && !Array.isArray(quotes) &&
    Object.entries(quotes).every(([key, quote]) =>
      COMPARISON_FIELDS.includes(key as ComparisonField) && typeof quote === "string"));
}
