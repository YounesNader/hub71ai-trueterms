import { COMPARISON_FIELDS, type ComparisonField, type Extraction } from "./extraction";

const LABELS = [
  { field: "employer_name", label: "employer(?: name)?|company(?: name)?", kind: "text" },
  { field: "job_title", label: "job title|position(?: and reporting line)?|designation|role", kind: "text" },
  { field: "monthly_salary_aed", label: "(?:total )?(?:(?:basic |gross )?monthly |monthly basic |basic )?(?:salary|wage)|salary per month", kind: "money" },
  { field: "allowances_aed", label: "(?:total |monthly )?allowances?", kind: "money" },
  { field: "work_location", label: "work location|location|place of work|workplace", kind: "text" },
  { field: "weekly_hours", label: "weekly(?: working)? hours|hours per week|working hours(?: per week)?|work hours", kind: "hours" },
  { field: "annual_leave_days", label: "annual leave(?: days)?|yearly leave", kind: "days" },
  { field: "contract_duration", label: "contract duration|contract term|duration|contract type", kind: "text" },
  { field: "passport_clause", label: "passport(?: clause)?", kind: "text" },
] as const;
const LABEL_TEST = new RegExp(`^(?:${LABELS.map((item) => item.label).join("|")})(?:\\s*\\([^)]*\\))?(?:\\s*[:=–-]|\\s|$)`, "i");
const LABEL_ONLY = new RegExp(`^(?:${LABELS.map((item) => item.label).join("|")})(?:\\s*\\([^)]*\\))?\\s*[:=–-]?\\s*$`, "i");
const NUMBER = "\\d+(?:,\\d{3})*(?:\\.\\d+)?";
const COMPANY_ENDING = "(?:L\\.?L\\.?C\\.?|Limited|Ltd\\.?|FZE|FZ-LLC|PJSC)";

export function emptyExtraction(documentType: "offer" | "contract"): Extraction {
  return { document_type: documentType, employer_name: null, job_title: null, monthly_salary_aed: null,
    allowances_aed: null, work_location: null, weekly_hours: null, annual_leave_days: null,
    contract_duration: null, passport_clause: null, source_quotes: {} };
}

function number(value: string): number { return Number(value.replace(/,/g, "")); }
function location(value: string): string {
  // Compare an explicitly named place consistently; retain the country in its quote.
  return value.trim().replace(/,?\s+(?:UAE|United Arab Emirates)\.?$/i, "");
}

