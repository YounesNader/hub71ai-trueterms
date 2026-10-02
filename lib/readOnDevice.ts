import type { Worker } from "tesseract.js";
import { emptyExtraction, parseContractText } from "./parseContractText";
import type { Extraction } from "./extraction";

export type DeviceReading = { offer: Extraction; contract: Extraction; notice: string };

export async function readOnDevice(offerFile: File, contractFile: File, signal: AbortSignal, progress: (text: string) => void): Promise<DeviceReading> {
  const reader: { current: Worker | null } = { current: null };
  let expired = false;
  let rejectStopped: (reason: Error) => void = () => {};
  const stop = () => {
    expired = true;
    if (reader.current) void reader.current.terminate().catch(() => {});
    rejectStopped(new Error("Device reading stopped"));
  };
  const stopped = new Promise<never>((_, reject) => { rejectStopped = reject; });
  const work = async (): Promise<DeviceReading> => {
    const { createWorker } = await import("tesseract.js");
    if (expired || signal.aborted) throw new Error("Device reading stopped");
    progress("Loading device reader. This first load may take a moment.");
    reader.current = await createWorker("eng", 1, {
      workerPath: "/ocr/worker.min.js", corePath: "/ocr/core", langPath: "/ocr/lang",
      workerBlobURL: false, cacheMethod: "none", gzip: true,
      errorHandler: () => stop(),
    });
    if (expired || signal.aborted) { void reader.current.terminate().catch(() => {}); throw new Error("Device reading stopped"); }
    progress("Reading your job offer on this device.");
    const offer = await reader.current.recognize(offerFile);
    if (signal.aborted || expired) throw new Error("Device reading stopped");
    progress("Reading your contract on this device.");
    const contract = await reader.current.recognize(contractFile);
    const parsedOffer = parseContractText(offer.data.text, "offer");
    const parsedContract = parseContractText(contract.data.text, "contract");
    const offerCount = Object.keys(parsedOffer.source_quotes).length;
    const contractCount = Object.keys(parsedContract.source_quotes).length;
    const hasText = offer.data.text.trim() && contract.data.text.trim();
    return { offer: parsedOffer, contract: parsedContract,
      notice: !hasText ? "No readable text was found in one or both photos. Try a clearer printed English image or use an example. This is not a matching-contract result."
        : offerCount || contractCount ? `Device reader found ${offerCount} terms in your offer and ${contractCount} in your contract. Check every value and quote against your documents; OCR can make mistakes.`
        : "The photos contained readable text, but no supported employment terms were matched. Try another layout or use an example. This is not a matching-contract result." };
  };
  signal.addEventListener("abort", stop, { once: true });
  const timeout = setTimeout(stop, 35_000);
  try {
    return await Promise.race([work(), stopped]);
  } catch {
    return { offer: emptyExtraction("offer"), contract: emptyExtraction("contract"), notice: "Device reader could not load or finish. No comparison was made. Try Check again or use an example; the first reader download needs an internet connection." };
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", stop);
    if (reader.current) void reader.current.terminate().catch(() => {});
  }
}
