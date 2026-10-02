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
    const found = Object.keys(parsedOffer.source_quotes).length + Object.keys(parsedContract.source_quotes).length;
    return { offer: parsedOffer, contract: parsedContract,
      notice: found ? "Device reading uses printed English labels. Check every value and quote against your documents; OCR can make mistakes." : "No labelled terms could be read. Your results show Not found; try a clearer printed English image or use an example." };
  };
  signal.addEventListener("abort", stop, { once: true });
  const timeout = setTimeout(stop, 35_000);
  try {
    return await Promise.race([work(), stopped]);
  } catch {
    return { offer: emptyExtraction("offer"), contract: emptyExtraction("contract"), notice: "Device reading could not finish. Results show Not found; choose clearer printed English images or use an example." };
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", stop);
    if (reader.current) void reader.current.terminate().catch(() => {});
  }
}
