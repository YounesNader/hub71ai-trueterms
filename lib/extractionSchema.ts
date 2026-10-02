import { COMPARISON_FIELDS, NUMERIC_FIELDS } from "./extraction";

// Strict Structured Outputs require all properties and forbid additional keys.
// Empty quotes represent terms that are not readable or present in the image.
export const EXTRACTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    document_type: { type: "string", enum: ["offer", "contract", "unknown"] },
    ...Object.fromEntries(COMPARISON_FIELDS.map((field) => [field, {
      type: [NUMERIC_FIELDS.includes(field) ? "number" : "string", "null"],
    }])),
    source_quotes: {
      type: "object",
      additionalProperties: false,
      properties: Object.fromEntries(COMPARISON_FIELDS.map((field) => [field, { type: "string" }])),
      required: [...COMPARISON_FIELDS],
    },
  },
  required: ["document_type", ...COMPARISON_FIELDS, "source_quotes"],
};
