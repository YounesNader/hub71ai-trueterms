"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { compareExtractions, type ComparisonResult } from "@/lib/compareExtractions";
import { isExtraction, MAX_IMAGE_BYTES, type Extraction } from "@/lib/extraction";
import { SAMPLE_CONTRACT, SAMPLE_OFFER } from "@/lib/sampleExtractions";
import { ComparisonCards } from "./ComparisonCards";
import { generatedDate } from "@/lib/evidence";
import type { Language } from "@/lib/languages";
import { LocalSummary } from "./LocalSummary";

type Screen = "home" | "upload" | "results";

const LANGUAGES: { name: Language; nativeName: string; code: string }[] = [
  { name: "English", nativeName: "English", code: "en" },
  { name: "Urdu", nativeName: "اردو", code: "ur" },
  { name: "Hindi", nativeName: "हिन्दी", code: "hi" },
  { name: "Bengali", nativeName: "বাংলা", code: "bn" },
];

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("The image could not be opened. Choose it again."));
    reader.onerror = () => reject(new Error("The image could not be opened. Choose it again."));
    reader.readAsDataURL(file);
  });
}

async function extractImage(imageBase64: string, documentType: "offer" | "contract", signal: AbortSignal) {
  const response = await fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, documentType }),
    signal,
  });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = result && typeof result === "object" && "error" in result && typeof result.error === "string"
      ? result.error : "Checking is unavailable. Try again or use sample documents.";
    throw new Error(message);
  }
  if (!isExtraction(result)) throw new Error("The document returned incomplete data. Try again or use sample documents.");
  return result;
}

