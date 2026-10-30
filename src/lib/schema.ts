import { z } from "zod";

export const FieldSchema = z.object({
  section: z.string(),
  label_original: z.string(),
  label_translated: z.string(),
  legible: z.boolean(),
  meaning: z.string(),
  example: z.string(),
  rejection_risk: z.boolean(),
  rejection_reason: z.string(),
});

export const ExplanationSchema = z.object({
  is_form: z.boolean(),
  form_title: z.string(),
  summary: z.string(),
  image_note: z.string(),
  fields: z.array(FieldSchema),
});

export type Field = z.infer<typeof FieldSchema>;
export type Explanation = z.infer<typeof ExplanationSchema>;

// Hand-written so it satisfies structured-output rules (every property
// required, no additional properties).
export const EXPLANATION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["is_form", "form_title", "summary", "image_note", "fields"],
  properties: {
    is_form: { type: "boolean" },
    form_title: { type: "string" },
    summary: { type: "string" },
    image_note: { type: "string" },
    fields: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "section",
          "label_original",
          "label_translated",
          "legible",
          "meaning",
          "example",
          "rejection_risk",
          "rejection_reason",
        ],
        properties: {
          section: { type: "string" },
          label_original: { type: "string" },
          label_translated: { type: "string" },
          legible: { type: "boolean" },
          meaning: { type: "string" },
          example: { type: "string" },
          rejection_risk: { type: "boolean" },
          rejection_reason: { type: "string" },
        },
      },
    },
  },
} as const;
