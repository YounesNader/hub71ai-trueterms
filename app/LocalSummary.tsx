"use client";
import type { ComparisonResult } from "../lib/compareExtractions";
import { LANGUAGE_CODES, type Language } from "../lib/languages";
import { buildLocalSummary } from "../lib/localSummary";
import { ListenButton } from "./ListenButton";
export function LocalSummary({ comparison, language, usingSample }: { comparison: ComparisonResult; language: Language; usingSample: boolean }) {
  const paragraphs = buildLocalSummary(comparison, language);
  return (
    <section aria-labelledby="local-summary-heading" className="mt-10 border-t border-line pt-8">
      <h2 id="local-summary-heading" className="text-xl font-bold">Summary in {language}</h2>
      <div lang={LANGUAGE_CODES[language]} dir={language === "Urdu" ? "rtl" : "ltr"} className="my-5 space-y-4 break-words leading-relaxed">
        {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      </div>
      <ListenButton key={language + String(usingSample)} text={paragraphs.join("\n\n")} englishText={buildLocalSummary(comparison, "English").join("\n\n")} language={language} usingSample={usingSample} />
    </section>
  );
}
