"use client";

import { useRef, useState, type ChangeEvent } from "react";

type Screen = "home" | "upload" | "results";
type Language = "English" | "Urdu" | "Hindi" | "Bengali";

const LANGUAGES: { name: Language; nativeName: string; code: string }[] = [
  { name: "English", nativeName: "English", code: "en" },
  { name: "Urdu", nativeName: "اردو", code: "ur" },
  { name: "Hindi", nativeName: "हिन्दी", code: "hi" },
  { name: "Bengali", nativeName: "বাংলা", code: "bn" },
];

// Illustrative documents for the offline demo. Comparison rendering comes next.
const DEMO_DOCUMENTS = {
  jobOffer: { name: "Sample job offer", monthlySalaryAED: 2000 },
  contract: { name: "Sample contract", monthlySalaryAED: 1800 },
} as const;

const FOOTER = "Information only, not legal advice. For help call MOHRE 80084.";

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>("home");
  const [language, setLanguage] = useState<Language>("English");
  const [jobOffer, setJobOffer] = useState<File | null>(null);
  const [contract, setContract] = useState<File | null>(null);
  const [fileErrors, setFileErrors] = useState({ jobOffer: "", contract: "" });
  const [sampleDocuments, setSampleDocuments] = useState<typeof DEMO_DOCUMENTS | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  function moveTo(nextScreen: Screen) {
    setScreen(nextScreen);
    // Give keyboard and screen reader users the new screen's heading.
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>, field: "jobOffer" | "contract") {
    const file = event.target.files?.[0] ?? null;
    const valid = !file || ["image/jpeg", "image/png"].includes(file.type);
    setFileErrors((current) => ({ ...current, [field]: valid ? "" : "Choose a JPG or PNG image." }));
    const setFile = field === "jobOffer" ? setJobOffer : setContract;
    setFile(valid ? file : null);
    if (!valid) event.target.value = "";
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto w-full max-w-3xl px-6 pb-6 pt-8 sm:px-10 sm:pt-12">
        <p className="font-display text-2xl font-bold">TrueTerms</p>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8 sm:px-10 sm:py-12">
        {screen === "home" && (
          <section aria-labelledby="screen-heading">
            <h1 id="screen-heading" ref={headingRef} tabIndex={-1} className="font-display text-4xl leading-tight sm:text-5xl">
              Know what changed in your contract.
            </h1>
            <p className="mt-6 max-w-prose leading-relaxed text-muted">
              Check your signed employment contract against your original job offer.
            </p>
            <fieldset className="mt-10">
              <legend className="mb-4 font-bold">Choose your language</legend>
              <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
                {LANGUAGES.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    aria-pressed={language === item.name}
                    onClick={() => setLanguage(item.name)}
                    className={`min-h-[84px] rounded-lg border px-5 py-4 text-left transition-colors ${language === item.name ? "border-accent bg-accent-soft text-accent" : "border-line bg-white hover:border-accent"}`}
                  >
                    <span lang={item.code} dir={item.code === "ur" ? "rtl" : "ltr"} className="block text-xl font-bold">{item.nativeName}</span>
                    {item.name !== "English" && <span className="mt-1 block">{item.name}</span>}
                  </button>
                ))}
              </div>
            </fieldset>
            <button type="button" onClick={() => moveTo("upload")} className="primary-button mt-8 w-full sm:w-auto">
              Check my contract
            </button>
          </section>
        )}

        {screen === "upload" && (
          <section aria-labelledby="screen-heading">
            <h1 id="screen-heading" ref={headingRef} tabIndex={-1} className="font-display text-4xl leading-tight sm:text-5xl">Add your documents</h1>
            <p className="mt-6 leading-relaxed text-muted">Choose a JPG or PNG image for each document.</p>
            <p className="mt-3 text-muted">Selected language: {language}</p>
            <div className="mt-10 space-y-8">
              {([
                { field: "jobOffer", label: "Job offer image", file: jobOffer },
                { field: "contract", label: "Contract image", file: contract },
              ] as const).map(({ field, label, file }) => (
                <div key={field}>
                  <label htmlFor={field} className="mb-3 block font-bold">{label}</label>
                  <input
                    id={field}
                    type="file"
                    accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                    onChange={(event) => chooseFile(event, field)}
                    aria-invalid={Boolean(fileErrors[field])}
                    aria-describedby={fileErrors[field] ? `${field}-error` : undefined}
                    className="block min-h-[52px] w-full min-w-0 rounded-lg border border-line bg-white p-3 text-base file:mb-2 file:mr-4 file:min-h-[44px] file:rounded-md file:border-0 file:bg-accent-soft file:px-4 file:py-2 file:text-base file:font-bold file:text-accent hover:file:bg-paper"
                  />
                  {file && <p className="mt-3 break-all text-muted">Selected: {file.name}</p>}
                  {fileErrors[field] && <p id={`${field}-error`} role="alert" className="mt-3 font-bold">{fileErrors[field]}</p>}
                </div>
              ))}
            </div>
            <div className="mt-10 border-t border-line pt-8">
              <p className="mb-4 leading-relaxed text-muted">Try the sample documents to preview the results screen.</p>
              <button type="button" className="primary-button w-full sm:w-auto" onClick={() => { setSampleDocuments(DEMO_DOCUMENTS); moveTo("results"); }}>
                Use sample documents
              </button>
            </div>
            <button type="button" onClick={() => moveTo("home")} className="secondary-button mt-6 w-full sm:w-auto">Back</button>
          </section>
        )}

        {screen === "results" && (
          <section aria-labelledby="screen-heading">
            <h1 id="screen-heading" ref={headingRef} tabIndex={-1} className="font-display text-4xl leading-tight sm:text-5xl">Your comparison</h1>
            {sampleDocuments && <p className="mt-6 leading-relaxed text-muted">Sample documents selected. Comparison details will appear here in the next update.</p>}
            <div className="mt-8 overflow-x-auto">
              <table className="w-full border-collapse text-left text-base">
                <caption className="mb-4 text-left font-bold">Comparison results</caption>
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className="py-4 pr-3">Term</th>
                    <th scope="col" className="px-3 py-4">Job offer</th>
                    <th scope="col" className="py-4 pl-3">Contract</th>
                  </tr>
                </thead>
                <tbody />
              </table>
            </div>
            <button type="button" onClick={() => moveTo("upload")} className="secondary-button mt-8 w-full sm:w-auto">Back</button>
          </section>
        )}
      </main>

      <footer className="mx-auto mt-8 w-full max-w-3xl border-t border-line px-6 py-8 sm:px-10">
        <p className="text-base leading-relaxed text-muted">{FOOTER}</p>
      </footer>
    </div>
  );
}
