import { parse, Allow } from "partial-json";
import type { Explanation, Field } from "./schema";

// Turns the JSON text received so far into a renderable explanation, filling
// in whatever has not arrived yet. Returns null until the title has started.
export function parsePartial(text: string): Explanation | null {
  let raw: Partial<Record<keyof Explanation, unknown>>;
  try {
    // Tolerate a model that opens with a markdown code fence.
    raw = parse(text.replace(/^\s*```(?:json)?\s*/, "").replace(/\s*```\s*$/, ""), Allow.ALL);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object" || typeof raw.form_title !== "string") return null;

  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const fields = Array.isArray(raw.fields) ? (raw.fields as Partial<Field>[]) : [];
  const terms = Array.isArray(raw.key_terms) ? (raw.key_terms as { term?: unknown; meaning?: unknown }[]) : [];

  return {
    is_form: raw.is_form !== false,
    form_title: raw.form_title,
    summary: str(raw.summary),
    image_note: str(raw.image_note),
    documents_needed: Array.isArray(raw.documents_needed) ? raw.documents_needed.filter((d) => typeof d === "string" && d) : [],
    fields: fields
      .filter((f) => f && typeof f.label_original === "string")
      .map((f) => ({
        section: str(f.section),
        label_original: str(f.label_original),
        label_translated: str(f.label_translated),
        legible: f.legible !== false,
        meaning: str(f.meaning),
        example: str(f.example),
        rejection_risk: f.rejection_risk === true,
        rejection_reason: str(f.rejection_reason),
      })),
    key_terms: terms
      .filter((k) => k && typeof k.term === "string" && typeof k.meaning === "string")
      .map((k) => ({ term: k.term as string, meaning: k.meaning as string })),
  };
}
