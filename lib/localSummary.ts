import type { ComparisonResult } from "./compareExtractions";
import type { ComparisonField } from "./extraction";
import { FIELD_LABELS } from "./fieldLabels";
import type { Language } from "./languages";

const LABELS: Record<Language, Record<ComparisonField, string>> = {
  English: FIELD_LABELS,
  Urdu: {
    employer_name: "آجر کا نام", job_title: "ملازمت کا عہدہ", monthly_salary_aed: "ماہانہ تنخواہ (درہم)",
    allowances_aed: "الاؤنس (درہم)", work_location: "کام کی جگہ", weekly_hours: "ہفتہ وار کام کے گھنٹے",
    annual_leave_days: "سالانہ چھٹی کے دن", contract_duration: "معاہدے کی مدت", passport_clause: "پاسپورٹ کی شق",
  },
  Hindi: {
    employer_name: "नियोक्ता का नाम", job_title: "पद", monthly_salary_aed: "मासिक वेतन (AED)",
    allowances_aed: "भत्ते (AED)", work_location: "काम की जगह", weekly_hours: "साप्ताहिक काम के घंटे",
    annual_leave_days: "सालाना छुट्टी के दिन", contract_duration: "अनुबंध की अवधि", passport_clause: "पासपोर्ट की शर्त",
  },
  Bengali: {
    employer_name: "নিয়োগকর্তার নাম", job_title: "পদের নাম", monthly_salary_aed: "মাসিক বেতন (AED)",
    allowances_aed: "ভাতা (AED)", work_location: "কাজের স্থান", weekly_hours: "সাপ্তাহিক কাজের ঘণ্টা",
    annual_leave_days: "বার্ষিক ছুটির দিন", contract_duration: "চুক্তির মেয়াদ", passport_clause: "পাসপোর্টের শর্ত",
  },
};

const COPY = {
  English: {
    count: (n: number) => `${n} differences found between your offer and contract.`,
    matches: "All terms found in both documents match.",
    term: (label: string, offer: string, contract: string) => `${label}: offer ${offer}; contract ${contract}`,
    different: "This is different from your offer.",
    missing: (n: number) => `${n} terms were not found in one or both documents.`,
  },
  Urdu: {
    count: (n: number) => `آپ کی پیشکش اور معاہدے میں ${n} فرق ملے۔`,
    matches: "دونوں دستاویزات میں ملنے والی تمام شرائط ایک جیسی ہیں۔",
    term: (label: string, offer: string, contract: string) => `${label}: پیشکش ${offer}؛ معاہدہ ${contract}`,
    different: "یہ آپ کی پیشکش سے مختلف ہے۔",
    missing: (n: number) => `${n} شرائط ایک یا دونوں دستاویزات میں نہیں ملیں۔`,
  },
  Hindi: {
    count: (n: number) => `आपके प्रस्ताव और अनुबंध में ${n} अंतर मिले।`,
    matches: "दोनों दस्तावेज़ों में मिली सभी शर्तें एक जैसी हैं।",
    term: (label: string, offer: string, contract: string) => `${label}: प्रस्ताव ${offer}; अनुबंध ${contract}`,
    different: "यह आपके प्रस्ताव से अलग है।",
    missing: (n: number) => `${n} शर्तें एक या दोनों दस्तावेज़ों में नहीं मिलीं।`,
  },
  Bengali: {
    count: (n: number) => `আপনার প্রস্তাব ও চুক্তিতে ${n}টি পার্থক্য পাওয়া গেছে।`,
    matches: "উভয় নথিতে পাওয়া সব শর্ত একই।",
    term: (label: string, offer: string, contract: string) => `${label}: প্রস্তাব ${offer}; চুক্তি ${contract}`,
    different: "এটি আপনার প্রস্তাব থেকে আলাদা।",
    missing: (n: number) => `${n}টি শর্ত একটি বা উভয় নথিতে পাওয়া যায়নি।`,
  },
};

// Fixed translations and comparison values only; never a model call or legal claim.
export function buildLocalSummary(comparison: ComparisonResult, language: Language): string[] {
  const copy = COPY[language];
  const different = comparison.rows.filter((row) => row.status === "different");
  const missing = comparison.rows.filter((row) => row.status === "not found").length;
  const same = comparison.rows.some((row) => row.status === "same");
  const ending = language === "English" ? "." : language === "Urdu" ? "۔" : "।";
  // At most four template sentences, even when many fields differ.
  return [
    different.length === 0 && same ? copy.matches : copy.count(different.length),
    ...(different.length ? [different.map((row) => copy.term(LABELS[language][row.field], String(row.offer), String(row.contract))).join("; ") + ending, copy.different] : []),
    ...(missing ? [copy.missing(missing)] : []),
  ];
}