const FOOTER = "Information only, not legal advice. For help call MOHRE 80084.";

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>("home");
  const [language, setLanguage] = useState<Language>("English");
  const [jobOffer, setJobOffer] = useState<File | null>(null);
  const [contract, setContract] = useState<File | null>(null);
  const [fileErrors, setFileErrors] = useState({ jobOffer: "", contract: "" });
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [documents, setDocuments] = useState<{ offer: Extraction; contract: Extraction } | null>(null);
  const [date, setDate] = useState("");
  const [usingSample, setUsingSample] = useState(false);
  const [checking, setChecking] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const activeRequest = useRef<AbortController | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  function moveTo(nextScreen: Screen) {
    setScreen(nextScreen);
    // Give keyboard and screen reader users the new screen's heading.
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>, field: "jobOffer" | "contract") {
    const file = event.target.files?.[0] ?? null;
    const formatValid = !file || ["image/jpeg", "image/png"].includes(file.type);
    const sizeValid = !file || file.size <= MAX_IMAGE_BYTES;
    const valid = formatValid && sizeValid;
    setFileErrors((current) => ({ ...current, [field]: !formatValid ? "Choose a JPG or PNG image." : !sizeValid ? "Choose an image smaller than 3 MB." : "" }));
    setUploadError("");
    const setFile = field === "jobOffer" ? setJobOffer : setContract;
    setFile(valid ? file : null);
    if (!valid) event.target.value = "";
  }

  function cancelCheck() {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setChecking(false);
  }

  function useSamples() {
    cancelCheck();
    setUploadError("");
    setComparison(compareExtractions(SAMPLE_OFFER, SAMPLE_CONTRACT));
    setDocuments({ offer: SAMPLE_OFFER, contract: SAMPLE_CONTRACT });
    setDate(generatedDate());
    setUsingSample(true);
    moveTo("results");
  }

  async function checkDocuments() {
    if (!jobOffer || !contract || checking) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    setChecking(true);
    setUploadError("");
    const timeout = window.setTimeout(() => {
      if (activeRequest.current === controller) {
        cancelCheck();
        setUploadError("Checking took too long. Try again or use sample documents.");
      }
    }, 55_000);
    try {
      const images = await Promise.all([readImage(jobOffer), readImage(contract)]);
      if (controller.signal.aborted) return;
      const [offer, signedContract] = await Promise.all([
        extractImage(images[0], "offer", controller.signal),
        extractImage(images[1], "contract", controller.signal),
      ]);
      if (controller.signal.aborted) return;
      setComparison(compareExtractions(offer, signedContract));
      setDocuments({ offer, contract: signedContract });
      setDate(generatedDate());
      setUsingSample(false);
      moveTo("results");
    } catch (cause) {
      if (!controller.signal.aborted) {
        controller.abort();
        setUploadError(cause instanceof Error ? cause.message : "Checking is unavailable. Try again or use sample documents.");
      }
    } finally {
      window.clearTimeout(timeout);
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setChecking(false);
      }
    }
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
            <p className="mt-6 leading-relaxed text-muted">Choose a JPG or PNG image for each document, up to 3 MB each.</p>
            <p className="mt-3 leading-relaxed text-muted">When you select Check, both images are sent to OpenAI to read the document terms.</p>
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
                    ref={(input) => {
                      if (input && file) {
                        const selection = new DataTransfer();
                        selection.items.add(file);
                        input.files = selection.files;
                      }
                    }}
                    type="file"
                    accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                    onChange={(event) => chooseFile(event, field)}
                    disabled={checking}
                    aria-invalid={Boolean(fileErrors[field])}
                    aria-describedby={fileErrors[field] ? `${field}-error` : undefined}
                    className="block min-h-[52px] w-full min-w-0 rounded-lg border border-line bg-white p-3 text-base file:mb-2 file:mr-4 file:min-h-[44px] file:rounded-md file:border-0 file:bg-accent-soft file:px-4 file:py-2 file:text-base file:font-bold file:text-accent hover:file:bg-paper"
                  />
                  {file && <p className="mt-3 break-all text-muted">Selected: {file.name}</p>}
                  {fileErrors[field] && <p id={`${field}-error`} role="alert" className="mt-3 font-bold">{fileErrors[field]}</p>}
                </div>
              ))}
            </div>
            {uploadError && <p role="alert" className="mt-6 font-bold leading-relaxed">{uploadError}</p>}
            <button type="button" onClick={checkDocuments} disabled={!jobOffer || !contract || checking} className="primary-button mt-8 w-full sm:w-auto">
              {checking ? "Checking documents…" : "Check"}
            </button>
            {checking && <p role="status" className="mt-4 leading-relaxed text-muted">Reading both documents. You can use sample documents at any time.</p>}
            <div className="mt-10 border-t border-line pt-8">
              <p className="mb-4 leading-relaxed text-muted">Try a sample comparison without uploading images.</p>
              <button type="button" className="secondary-button w-full sm:w-auto" onClick={useSamples}>
                Use sample documents
              </button>
            </div>
            <button type="button" onClick={() => { cancelCheck(); moveTo("home"); }} className="secondary-button mt-6 w-full sm:w-auto">Back</button>
          </section>
        )}

        {screen === "results" && (
          <section aria-labelledby="screen-heading">
            <h1 id="screen-heading" ref={headingRef} tabIndex={-1} className="font-display text-4xl leading-tight sm:text-5xl">Your comparison</h1>
            {usingSample && <p className="mt-6 leading-relaxed text-muted">Sample comparison. These are demonstration documents.</p>}
            <p className="mt-3 text-muted">Generated on {date}</p>
            <p className="mt-4 leading-relaxed"><strong>{comparison?.different_count ?? 0} differences found.</strong> A term marked Different means this is different from your offer.</p>
            <p className="mt-3 leading-relaxed text-muted">Not found means the term was missing or could not be read in one or both documents.</p>
            <p className="mt-4 leading-relaxed text-muted">Tap a term name to read what it means.</p>
            {comparison && documents && <ComparisonCards comparison={comparison} offer={documents.offer} contract={documents.contract} language={language} usingSample={usingSample} />}
            {comparison && <LocalSummary comparison={comparison} language={language} usingSample={usingSample} />}
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
