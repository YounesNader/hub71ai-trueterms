import type { AuthorityContent } from "../lib/authorityContent";
import type { ComparisonResult } from "../lib/compareExtractions";
import type { Extraction } from "../lib/extraction";
import { EVIDENCE_DECLARATION, EVIDENCE_TITLE, evidenceRows } from "../lib/evidence";
import { FIELD_LABELS } from "../lib/fieldLabels";

export function EvidenceSheet({ comparison, offer, contract, date, authorityContent, routingResult }: {
  comparison: ComparisonResult;
  offer: Extraction;
  contract: Extraction;
  date: string;
  authorityContent: AuthorityContent;
  routingResult: string | null;
}) {
  return (
    <article className="evidence-sheet" lang="en" dir="ltr" aria-label={EVIDENCE_TITLE}>
      <h1>{EVIDENCE_TITLE}</h1>
      <p>{date}</p>
      <table>
        <thead>
          <tr><th>Field name</th><th>Offer value</th><th>Contract value</th><th>Offer quote</th><th>Contract quote</th></tr>
        </thead>
        <tbody>
          {evidenceRows(comparison, offer, contract).map((row) => (
            <tr key={row.field}>
              <th scope="row">{FIELD_LABELS[row.field]}</th>
              <td>{row.offer}</td><td>{row.contract}</td>
              <td className="evidence-quote">{row.offer_quote}</td><td className="evidence-quote">{row.contract_quote}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="evidence-block">
        <p className="evidence-verbatim">{authorityContent.ruleCard.text}</p>
        <p className="evidence-verbatim">{authorityContent.ruleCard.source}</p>
      </div>
      <p className="evidence-block evidence-verbatim">{routingResult ?? authorityContent.fallbackRoutingResult}</p>
      <div className="evidence-block">
        <h2>What to bring</h2>
        <ul>{authorityContent.whatToBring.map((item, index) => <li key={index}>{item}</li>)}</ul>
      </div>
      <p className="evidence-block">{EVIDENCE_DECLARATION}</p>
    </article>
  );
}
