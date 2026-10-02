"use client";
import glossary from "../data/glossary.json";
import type { ComparisonField } from "../lib/extraction";
import { LANGUAGE_CODES, type Language } from "../lib/languages";
import { ListenButton } from "./ListenButton";

export function FieldGlossary({ field, language, usingSample }: { field: ComparisonField; language: Language; usingSample: boolean }) {
  const code = LANGUAGE_CODES[language];
  const entry = glossary[field];
  return (
    <div id={`meaning-${field}`} className="border-t border-line bg-paper px-5 py-5">
      <h3 className="font-bold">What this means</h3>
      <p lang={code} dir={code === "ur" ? "rtl" : "ltr"} className="mt-3 leading-relaxed">{entry[code]}</p>
      {code !== "en" && <p lang="en" dir="ltr" className="mt-3 leading-relaxed text-muted">{entry.en}</p>}
      <p className="my-4 leading-relaxed text-muted">Translations are drafts and are being reviewed.</p>
      <ListenButton key={field + code + String(usingSample)} text={entry[code]} englishText={entry.en} language={language} usingSample={usingSample} />
    </div>
  );
}
