import { COMPARISON_FIELDS, type ComparisonField, type Extraction } from "./extraction";

type Pattern = { field: ComparisonField; label: RegExp; kind: "text" | "money" | "hours" | "days" };
const PATTERNS: readonly Pattern[] = [
  { field: "employer_name", label: /^(?:employer(?: name)?|company(?: name)?)\s*[:=-]\s*(.+)$/i, kind: "text" },
  { field: "job_title", label: /^(?:job title|position|designation|role)\s*[:=-]\s*(.+)$/i, kind: "text" },
  { field: "monthly_salary_aed", label: /^(?:(?:monthly|basic)\s+)?(?:salary|wage)\s*[:=-]\s*(.+)$/i, kind: "money" },
  { field: "allowances_aed", label: /^(?:monthly\s+)?allowances?\s*[:=-]\s*(.+)$/i, kind: "money" },
  { field: "work_location", label: /^(?:work location|location|place of work)\s*[:=-]\s*(.+)$/i, kind: "text" },
  { field: "weekly_hours", label: /^(?:weekly(?: working)? hours|hours per week|working hours per week)\s*[:=-]\s*(.+)$/i, kind: "hours" },
  { field: "annual_leave_days", label: /^(?:annual leave(?: days)?|yearly leave)\s*[:=-]\s*(.+)$/i, kind: "days" },
  { field: "contract_duration", label: /^(?:contract duration|contract term|duration)\s*[:=-]\s*(.+)$/i, kind: "text" },
  { field: "passport_clause", label: /^(?:passport(?: clause)?)\s*[:=-]\s*(.+)$/i, kind: "text" },
];

export function emptyExtraction(documentType: "offer" | "contract"): Extraction {
  return { document_type: documentType, employer_name: null, job_title: null, monthly_salary_aed: null,
    allowances_aed: null, work_location: null, weekly_hours: null, annual_leave_days: null,
    contract_duration: null, passport_clause: null, source_quotes: {} };
}

// Conservative labelled-line parser. No inference, currency conversion, or legal interpretation.
export function parseContractText(text: string, documentType: "offer" | "contract"): Extraction {
  const result = emptyExtraction(documentType);
  const candidates = new Map<ComparisonField, { value: string | number; quote: string }[]>();
  for (const rawLine of text.split(/\r?\n/)) {
    for (const pattern of PATTERNS) {
      const match = rawLine.trim().match(pattern.label);
      if (!match) continue;
      const content = match[1].trim();
      if (!content || /^(?:not (?:stated|found)|unknown|n\/?a|none)$/i.test(content)) continue;
      let value: string | number = content;
      if (pattern.kind !== "text") {
        // Require explicit AED/dirham currency and reject annual/weekly salary amounts.
        if (pattern.kind === "money" && (!/\b(?:AED|dirhams?)\b/i.test(content) || /\b(?:year|annual|week|daily|day)\b/i.test(content))) continue;
        if (pattern.field === "monthly_salary_aed" && !/\bmonthly\b|per month|\/month/i.test(rawLine)) continue;
        if (pattern.kind === "hours" && /\b(?:daily|day|month)\b/i.test(content)) continue;
        if (pattern.kind === "days" && !/\bdays?\b/i.test(content)) continue;
        const numbers = content.match(/\d+(?:,\d{3})*(?:\.\d+)?/g);
        if (!numbers || numbers.length !== 1 || /[-–]\s*\d|\d\s*[-–]|\d\s*to\s*\d/i.test(content)) continue;
        value = Number(numbers[0].replace(/,/g, ""));
        if (!Number.isFinite(value)) continue;
      }
      const found = candidates.get(pattern.field) ?? [];
      found.push({ value, quote: rawLine });
      candidates.set(pattern.field, found);
    }
  }
  for (const field of COMPARISON_FIELDS) {
    const found = candidates.get(field);
    if (!found?.length) continue;
    // Conflicting repeated labels are ambiguous and remain Not found.
    if (found.some((item) => String(item.value).trim().toLowerCase() !== String(found[0].value).trim().toLowerCase())) continue;
    Object.assign(result, { [field]: found[0].value });
    result.source_quotes[field] = found[0].quote;
  }
  return result;
}
