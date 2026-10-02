"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { compareExtractions, type ComparisonResult } from "@/lib/compareExtractions";
import { COMPARISON_FIELDS, isExtraction, MAX_IMAGE_BYTES, type Extraction } from "@/lib/extraction";
import { PREPARED_CASES, type PreparedCase } from "@/lib/preparedCases";
import { ComparisonCards } from "./ComparisonCards";
import { generatedDate } from "@/lib/evidence";
import type { Language } from "@/lib/languages";
import { LocalSummary } from "./LocalSummary";
import { hasLiveReading } from "@/lib/apiStatus";
import type { DeviceReading } from "@/lib/readOnDevice";
import { AUTHORITY_CONTENT, routingResult } from "@/lib/authorityContent";
import { ResultsAuthority } from "./ResultsAuthority";
import { EvidenceSheet } from "./EvidenceSheet";
import { DocumentImages } from "./DocumentImages";

import { getStrings, translateMessage } from "@/lib/strings";

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
  const [example, setExample] = useState<PreparedCase | null>(null);
  const [checking, setChecking] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [readingMode, setReadingMode] = useState<"unknown" | "offline" | "live">("unknown");
  const [readingNotice, setReadingNotice] = useState("");
  const [readingProgress, setReadingProgress] = useState("");
  const [authority, setAuthority] = useState<string | null>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const t = getStrings(language);
  useEffect(() => {
    try { const saved = localStorage.getItem("trueterms-language"); const item = LANGUAGES.find((entry) => entry.code === saved); if (item) setLanguage(item.name); } catch { /* Storage is optional. */ }
  }, []);
  function changeLanguage(next: Language) { setLanguage(next); try { localStorage.setItem("trueterms-language", LANGUAGES.find((entry) => entry.name === next)!.code); } catch { /* Storage is optional. */ } }

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

  function loadExample(selected: PreparedCase = PREPARED_CASES[0]) {
    cancelCheck();
    setUploadError("");
    setComparison(compareExtractions(selected.offer, selected.contract));
    setDocuments({ offer: selected.offer, contract: selected.contract });
    setExample(selected);
    setReadingMode("offline");
    setReadingNotice("Prepared example loaded on this device. No OCR or AI call was used.");
    setAuthority(null);
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
    }, 60_000);
    try {
      setReadingProgress("Checking which reader is available.");
      const live = await hasLiveReading(controller.signal);
      if (controller.signal.aborted) return;
      let result: DeviceReading | null = null;
      if (live) {
        setReadingMode("live");
        setReadingProgress("Reading with OpenAI. Device reading is available if it takes too long.");
        try {
          const images = await Promise.all([readImage(jobOffer), readImage(contract)]);
          const liveSignal = AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]);
          const [offer, signedContract] = await Promise.all([
            extractImage(images[0], "offer", liveSignal), extractImage(images[1], "contract", liveSignal),
          ]);
          if (COMPARISON_FIELDS.some((field) => offer[field] !== null && signedContract[field] !== null)) {
            result = { offer, contract: signedContract, notice: "Read with OpenAI. Check every value and quote against your documents." };
          }
        } catch { /* Try device reading when the configured service is unavailable. */ }
      }
      if (controller.signal.aborted) return;
      if (!result) {
        setReadingMode("offline");
        const { readOnDevice } = await import("@/lib/readOnDevice");
        result = await readOnDevice(jobOffer, contract, controller.signal, setReadingProgress);
      }
      if (controller.signal.aborted) return;
      setComparison(compareExtractions(result.offer, result.contract));
      setDocuments({ offer: result.offer, contract: result.contract });
      setReadingNotice(result.notice);
      setAuthority(null);
      setDate(generatedDate());
      setUsingSample(false);
      setExample(null);
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
    <>
    <div dir={language === "Urdu" ? "rtl" : "ltr"} lang={LANGUAGES.find((item) => item.name === language)?.code} className="screen-layout flex min-h-screen flex-col pt-[132px] sm:pt-[86px]">
      <header className="top-bar">
        <div className="top-bar-inner">
          <div className="flex items-center gap-3"><button type="button" className="brand-button" onClick={() => { cancelCheck(); moveTo("home"); }}>TrueTerms</button>
          {screen !== "home" && <button type="button" className="top-back" onClick={() => { cancelCheck(); moveTo(screen === "results" ? "upload" : "home"); }}>{t.back}</button>}</div>
          <nav aria-label={t.language} className="language-switcher">{LANGUAGES.map((item) => <button key={item.code} type="button" lang={item.code} dir={item.code === "ur" ? "rtl" : "ltr"} aria-pressed={language === item.name} onClick={() => changeLanguage(item.name)}>{item.nativeName}</button>)}</nav>
        </div>
      </header>
      {readingMode === "offline" && <p className="mx-auto w-full max-w-3xl px-6 pt-5 text-muted">{t.offline}</p>}
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8 sm:px-10 sm:py-12">
        {screen === "home" && (
          <section aria-labelledby="screen-heading">
            <h1 id="screen-heading" ref={headingRef} tabIndex={-1} className="font-display text-4xl leading-tight sm:text-5xl">
              {t.home}
            </h1>
            <p className="mt-6 max-w-prose leading-relaxed text-muted">
              {t.intro}
            </p>
            <button type="button" onClick={() => moveTo("upload")} className="primary-button mt-8 w-full sm:w-auto">
              {t.start}
            </button>
          </section>
        )}

        {screen === "upload" && (
          <section aria-labelledby="screen-heading">
            <h1 id="screen-heading" ref={headingRef} tabIndex={-1} className="font-display text-4xl leading-tight sm:text-5xl">{t.upload}</h1>
            <p className="mt-6 leading-relaxed text-muted">{t.fileHelp}</p>
            <p className="mt-3 leading-relaxed text-muted">{t.readerHelp}</p>
            
            <div className="mt-10 space-y-8">
              {([
                { field: "jobOffer", label: t.offerImage, file: jobOffer },
                { field: "contract", label: t.contractImage, file: contract },
              ] as const).map(({ field, label, file }) => (
                <div key={field}>
                  <label htmlFor={field} className="mb-3 block font-bold">{label}</label>
                  <button type="button" disabled={checking} className="secondary-button" onClick={() => document.getElementById(field)?.click()} aria-label={`${t.chooseFile}: ${label}`}>{t.chooseFile}</button>
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
                    tabIndex={-1}
                    accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                    onChange={(event) => chooseFile(event, field)}
                    disabled={checking}
                    aria-invalid={Boolean(fileErrors[field])}
                    aria-describedby={fileErrors[field] ? `${field}-error` : undefined}
                    className="sr-only"
                  />
                  {file && <p className="mt-3 break-all text-muted">{t.selected}: {file.name}</p>}
                  {fileErrors[field] && <p id={`${field}-error`} role="alert" className="mt-3 font-bold">{translateMessage(fileErrors[field], language)}</p>}
                </div>
              ))}
            </div>
            {uploadError && <p role="alert" className="mt-6 font-bold leading-relaxed">{translateMessage(uploadError, language)}</p>}
            <button type="button" onClick={checkDocuments} disabled={!jobOffer || !contract || checking} className="primary-button mt-8 w-full sm:w-auto">
              {checking ? t.reading : t.check}
            </button>
            {checking && <p role="status" className="mt-4 leading-relaxed text-muted">{translateMessage(readingProgress, language)}</p>}
            <div className="mt-10 border-t border-line pt-8">
              <p className="mb-4 leading-relaxed text-muted">{t.sampleIntro}</p>
              <button type="button" className="secondary-button w-full sm:w-auto" onClick={() => loadExample()}>
                {t.sample}
              </button>
              <h2 className="mb-4 mt-8 text-xl font-bold">{t.examples}</h2>
              <div className="space-y-3">
                {PREPARED_CASES.map((item) => <button key={item.id} type="button" onClick={() => loadExample(item)} className="example-button block min-h-[72px] w-full rounded-xl border border-line bg-white px-5 py-4 text-start hover:border-accent">
                  <span className="block font-bold">{item.id === "salary-role" ? t.salaryCase : item.id === "matching" ? t.matchingCase : t.hoursCase}</span><span className="mt-2 block leading-relaxed text-muted">{item.id === "salary-role" ? t.salaryDescription : item.id === "matching" ? t.matchingDescription : t.hoursDescription}</span>
                </button>)}
              </div>
            </div>

          </section>
        )}

        {screen === "results" && (
          <section aria-labelledby="screen-heading">
            <h1 id="screen-heading" ref={headingRef} tabIndex={-1} className="font-display text-4xl leading-tight sm:text-5xl">{t.results}</h1>
            {usingSample && <p className="mt-6 leading-relaxed text-muted">{t.sampleNotice}</p>}
            <p className="mt-4 leading-relaxed text-muted">{translateMessage(readingNotice, language)}</p>
            {example && <div className="mt-5 flex flex-wrap gap-4">
              <a href={example.offerImage} download className="secondary-button">{t.downloadOffer}</a>
              <a href={example.contractImage} download className="secondary-button">{t.downloadContract}</a>
            </div>}
            <p className="mt-3 text-muted">{t.generated} <span dir="ltr">{date}</span></p>
            <p className="mt-4 leading-relaxed"><strong>{comparison?.rows.every((row) => row.status === "not found") ? t.unreadable : t.differences.replace("{n}", String(comparison?.different_count ?? 0))}</strong> {t.differentMeaning}</p>
            <p className="mt-3 leading-relaxed text-muted">{t.missingMeaning}</p>
            <p className="mt-4 leading-relaxed text-muted">{t.tapTerm}</p>
            {comparison && documents && <ComparisonCards comparison={comparison} offer={documents.offer} contract={documents.contract} language={language} usingSample={usingSample || readingMode !== "live"} />}
            {comparison && <LocalSummary comparison={comparison} language={language} usingSample={usingSample || readingMode !== "live"} />}
            <ResultsAuthority language={language} content={AUTHORITY_CONTENT} selectedId={authority} onSelect={setAuthority} />
            <button type="button" onClick={() => window.print()} className="primary-button mt-8 w-full sm:w-auto">{t.print}</button>
            {example ? <DocumentImages language={language} offer={example.offerImage} contract={example.contractImage} /> : jobOffer && contract ? <DocumentImages language={language} offer={jobOffer} contract={contract} /> : null}

          </section>
        )}
      </main>

      <footer className="mx-auto mt-8 w-full max-w-3xl border-t border-line px-6 py-8 sm:px-10">
        <p className="text-base leading-relaxed text-muted">{t.footer}</p>
      {language !== "English" && <p className="mt-3 leading-relaxed text-muted">{t.draft}</p>}
      </footer>
    </div>
    {screen === "results" && comparison && documents && <EvidenceSheet comparison={comparison} offer={documents.offer} contract={documents.contract} date={date} authorityContent={AUTHORITY_CONTENT} routingResult={routingResult(AUTHORITY_CONTENT, authority)} />}
    </>
  );
}
