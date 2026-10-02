import type { ComparisonResult } from "../lib/compareExtractions";
import type { Extraction } from "../lib/extraction";
import { FIELD_LABELS } from "../lib/fieldLabels";

export function ComparisonCards({ comparison, offer, contract }: {
  comparison: ComparisonResult;
  offer: Extraction;
  contract: Extraction;
}) {
  const rows = [...comparison.rows].sort((a, b) => Number(b.status === "different") - Number(a.status === "different"));
  return (
    <section aria-label="Comparison results" className="mt-8 space-y-6">
      {rows.map((row) => (
        <article key={row.field} data-status={row.status} className="overflow-hidden rounded-xl border border-line bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="text-xl font-bold">{FIELD_LABELS[row.field]}</h2>
            <span className={`rounded-md px-3 py-2 font-bold ${row.status === "different" ? "bg-accent text-white" : "bg-paper text-muted"}`}>
              {row.status === "different" ? "Different" : row.status === "same" ? "Same" : "Not found"}
            </span>
          </div>
          <div className="grid grid-cols-2 divide-x divide-line">
            <div className="min-w-0 px-4 py-5 sm:px-5">
              <p className="leading-snug text-muted">What was promised</p>
              <p className="mt-3 break-words text-xl font-bold tabular-nums">{row.offer ?? "Not found"}</p>
            </div>
            <div className={`min-w-0 px-4 py-5 sm:px-5 ${row.status === "different" ? "bg-accent-soft" : ""}`}>
              <p className="leading-snug text-muted">What is written</p>
              <p className="mt-3 break-words text-xl font-bold tabular-nums">{row.contract ?? "Not found"}</p>
            </div>
          </div>
          {row.status === "different" && (
            <div className="space-y-4 border-t border-line px-5 py-5">
              {[["Your offer says:", offer.source_quotes[row.field]], ["Your contract says:", contract.source_quotes[row.field]]].map(([label, quote]) => (
                <div key={label}>
                  <p className="font-bold">{label}</p>
                  {quote ? <blockquote className="mt-2 whitespace-pre-wrap break-words leading-relaxed text-muted">{quote}</blockquote> : <p className="mt-2 text-muted">No source quote available.</p>}
                </div>
              ))}
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
