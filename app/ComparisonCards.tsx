"use client";
import { getStrings, getFieldLabels } from "../lib/strings";
import { useState } from "react";
import type { ComparisonResult } from "../lib/compareExtractions";
import type { ComparisonField, Extraction } from "../lib/extraction";
import type { Language } from "../lib/languages";
import { Icon } from "./Icons";
import { FieldGlossary } from "./FieldGlossary";

export function ComparisonCards({ comparison, offer, contract, language, usingSample }: {
  comparison: ComparisonResult;
  offer: Extraction;
  contract: Extraction;
  language: Language;
  usingSample: boolean;
}) {
  const [openField, setOpenField] = useState<ComparisonField | null>(null);
  const rows = [...comparison.rows].sort((a, b) => Number(b.status === "different") - Number(a.status === "different"));
  const t = getStrings(language);
  return (
    <section aria-label={t.results} className="mt-8 space-y-6">
      {rows.map((row) => (
        <article key={row.field} data-status={row.status} className="comparison-card overflow-hidden">
          <div className="card-heading flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="min-w-0 flex-1 text-xl font-bold">
              <button type="button" aria-expanded={openField === row.field} aria-controls={openField === row.field ? `meaning-${row.field}` : undefined} onClick={() => setOpenField(openField === row.field ? null : row.field)} className="field-name min-h-[44px] break-words text-start underline decoration-line underline-offset-4 hover:text-accent"><Icon name={row.field} /> <span>{getFieldLabels(language)[row.field]}</span></button>
            </h2>
            <span className="status-badge" data-status={row.status}>
              <Icon name={row.status === "different" ? "different" : row.status === "same" ? "same" : "missing"} />
              {row.status === "different" ? t.different : row.status === "same" ? t.same : t.notFound}
            </span>
          </div>
          <div className="grid grid-cols-2 divide-x divide-line rtl:divide-x-reverse">
            <div className="value-half min-w-0 px-4 py-6 sm:px-5">
              <p className="value-label text-muted">{t.promised}</p>
              <p dir="auto" className="document-value mt-3 break-words font-bold tabular-nums">{row.offer ?? t.notFound}</p>
            </div>
            <div className="value-half contract-half min-w-0 px-4 py-6 sm:px-5">
              <p className="value-label text-muted">{t.written}</p>
              <p dir="auto" className="document-value mt-3 break-words font-bold tabular-nums">{row.contract ?? t.notFound}</p>
            </div>
          </div>
          {row.status === "different" && (
            <div className="card-quotes space-y-4 border-t border-line px-5 py-5">
              {[[t.offerSays, offer.source_quotes[row.field]], [t.contractSays, contract.source_quotes[row.field]]].map(([label, quote]) => (
                <div key={label}>
                  <p className="font-bold">{label}</p>
                  {quote ? <blockquote dir="auto" className="mt-2 whitespace-pre-wrap break-words leading-relaxed text-muted">{quote}</blockquote> : <p className="mt-2 text-muted">{t.noQuote}</p>}
                </div>
              ))}
            </div>
          )}
          {openField === row.field && <FieldGlossary field={row.field} language={language} usingSample={usingSample} />}
        </article>
      ))}
    </section>
  );
}
