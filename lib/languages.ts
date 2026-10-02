export const LANGUAGE_CODES = {
  English: "en",
  Urdu: "ur",
  Hindi: "hi",
  Bengali: "bn",
} as const;

export type Language = keyof typeof LANGUAGE_CODES;

export function parseLanguage(value: unknown): Language | null {
  if (typeof value !== "string") return null;
  return (Object.keys(LANGUAGE_CODES) as Language[]).find((language) =>
    language.toLowerCase() === value.trim().toLowerCase() ||
    LANGUAGE_CODES[language] === value.trim().toLowerCase()) ?? null;
}
