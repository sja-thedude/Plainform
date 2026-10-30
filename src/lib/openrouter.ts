// Minimal OpenRouter client: OpenAI-style chat completions, streamed as
// server-sent events. Plain fetch, so it runs the same in Node and Workers.

const BASE_URL = "https://openrouter.ai/api/v1";
const SITE_URL = "https://plainform.sja-affu765.workers.dev";

export const PRIMARY_MODEL = () => process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash-lite";
export const FALLBACK_MODEL = () => process.env.OPENROUTER_FALLBACK_MODEL || "google/gemma-4-26b-a4b-it";

export type ChatContent = string | ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } })[];
export type ChatMessage = { role: "system" | "user" | "assistant"; content: ChatContent };

export type ChatRequest = {
  messages: ChatMessage[];
  max_tokens: number;
  temperature?: number;
  response_format?: { type: "json_schema"; json_schema: { name: string; strict: boolean; schema: object } };
};

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

// Streams the reply and returns the full text and finish reason. OpenRouter
// switches to the fallback model by itself if the primary fails before
// answering. If the primary fails part way through, runs out of tokens, or
// gets stuck emitting whitespace (small models sometimes do under a JSON
// schema), the request is retried on the fallback and `restart` tells the
// caller to discard what it has.
export async function streamChat(
  req: ChatRequest,
  onText: (delta: string, restart: boolean) => void,
  signal?: AbortSignal,
): Promise<{ text: string; finishReason: string | null }> {
  try {
    const first = await attempt({ ...req, models: [PRIMARY_MODEL(), FALLBACK_MODEL()] }, onText, false, signal);
    if (first.finishReason !== "length") return first;
  } catch (e) {
    if (signal?.aborted || !(e instanceof MidStreamError)) throw e;
  }
  return attempt({ ...req, model: FALLBACK_MODEL() }, onText, true, signal);
}

class MidStreamError extends Error {}

const RUNAWAY = /\s{200}$/;

async function attempt(
  body: ChatRequest & { model?: string; models?: string[] },
  onText: (delta: string, restart: boolean) => void,
  restart: boolean,
  signal?: AbortSignal,
): Promise<{ text: string; finishReason: string | null }> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new OpenRouterError("OPENROUTER_API_KEY is not set", 500);

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": SITE_URL,
      "X-Title": "Plainform",
    },
    // Only route to providers that honour the JSON schema.
    body: JSON.stringify({ ...body, stream: true, provider: { require_parameters: true } }),
    signal,
  });
  if (!res.ok || !res.body) throw new OpenRouterError(`OpenRouter returned ${res.status}`, res.status);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let finishReason: string | null = null;
  for (;;) {
    let chunkRead: ReadableStreamReadResult<Uint8Array>;
    try {
      chunkRead = await reader.read();
    } catch (e) {
      if (text && !signal?.aborted) throw new MidStreamError("connection dropped");
      throw e;
    }
    const { value, done } = chunkRead;
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      // Lines starting with ":" are keep-alive comments.
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return { text, finishReason };
      const chunk = JSON.parse(data);
      if (chunk.error) {
        if (text) throw new MidStreamError(chunk.error.message);
        throw new OpenRouterError(`OpenRouter error ${chunk.error.code ?? ""}`, Number(chunk.error.code) || 502);
      }
      const choice = chunk.choices?.[0];
      const delta: string | undefined = choice?.delta?.content;
      if (delta) {
        onText(delta, restart && !text);
        text += delta;
        if (RUNAWAY.test(text)) {
          await reader.cancel();
          if (restart) throw new OpenRouterError("Model output degenerated", 502);
          throw new MidStreamError("runaway whitespace");
        }
      }
      if (choice?.finish_reason) finishReason = choice.finish_reason;
      if (finishReason === "error") throw text ? new MidStreamError("stream error") : new OpenRouterError("Model error", 502);
    }
  }
  return { text, finishReason };
}
