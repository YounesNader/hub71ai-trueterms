import { getStrings } from "../lib/strings";
import type { Language } from "../lib/languages";
import { routingResult, type AuthorityContent } from "../lib/authorityContent";

export function ResultsAuthority({ content, selectedId, onSelect, language = "English" }: {
  language?: Language;
  content: AuthorityContent;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const t = getStrings(language);
  return (
    <>
      <section aria-labelledby="rule-card-heading" className="mt-10 border-t border-line pt-8">
        <h2 id="rule-card-heading" className="text-xl font-bold">{t.rule}</h2>
        <p className="mt-4 whitespace-pre-wrap leading-relaxed">{language !== "English" && <span className="mb-3 block text-lg">{t.footer}</span>}<span lang="en" dir="ltr" className="block text-base">{content.ruleCard.text}</span></p>
      </section>
      <section aria-labelledby="routing-heading" className="mt-10 border-t border-line pt-8">
        <h2 id="routing-heading" className="text-xl font-bold">{t.help}</h2>
        <p className="mt-4 leading-relaxed text-muted">{t.routingNote}</p>
        <fieldset className="routing-question mt-5">
          <legend className="mb-4 font-bold">{language === "English" ? content.routingQuestion : t.routingQuestion}</legend>
          <div className="flex flex-col gap-3">
            {content.routingOptions.map((option) => (
              <button key={option.id} type="button" aria-pressed={selectedId === option.id} onClick={() => onSelect(option.id)}
                className={`min-h-[52px] rounded-lg border px-5 py-4 text-start ${selectedId === option.id ? "border-accent bg-accent-soft text-accent" : "border-line bg-white hover:border-accent"}`}>
                {option.id === "not-sure" ? t.notSure : option.label}
              </button>
            ))}
          </div>
        </fieldset>
        <p role="status" className="mt-5 whitespace-pre-wrap leading-relaxed">{language !== "English" && <span className="mb-3 block text-lg">{selectedId === "mohre" ? "MOHRE" : selectedId === "adgm" ? "ADGM" : t.notSure}</span>}<span lang="en" dir="ltr" className="block text-base">{routingResult(content, selectedId)}</span></p>
      </section>
      <section aria-labelledby="bring-heading" className="mt-10 border-t border-line pt-8">
        <h2 id="bring-heading" className="text-xl font-bold">{t.bring}</h2>
        <p className="mt-4 leading-relaxed text-muted">{t.bringNote}</p>
        <ul className="mt-4 list-disc space-y-3 ps-6 leading-relaxed">
          {content.whatToBring.map((item, index) => <li key={index}>{language === "English" ? item : item === "Job offer image" ? t.offerImage : item === "Contract image" ? t.contractImage : item}</li>)}
        </ul>
      </section>
    </>
  );
}
