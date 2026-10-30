import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { Language } from "./languages";
import { ExplanationSchema } from "./schema";

export const AskRequestSchema = z.object({
  lang: z.string(),
  question: z.string().trim().min(1).max(500),
  history: z
    .array(z.object({ q: z.string().max(500), a: z.string().max(4000) }))
    .max(4),
  form: ExplanationSchema,
});

export type AskRequest = z.infer<typeof AskRequestSchema>;

export class AskRefusal extends Error {}

let client: Anthropic | undefined;

function systemPrompt(lang: Language): string {
  return `You help someone understand an official form they are looking at. You already explained the form; the explanation is given below as JSON. Now answer their follow-up question.

Answer in ${lang.english} (${lang.native}), in plain, short sentences. Two to five sentences is usually enough. No headings, no markdown.

Rules that override everything else:
1. Explain what the form, a field, a word or a process means. You may describe what is generally true for this type of form.
2. Never tell the person what they personally should write, whether they qualify, whether to sign, or whether the terms are fair or a good idea. This is not legal, medical or immigration advice. If they ask for that, say kindly that you cannot advise on it and suggest who can: the office that issued the form, a lawyer, a doctor, a tenant advice service, or an immigration adviser, as fits.
3. If the answer depends on details you do not have, or on part of the form marked as unreadable, say so instead of guessing.
4. If the question is not about this form, say briefly that you can only help with this form.`;
}

export async function streamAnswer(
  req: AskRequest,
  lang: Language,
  onText: (delta: string, restart: boolean) => void,
  signal?: AbortSignal,
): Promise<void> {
  client ??= new Anthropic();
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    {
      role: "user",
      content: `The form, as already explained:\n${JSON.stringify(req.form)}\n\nMy question: ${req.history[0]?.q ?? req.question}`,
    },
  ];
  // Earlier exchanges, then the new question.
  req.history.forEach((h, i) => {
    messages.push({ role: "assistant", content: h.a });
    messages.push({ role: "user", content: req.history[i + 1]?.q ?? req.question });
  });

  const stream = client.beta.messages.stream(
    {
      model: "claude-opus-5-5",
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: { effort: "low" },
      system: systemPrompt(lang),
      messages,
    },
    { signal },
  );
  stream.on("text", (delta, snapshot) => onText(delta, snapshot.length === delta.length));
  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal") {
    throw new AskRefusal("That question couldn't be answered. Try asking it a different way.");
  }
}
