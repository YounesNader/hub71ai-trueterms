import { routingResult, type AuthorityContent } from "../lib/authorityContent";

export function ResultsAuthority({ content, selectedId, onSelect }: {
  content: AuthorityContent;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <section aria-labelledby="rule-card-heading" className="mt-10 border-t border-line pt-8">
        <h2 id="rule-card-heading" className="text-xl font-bold">Rule card</h2>
        <p className="mt-4 whitespace-pre-wrap leading-relaxed">{content.ruleCard.text}</p>
        <p className="mt-4 whitespace-pre-wrap leading-relaxed text-muted">{content.ruleCard.source}</p>
      </section>
      <section aria-labelledby="routing-heading" className="mt-10 border-t border-line pt-8">
        <h2 id="routing-heading" className="text-xl font-bold">Where to get help</h2>
        <p className="mt-4 leading-relaxed text-muted">You select the authority. TrueTerms does not determine jurisdiction or submit your summary.</p>
        <fieldset className="routing-question mt-5">
          <legend className="mb-4 font-bold">{content.routingQuestion}</legend>
          <div className="flex flex-col gap-3">
            {content.routingOptions.map((option) => (
              <button key={option.id} type="button" aria-pressed={selectedId === option.id} onClick={() => onSelect(option.id)}
                className={`min-h-[52px] rounded-lg border px-5 py-4 text-left ${selectedId === option.id ? "border-accent bg-accent-soft text-accent" : "border-line bg-white hover:border-accent"}`}>
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
        <p role="status" className="mt-5 whitespace-pre-wrap leading-relaxed">{routingResult(content, selectedId)}</p>
      </section>
      <section aria-labelledby="bring-heading" className="mt-10 border-t border-line pt-8">
        <h2 id="bring-heading" className="text-xl font-bold">What to bring</h2>
        <p className="mt-4 leading-relaxed text-muted">Documents used in this comparison. This is not an authority checklist.</p>
        <ul className="mt-4 list-disc space-y-3 pl-6 leading-relaxed">
          {content.whatToBring.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
      </section>
    </>
  );
}
