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

## Summary audio

`POST /api/speak` accepts `{ text, language }`. It uses the server's `OPENAI_API_KEY` with OpenAI speech generation and returns MP3 audio. Results play it through standard HTML audio controls. Audio is kept in browser memory and released when leaving Results; the app does not save it. Missing keys, provider errors, and timeouts leave the written summary available.

Sample-mode Listen uses an installed local device voice only and never calls an API. If no voice exists for the selected language, the page explains that offline audio is unavailable and keeps the summary readable.

## Evidence sheet preparation

`EvidenceSheet` and `ResultsAuthority` are prepared components, currently awaiting the project's exact approved rule card, source line, routing question/options/results, and What to bring list. They are not connected to the Results page yet. Production authority wording must be hard-coded verbatim; test fixtures are not authority guidance. Sample extractions currently contain no source quotes, so evidence quote cells remain empty rather than inventing document text. One-page printing must be verified after the approved content is supplied.

## Vercel

`vercel.json` selects the Next.js framework preset, including for the project imported while this repository was empty. Keep the repository root (`./`) and clear any custom build or output overrides if you previously set them. Add `OPENAI_API_KEY` under Vercel project settings → Environment Variables and redeploy to enable live extraction. The sample path works without a key.

## Impeccable in Codex

This project includes the [Impeccable](https://github.com/pbakaus/impeccable) skill in `.agents/skills/impeccable` and its design hook in `.codex/hooks.json`.

Open this repository in Codex and use `$impeccable init` to record the product context before starting a new interface. For later design work, use `$impeccable audit`, `$impeccable polish`, or another command from the skill. Open `/hooks` in Codex and approve this project's hook when prompted so UI edits trigger its design checks.

