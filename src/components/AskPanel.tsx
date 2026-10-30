"use client";

import { useEffect, useRef, useState } from "react";
import type { Language } from "@/lib/languages";
import type { Explanation } from "@/lib/schema";

type Turn = { q: string; a: string; state: "streaming" | "done" | "error" };

// Follow-up questions about the form. Stateless on the server: the browser
// sends back the explanation and the last few exchanges each time.
export function AskPanel({ form, lang }: { form: Explanation; lang: Language }) {
  const t = lang.ui;
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const busy = turns.at(-1)?.state === "streaming";

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), [turns.length]);

  async function ask(question: string) {
    question = question.trim();
    if (!question || busy) return;
    setDraft("");
    const history = turns.filter((x) => x.state === "done").slice(-4).map(({ q, a }) => ({ q, a }));
    setTurns((prev) => [...prev, { q: question, a: "", state: "streaming" }]);
    const update = (patch: Partial<Turn>) =>
      setTurns((prev) => prev.map((x, i) => (i === prev.length - 1 ? { ...x, ...patch } : x)));

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang: lang.code, question, history, form }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Something went wrong. Please try again.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line) continue;
          const event = JSON.parse(line);
          if (event.type === "text") {
            answer = event.restart ? event.text : answer + event.text;
            update({ a: answer });
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        }
      }
      update({ state: "done" });
    } catch (e) {
      if (ctrl.signal.aborted) return;
      const offline = e instanceof TypeError;
      update({
        state: "error",
        a: offline ? "Couldn't reach Plainform. Check your connection and try again." : (e as Error).message,
      });
    }
  }

  const suggestions = form.key_terms.slice(0, 3).map((k) => `${k.term}?`);

  return (
    <section
      dir={lang.dir}
      lang={lang.code}
      className="rise mt-6 overflow-hidden rounded-2xl border border-line bg-surface shadow-card print:hidden"
    >
      <div className="flex items-center gap-3 border-b border-line bg-accent-soft/50 px-5 py-4">
        <span className="grid size-9 place-items-center rounded-xl bg-accent text-on-accent" aria-hidden>
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 5h16v11H9l-5 4z" />
            <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5M12 14.5v.01" />
          </svg>
        </span>
        <div>
          <h3 className="font-semibold text-ink">{t.askTitle}</h3>
          <p className="text-xs text-ink-3">{t.askNote}</p>
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        {turns.map((turn, i) => (
          <div key={i} className="space-y-2">
            <p className="rise ms-auto w-fit max-w-[85%] rounded-2xl rounded-se-sm bg-accent px-4 py-2 text-on-accent">
              {turn.q}
            </p>
            <div
              className={`rise w-fit max-w-[92%] rounded-2xl rounded-ss-sm border px-4 py-2.5 leading-relaxed ${
                turn.state === "error"
                  ? "border-danger-line/50 bg-danger-bg text-danger-ink"
                  : "border-line bg-surface-2 text-ink"
              }`}
            >
              {turn.a || (
                <span className="flex gap-1 py-2" aria-label="…">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="size-2 animate-bounce rounded-full bg-accent"
                      style={{ animationDelay: `${d * 150}ms` }}
                    />
                  ))}
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />

        {turns.length === 0 && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                dir="auto"
                className="min-h-11 rounded-full border border-line bg-surface px-4 text-sm text-ink-2 transition hover:-translate-y-0.5 hover:border-accent hover:text-accent"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(draft);
          }}
          className="flex gap-2"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t.askPlaceholder}
            aria-label={t.askTitle}
            maxLength={500}
            dir="auto"
            className="min-h-12 min-w-0 flex-1 rounded-xl border border-line bg-bg px-4 text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus-visible:outline-3 focus-visible:outline-accent"
          />
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            className="min-h-12 shrink-0 rounded-xl bg-accent px-5 font-semibold text-on-accent transition hover:bg-accent-hover active:scale-95 disabled:opacity-40"
          >
            {t.ask}
          </button>
        </form>
      </div>
    </section>
  );
}
