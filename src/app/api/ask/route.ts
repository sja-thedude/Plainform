import { OpenRouterError } from "@/lib/openrouter";
import { AskRefusal, AskRequestSchema, streamAnswer } from "@/lib/ask";
import { getLanguage } from "@/lib/languages";

export const runtime = "nodejs";
export const maxDuration = 120;

// Same newline-delimited events as /api/explain: "text", "done", "error".
// Questions and answers are not stored or logged.
export async function POST(req: Request) {
  const parsed = AskRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "That question couldn't be read." }, { status: 400 });
  const lang = getLanguage(parsed.data.lang);
  if (!lang) return Response.json({ error: "Unsupported language." }, { status: 400 });

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      const send = (event: object) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      try {
        await streamAnswer(parsed.data, lang, (text, restart) => send({ type: "text", text, restart }), req.signal);
        send({ type: "done" });
      } catch (e) {
        if (!req.signal.aborted) send({ type: "error", message: errorMessage(e) });
      } finally {
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
  if (e instanceof OpenRouterError && e.status === 429) return "Too many questions right now. Please try again in a minute.";
  if (e instanceof OpenRouterError) {
    console.error(`Model API error ${e.status}`);
    return "Answers are unavailable right now. Please try again.";
  }
  if (e instanceof AskRefusal) return e.message;
  return "Something went wrong. Please try again.";
}
