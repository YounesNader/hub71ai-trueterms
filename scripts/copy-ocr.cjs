const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const output = path.join(root, "public", "ocr");
fs.mkdirSync(path.join(output, "core"), { recursive: true });
fs.mkdirSync(path.join(output, "lang"), { recursive: true });
fs.copyFileSync(path.join(root, "node_modules/tesseract.js/dist/worker.min.js"), path.join(output, "worker.min.js"));
const core = path.join(root, "node_modules/tesseract.js-core");
for (const name of fs.readdirSync(core).filter((name) => name.endsWith(".wasm.js") || name.endsWith(".wasm"))) {
  fs.copyFileSync(path.join(core, name), path.join(output, "core", name));
}
fs.copyFileSync(path.join(root, "node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz"), path.join(output, "lang", "eng.traineddata.gz"));
fs.copyFileSync(path.join(root, "node_modules/tesseract.js/LICENSE.md"), path.join(output, "LICENSE-tesseract.txt"));
fs.copyFileSync(path.join(core, "LICENSE"), path.join(output, "LICENSE-core.txt"));
console.log("Prepared same-origin English OCR assets.");