// Handles labelled rows, stacked labels/values and a bounded set of explicit
// employment phrases. No legal interpretation, amount summing, or invented values.
export function parseContractText(text: string, documentType: "offer" | "contract"): Extraction {
  const result = emptyExtraction(documentType);
  const candidates = new Map<ComparisonField, { value: string | number; quote: string; priority: number }[]>();
  const add = (field: ComparisonField, value: string | number, quote: string, priority = 1) => {
    if (typeof value === "string") value = value.trim();
    if (value === "" || (typeof value === "number" && !Number.isFinite(value))) return;
    const items = candidates.get(field) ?? [];
    items.push({ value, quote, priority }); candidates.set(field, items);
  };
  const lines = text.split(/\r?\n/);
  const units: string[] = [];
  for (let index = 0; index < lines.length; index++) {
    if (!lines[index].trim()) continue;
    units.push(lines[index]);
    const next = lines[index + 1];
    // Keep line wrapping and a label followed by its value, without swallowing a
    // neighbouring labelled field or numbered contract section.
    if (next?.trim() && !LABEL_TEST.test(next.trim()) && !/^\d+[.)]\s/.test(next.trim())) units.push(lines[index] + "\n" + next);
  }

  for (const quote of units) {
    const line = quote.replace(/^\s*\d+[.)]\s*/, "").trim();
    for (const pattern of LABELS) {
      const labelPattern = new RegExp(`^(?:${pattern.label})(?:\\s*\\([^)]*\\))?\\s*(?:[:=–-]|\\s)\\s*([\\s\\S]+)$`, "i");
      // Once a row already has a value, neighbouring prose is not part of it.
      const firstLine = line.split("\n")[0];
      const match = LABEL_ONLY.test(firstLine) ? line.includes("\n") ? line.match(labelPattern) : null : firstLine.match(labelPattern);
      if (!match) continue;
      const content = match[1].trim();
      if (/^(?:not (?:stated|found)|unknown|n\/?a|none)$/i.test(content)) continue;
      // A stacked table header has no value until the next line.
      if (LABEL_TEST.test(content)) continue;
      if (pattern.kind === "text") {
        if (pattern.field === "job_title") add(pattern.field, content.split(/,?\s+reporting\b/i)[0], quote);
        else if (pattern.field === "work_location") add(pattern.field, location(content), quote);
        else if (pattern.field === "contract_duration") {
          const duration = content.match(/(?:fixed term (?:of )?)?(\d+\s+(?:years?|months?|weeks?))/i);
          if (duration) add(pattern.field, duration[1], quote);
        } else add(pattern.field, content, quote);
      } else if (pattern.kind === "money") {
        if ((!/\b(?:AED|dirhams?|Dhs\.?)\b/i.test(content) && !/\(\s*(?:AED|dirhams?|Dhs\.?)\s*\)/i.test(firstLine)) || /\b(?:annual|year|weekly|week|daily|day)\b/i.test(content)) continue;
        if (pattern.field === "monthly_salary_aed" && !/\bmonthly\b|per month|\/month/i.test(line)) continue;
        const numbers = content.match(new RegExp(NUMBER, "g"));
        if (!numbers || numbers.length !== 1 || /[-–]\s*\d|\d\s*[-–]|\d\s*to\s*\d/i.test(content)) continue;
        add(pattern.field, number(numbers[0]), quote, /^total monthly/i.test(line) ? 4 : /\bbasic\b/i.test(line) ? 1 : 2);
      } else if (pattern.kind === "hours") {
        const weekly = content.match(new RegExp(`(${NUMBER})\\s+(?:working )?hours?\\s+(?:per|a|each)\\s+week`, "i"));
        if (weekly) add(pattern.field, number(weekly[1]), quote, 2);
        else if (/^weekly|^hours per week|^working hours per week/i.test(line) && !/\b(?:daily|day|month)\b/i.test(content)) {
          const values = content.match(new RegExp(NUMBER, "g"));
          if (values?.length === 1 && !/[-–]\s*\d|\d\s*[-–]|\d\s*to\s*\d/i.test(content)) add(pattern.field, number(values[0]), quote);
        }
      } else {
        const days = content.match(/^(\d+)\s+(?:(?:calendar|working)\s+)?days?\b/i);
        if (days) add(pattern.field, number(days[1]), quote);
      }
    }

    const heading = line.match(new RegExp(`^([A-Z][A-Z0-9 &.,'-]+\\s+${COMPANY_ENDING})$`));
    if (heading) add("employer_name", heading[1], quote);
    const employer = line.match(new RegExp(`^Between\\s+(.+?\\b${COMPANY_ENDING})(?:,|\\s)`, "i"));
    if (employer) add("employer_name", employer[1], quote, 2);

    const employed = line.match(/\bemployed\s+(?:full[- ]time\s+|part[- ]time\s+)?as\s+(.+?)\s+in\s+(.+?)(?:,\s*reporting|[.;]|$)/i);
    if (employed) { add("job_title", employed[1], quote, 3); add("work_location", location(employed[2]), quote, 3); }

    const term = line.match(/\b(?:contract runs for|fixed term of|contract duration(?: is| of)?|contract term(?: is| of)?)\s+(\d+\s+(?:years?|months?|weeks?))/i);
    if (term) add("contract_duration", term[1], quote, 2);

    // Prefer a stated total monthly amount over a stated basic amount; never add
    // allowance components to derive either field.
    if (/\b(?:remuneration|salary|wages?)\b/i.test(line) && /\bmonthly\b|per month|\/month/i.test(line) && !/\b(?:per year|per week|per day)\b/i.test(line)) {
      const total = line.match(new RegExp(`\\btotal(?: monthly salary)?\\s*[:=]?\\s*(?:AED|Dhs\\.?)\\s*(${NUMBER})(?![\\d,])`, "i"));
      if (total) add("monthly_salary_aed", number(total[1]), quote, 4);
    }
    const weekly = line.match(new RegExp(`(${NUMBER})\\s+(?:working )?hours?\\s+(?:per|a|each)\\s+week`, "i"));
    if (weekly) add("weekly_hours", number(weekly[1]), quote, 2);
    const annualLeave = line.match(/\b(\d+)\s+(?:(?:calendar|working)\s+)?days?['’]?\s+(?:of\s+|paid\s+)?annual\s+leave\b/i);
    if (annualLeave) add("annual_leave_days", number(annualLeave[1]), quote, 2);
  }

  for (const field of COMPARISON_FIELDS) {
    const all = candidates.get(field);
    if (!all?.length) continue;
    const priority = Math.max(...all.map((item) => item.priority));
    const found = all.filter((item) => item.priority === priority);
    if (found.some((item) => String(item.value).trim().toLowerCase() !== String(found[0].value).trim().toLowerCase())) continue;
    Object.assign(result, { [field]: found[0].value }); result.source_quotes[field] = found[0].quote;
  }
  return result;
}
