import Anthropic from "@anthropic-ai/sdk";
import { PDFDocument } from "pdf-lib";
import { EXPLANATION_JSON_SCHEMA, ExplanationSchema, type Explanation } from "./schema";
import type { Language } from "./languages";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type ImageType = (typeof IMAGE_TYPES)[number];

export class ExplainError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

let client: Anthropic | undefined;

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

async function firstPageOfPdf(bytes: Uint8Array): Promise<string> {
  let src: PDFDocument;
  try {
    src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  } catch {
    throw new ExplainError("This PDF could not be opened. Try a photo of the page instead.", 400);
  }
  if (src.getPageCount() === 0) throw new ExplainError("This PDF has no pages.", 400);
  const out = await PDFDocument.create();
  const [page] = await out.copyPages(src, [0]);
  out.addPage(page);
  return Buffer.from(await out.save()).toString("base64");
}

export async function explainForm(bytes: Uint8Array, mediaType: string, lang: Language): Promise<Explanation> {
  return streamExplanation(bytes, mediaType, lang, () => {});
}

// Streams the raw JSON text as the model writes it, then returns the
// validated result. `restart` is true when a new text block begins, which
// happens if a fallback model takes over mid-answer: the client must then
// discard what it has so far.
export async function streamExplanation(
  bytes: Uint8Array,
  mediaType: string,
  lang: Language,
  onText: (delta: string, restart: boolean) => void,
  signal?: AbortSignal,
): Promise<Explanation> {
  let fileBlock: Anthropic.Beta.BetaContentBlockParam;
  if (mediaType === "application/pdf") {
    fileBlock = {
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: await firstPageOfPdf(bytes) },
    };
  } else if ((IMAGE_TYPES as readonly string[]).includes(mediaType)) {
    fileBlock = {
      type: "image",
      source: {
        type: "base64",
        media_type: mediaType as ImageType,
        data: Buffer.from(bytes).toString("base64"),
      },
    };
  } else {
    throw new ExplainError("Please upload a JPG, PNG or PDF.", 415);
  }

  client ??= new Anthropic();
  const stream = client.beta.messages.stream(
    {
      model: "claude-opus-5-5",
      max_tokens: 32000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: EXPLANATION_JSON_SCHEMA },
      },
      system: systemPrompt(lang),
      messages: [
        {
          role: "user",
          content: [fileBlock, { type: "text", text: `Explain this form in ${lang.english}.` }],
        },
      ],
    },
    { signal },
  );
  stream.on("text", (delta, snapshot) => onText(delta, snapshot.length === delta.length));
  const message = await stream.finalMessage();

  if (message.stop_reason === "refusal") {
    throw new ExplainError("This page could not be explained. Try a clearer photo of a form.", 422);
  }
  if (message.stop_reason === "max_tokens") {
    throw new ExplainError("This page has too many fields to explain at once.", 422);
  }

  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  const parsed = ExplanationSchema.safeParse(JSON.parse(text));
  if (!parsed.success) {
    throw new ExplainError("The explanation came back incomplete. Please try again.", 502);
  }
  return parsed.data;
}
