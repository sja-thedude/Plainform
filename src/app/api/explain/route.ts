import Anthropic from "@anthropic-ai/sdk";
import { ExplainError, explainForm } from "@/lib/explain";
import { getLanguage } from "@/lib/languages";

export const runtime = "nodejs";
export const maxDuration = 300;

// Vercel rejects request bodies over 4.5 MB.
const MAX_BYTES = 4 * 1024 * 1024;

// Privacy: the uploaded file lives only in memory for the length of this
// request. Nothing is written to disk, stored, or logged.
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const lang = getLanguage(String(form.get("lang") ?? ""));

    if (!(file instanceof File)) return error("No file was uploaded.", 400);
    if (!lang) return error("Unsupported language.", 400);
    if (file.size > MAX_BYTES) return error("That file is too large. Please use one under 4 MB.", 413);

    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await explainForm(bytes, file.type, lang);
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof ExplainError) return error(e.message, e.status);
    if (e instanceof Anthropic.RateLimitError) {
      return error("Too many people are using Plainform right now. Please try again in a minute.", 429);
    }
    if (e instanceof Anthropic.APIError) {
      console.error(`Model API error ${e.status}`);
      return error("The form reader is unavailable right now. Please try again.", 502);
    }
    console.error("Unexpected error", e instanceof Error ? e.name : typeof e);
    return error("Something went wrong. Please try again.", 500);
  }
}

function error(message: string, status: number) {
  return Response.json({ error: message }, { status });
}
