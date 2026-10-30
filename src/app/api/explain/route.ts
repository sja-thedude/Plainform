import { OpenRouterError } from "@/lib/openrouter";
import { ExplainError, streamExplanation } from "@/lib/explain";
import { getLanguage } from "@/lib/languages";

export const runtime = "nodejs";
export const maxDuration = 300;

// The browser sends a resized JPEG, so 4 MB is plenty.
const MAX_BYTES = 4 * 1024 * 1024;

// Response is newline-delimited JSON events:
//   {"type":"text","text":"...","restart":bool}  partial JSON as it is written
//   {"type":"done","data":{...}}                 the validated explanation
//   {"type":"error","message":"..."}
//
// Privacy: the uploaded file lives only in memory for the length of this
// request. Nothing is written to disk, stored, or logged.
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const lang = getLanguage(String(form?.get("lang") ?? ""));
  if (!(file instanceof File)) return error("No file was uploaded.", 400);
  if (!lang) return error("Unsupported language.", 400);
  if (file.size > MAX_BYTES) return error("That file is too large. Please use one under 4 MB.", 413);
  let bytes = new Uint8Array(await file.arrayBuffer());
  const mediaType = file.type;

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      const send = (event: object) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      try {
        const data = await streamExplanation(
          bytes,
          mediaType,
          lang,
          (text, restart) => send({ type: "text", text, restart }),
          req.signal,
        );
        send({ type: "done", data });
      } catch (e) {
        if (!req.signal.aborted) send({ type: "error", message: errorMessage(e) });
      } finally {
        bytes = new Uint8Array(0);
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

function errorMessage(e: unknown): string {
  if (e instanceof ExplainError) return e.message;
  if (e instanceof OpenRouterError && e.status === 429) {
    return "Too many people are using Plainform right now. Please try again in a minute.";
  }
  if (e instanceof OpenRouterError) {
    console.error(`Model API error ${e.status}`);
    return "The form reader is unavailable right now. Please try again.";
  }
  console.error("Unexpected error", e instanceof Error ? e.name : typeof e);
  return "Something went wrong. Please try again.";
}

function error(message: string, status: number) {
  return Response.json({ error: message }, { status });
}
