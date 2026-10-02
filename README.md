# hub71ai-trueterms

TrueTerms is a Next.js 14 app using TypeScript, the App Router, and Tailwind CSS.

## Run locally

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Run `npm run build` for a production build, `npm start` to serve it, `npm run lint` for lint checks, and `npm test` for comparison and server route tests.

The single page has Home, Upload, and Results states. Language selection is retained; interface labels are English and the Results summary uses fixed English, Urdu, Hindi, or Bengali translations with comparison values. Urdu summaries use RTL direction. Choose two JPG/PNG images (up to 3 MB each), then select **Check** to extract their terms and compare them. **Use sample documents** makes zero API calls and produces exactly two differences: job title and monthly salary. The sample button also remains available during live checking or after an error.

## Live extraction

Set `OPENAI_API_KEY` in the server environment before starting the app. For local development, an ignored `.env.local` file can hold it. Never use a `NEXT_PUBLIC_` variable for the key, or commit an environment file.

`POST /api/extract` accepts `{ imageBase64, documentType }`, where `documentType` is `offer` or `contract`. `imageBase64` can be raw base64 or a JPG/PNG data URL. The server sends the image to the OpenAI Responses API using `gpt-6-astra` and a strict JSON schema. Missing or unreadable terms are null; `source_quotes` contains exact document text, with empty strings for absent terms. Responses and document data are not logged or cached by the app; the OpenAI request uses `store: false`.

`lib/compareExtractions.ts` compares the nine employment terms. Numbers compare exactly; text is trimmed and lowercased. If either value is null, the status is `not found`. Document type and source quotes are metadata and are excluded from comparison. Results retain the original values and include text status labels alongside the teal highlight.

Results show promised and written values in two adjacent halves per card, with changed terms first. Prepared examples include exact lines printed on their clearly labelled demonstration images. OCR quotes are recognised text and must be checked against the image. Tap a term to open its hard-coded glossary meaning from `data/glossary.json`, in the selected language with English beneath it. Glossary translations are labelled as drafts. Glossary and summary audio share `ListenButton`.

## Summary audio

`POST /api/speak` accepts `{ text, language }`. It uses the server's `OPENAI_API_KEY` with OpenAI speech generation and returns MP3 audio. Results play it through standard HTML audio controls. Audio is kept in browser memory and released when leaving Results; the app does not save it. Missing keys, provider errors, and timeouts leave the written summary available.

Sample and no-key Listen use installed local device voices only, with no API calls. If the selected language voice is absent, Listen reads the English version using an installed English voice. If neither is available, Listen is hidden and the written text stays visible. Live speech falls back to device speech after a provider error or a 12-second timeout.

## No-key demo

No key is required. Prepared cases (salary/job title changed, matching listed terms, hours/leave changed) load hard-coded data and images instantly, with zero API calls, including status checks. Download the demonstration images from Results to test real uploads.

For real uploads only, one uncached `GET /api/status` reports a boolean capability flag. If a key is configured, existing extraction and speech routes are selected automatically. Failed live extraction falls back after 15 seconds to device OCR. There is no `/api/explain` route; explanations are deterministic templates in four languages, at most four template sentences, regardless of whether a key exists.

English device OCR uses lazy-loaded Tesseract.js with same-origin worker, WebAssembly and language assets copied from npm dependencies during prebuild/predev. No image leaves the device on the no-key path. The initial asset download needs internet; “Offline mode” means local processing, not guaranteed airplane-mode operation. Clear, labelled, printed English is supported; handwriting, unlabeled paragraphs and blurry photos are not reliable. Unreadable or ambiguous fields remain null/Not found. A 35-second OCR limit returns an informative Results screen. No IndexedDB cache, document storage, or database is used.

## Evidence sheet

“Print or save my summary” calls window.print() and shows only the English evidence sheet: date, changed fields/quotes, the existing disclaimer copied verbatim from AGENTS.md rule 8 with its project source, the worker-selected authority (or Other free zone or not sure), the two document labels, and the required declaration. Prepared examples fit one A4 page; long real quotes can require additional pages and are never truncated. Print-dialog headers/footers are controlled by the browser.

The Rule card is existing project guidance, not a verified legal rule. Routing is an explicit worker selection among names already in the repo, not a jurisdiction determination. What to bring contains only the existing Job offer image and Contract image labels, not an authority checklist. The app does not submit the sheet anywhere.

## Vercel

`vercel.json` selects the Next.js framework preset, including for the project imported while this repository was empty. Keep the repository root (`./`) and clear any custom build or output overrides if you previously set them. Add `OPENAI_API_KEY` under Vercel project settings → Environment Variables and redeploy to enable live extraction. The sample path works without a key.

## Impeccable in Codex

This project includes the [Impeccable](https://github.com/pbakaus/impeccable) skill in `.agents/skills/impeccable` and its design hook in `.codex/hooks.json`.

Open this repository in Codex and use `$impeccable init` to record the product context before starting a new interface. For later design work, use `$impeccable audit`, `$impeccable polish`, or another command from the skill. Open `/hooks` in Codex and approve this project's hook when prompted so UI edits trigger its design checks.

