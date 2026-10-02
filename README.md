# hub71ai-trueterms

TrueTerms is a Next.js 14 app using TypeScript, the App Router, and Tailwind CSS.

## Run locally

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Run `npm run build` for a production build, `npm start` to serve it, and `npm run lint` for lint checks.

The single page has Home, Upload, and Results states. Language selection is retained for the next task; the interface copy is currently English. JPG and PNG inputs accept documents locally. **Use sample documents** opens the placeholder results table with hard-coded demo documents and makes no API calls. Live comparison and results rendering will be implemented in the next task.

## Vercel

`vercel.json` selects the Next.js framework preset, including for the project imported while this repository was empty. Keep the repository root (`./`) and clear any custom build or output overrides if you previously set them. No environment variables are needed for this scaffold.

## Impeccable in Codex

This project includes the [Impeccable](https://github.com/pbakaus/impeccable) skill in `.agents/skills/impeccable` and its design hook in `.codex/hooks.json`.

Open this repository in Codex and use `$impeccable init` to record the product context before starting a new interface. For later design work, use `$impeccable audit`, `$impeccable polish`, or another command from the skill. Open `/hooks` in Codex and approve this project's hook when prompted so UI edits trigger its design checks.

