import { EXPLANATION_JSON_SCHEMA, ExplanationSchema, type Explanation } from "./schema";
import type { Language } from "./languages";
import { streamChat } from "./openrouter";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export class ExplainError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function systemPrompt(lang: Language): string {
  return `You help people understand official forms (visa and government applications, hospital intake, tenancy agreements, school enrolment, bank account opening) that are written in bureaucratic language or in a language they do not read well.

You will receive one page of a form. Write every explanation in ${lang.english} (${lang.native}), in plain, short sentences that a person with basic reading skills can follow. Avoid jargon; if a legal or technical term must appear, explain it in the same sentence.

Return:
- is_form: false if the page is not a form or document someone fills in or signs. Then explain briefly in summary and return no fields.
- form_title: the form's name, translated into ${lang.english}.
- summary: one paragraph. What this form is for, who usually fills it in, and what typically happens after it is submitted (for example: reviewed by an officer, an appointment, a decision letter). Only describe what the form itself shows or what is standard for this type of form.
- image_note: a short note in ${lang.english} if part of the page is cut off, blurred, covered by glare, or too small to read. Empty string if the image is fine.
- documents_needed: documents the person will probably need to have with them or attach, as the form states or implies (for example passport, photo, insurance card, proof of address). Short items in ${lang.english}. Empty list if none are implied.
- fields: every field a person has to fill in, tick, initial, or sign, in reading order. Include checkboxes, initials boxes, signature lines and date lines. Skip boxes marked "for office use only". For a clause the person must initial or agree to, treat the initials box as the field and explain what the clause commits them to.

For each field:
- section: the heading the field sits under, translated into ${lang.english}. Empty string if there is none.
- label_original: the label exactly as printed, in the form's own language and script. Do not translate or correct it.
- label_translated: the label translated into ${lang.english}. Same as label_original if the form is already in ${lang.english}.
- legible: false if you cannot read the label or its surrounding text with confidence.
- meaning: what the field is actually asking for, in plain words. Mention the format the form expects (date order, capital letters, which document the answer must match).
- example: an example of a correctly formatted answer, using obviously fictional sample values. For yes/no questions and questions about personal history, health or money, show only how an answer is written, and add that the person should answer truthfully. For signature and initials fields, describe what goes there.
- rejection_risk: true only when this kind of field is widely known to cause rejections, delays or disputes (for example a name that does not match the passport exactly, a wrong date format, a missing signature, unexplained gaps, an unticked consent box). Do not invent risks.
- rejection_reason: one sentence on why, in ${lang.english}. Empty string when rejection_risk is false.

- key_terms: up to 8 difficult legal, medical or bureaucratic words or phrases that actually appear on this page (for example "joint and several", "advance directive", "mutatis mutandis"). term is the word as printed; meaning is a one or two sentence plain explanation in ${lang.english}. Empty list if the page has none.

Rules that override everything else:
1. Explain what a field asks for. Never tell the person what they personally should answer, whether they qualify, whether to sign, or whether the terms are fair. This is not legal, medical or immigration advice.
2. Never guess. If a label or the text around it is unclear, set legible to false, put what you can see in label_original with [?] where characters are unreadable, and say in meaning that this part could not be read clearly and the person should check the original or ask the office that issued the form. A wrong explanation is worse than none.
3. If the form has already been filled in, do not repeat any personal details written on it. Explain the fields only.`;
}

export async function explainForm(bytes: Uint8Array, mediaType: string, lang: Language): Promise<Explanation> {
  return streamExplanation(bytes, mediaType, lang, () => {});
}

// Streams the raw JSON text as the model writes it, then returns the
// validated result. `restart` is true when the fallback model takes over
// mid-answer: the client must then discard what it has so far.
export async function streamExplanation(
  bytes: Uint8Array,
  mediaType: string,
  lang: Language,
  onText: (delta: string, restart: boolean) => void,
  signal?: AbortSignal,
): Promise<Explanation> {
  // PDFs are turned into an image of their first page in the browser.
  if (!(IMAGE_TYPES as readonly string[]).includes(mediaType)) {
    throw new ExplainError("Please upload a JPG, PNG or PDF.", 415);
  }
  const image = `data:${mediaType};base64,${Buffer.from(bytes).toString("base64")}`;

  const { text, finishReason } = await streamChat(
    {
      max_tokens: 16000,
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: { name: "form_explanation", strict: true, schema: EXPLANATION_JSON_SCHEMA },
      },
      messages: [
        { role: "system", content: systemPrompt(lang) },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: image } },
            { type: "text", text: `Explain this form in ${lang.english}. Reply with the JSON object only.` },
          ],
        },
      ],
    },
    onText,
    signal,
  );

  if (finishReason === "content_filter") {
    throw new ExplainError("This page could not be explained. Try a clearer photo of a form.", 422);
  }
  if (finishReason === "length") {
    throw new ExplainError("This page has too many fields to explain at once.", 422);
  }

  let json: unknown;
  try {
    json = JSON.parse(stripFence(text));
  } catch {
    throw new ExplainError("The explanation came back incomplete. Please try again.", 502);
  }
  const parsed = ExplanationSchema.safeParse(json);
  if (!parsed.success) {
    throw new ExplainError("The explanation came back incomplete. Please try again.", 502);
  }
  return parsed.data;
}

// Some models wrap JSON in a markdown code fence despite the schema.
export function stripFence(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
}
