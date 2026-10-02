import type { Language } from "../lib/languages";
import { getStrings } from "../lib/strings";
export function ReadingScene({ language, phase }: { language: Language; phase: number }) {
 const t = getStrings(language);
 const labels = [t.offerRead, t.contractRead, t.comparing];
 return <div className="reading-scene mt-8" role="status" aria-live="polite" aria-label={t.reading}>
   <div className="scan-documents" aria-hidden="true">{[0, 1].map((doc) => <div key={doc} className="scan-document" data-document={doc}><span className="document-fold" />{[0, 1, 2, 3, 4].map((line) => <span key={line} className="scan-text-line" style={{ top: `${30 + line * 12}%`, animationDelay: `${doc * 1.6 + line * .15}s` }} />)}<span className="scan-line" /></div>)}</div>
   <p className="mt-6 text-center text-xl font-bold">{t.reading}</p>
   <div className="reading-progress mt-5" role="progressbar" aria-label={t.reading} aria-valuemin={0} aria-valuemax={100} aria-valuenow={[5, 38, 72, 95][Math.min(phase, 3)]}><span style={{ width: `${[5, 38, 72, 95][Math.min(phase, 3)]}%` }} /></div>
   <ol className="reading-steps mt-4">{labels.map((label, index) => <li key={label} data-complete={phase > index}><span className="stage-marker" aria-hidden="true" />{label}</li>)}</ol>
 </div>;
}
