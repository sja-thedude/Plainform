"use client";

import { useState } from "react";
import type { Explanation, Field } from "@/lib/schema";
import type { Language } from "@/lib/languages";
import { useSpeech } from "@/lib/useSpeech";

type Speech = ReturnType<typeof useSpeech>;

// The display serif only covers Latin script.
const LATIN = new Set(["en", "fr", "es", "tl"]);

export function Result({ data, lang, streaming = false }: { data: Explanation; lang: Language; streaming?: boolean }) {
  const t = lang.ui;
  const [onlyRisky, setOnlyRisky] = useState(false);
  const speech = useSpeech(lang.code);
  const risky = data.fields.filter((f) => f.rejection_risk).length;
  const unclear = data.fields.filter((f) => !f.legible).length;
  const shown = onlyRisky ? data.fields.filter((f) => f.rejection_risk) : data.fields;
  const sections = groupBySection(shown);
  let index = 0;

  return (
    <article dir={lang.dir} lang={lang.code} className="space-y-5 text-start">
      <section className="rise overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="h-1.5 bg-accent" />
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-accent">{data.is_form ? t.summary : t.notAForm}</p>
            <SpeakButton
              id="summary"
              text={`${data.form_title}. ${data.summary}`}
              speech={speech}
              lang={lang}
              withLabel
            />
          </div>
          <h2 className={`mt-1 text-2xl font-bold leading-snug text-ink ${LATIN.has(lang.code) ? "font-display" : ""}`}>
            {data.form_title}
          </h2>
          <p className="mt-3 text-[17px] leading-relaxed text-ink-2">{data.summary}</p>
          {data.fields.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-surface-2 px-3 py-1 text-ink-2">
                {t.fields}: <strong className="text-ink">{data.fields.length}</strong>
              </span>
              {risky > 0 && (
                <span className="rounded-full bg-danger-bg px-3 py-1 text-danger-ink">
                  ⚑ {t.risk}: <strong>{risky}</strong>
                </span>
              )}
              {unclear > 0 && (
                <span className="rounded-full bg-warn-bg px-3 py-1 text-warn-ink">
                  ⚠ <strong>{unclear}</strong>
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {data.image_note && (
        <section className="rise rounded-2xl border border-warn-line bg-warn-bg p-4 text-warn-ink">
          <p className="text-sm font-semibold">⚠ {t.imageNote}</p>
          <p className="mt-1">{data.image_note}</p>
        </section>
      )}

      {data.documents_needed.length > 0 && (
        <section className="rise rounded-2xl border border-line bg-surface p-5 shadow-card">
          <h3 className="flex items-center gap-2 font-semibold text-ink">
            <span className="grid size-8 place-items-center rounded-lg bg-accent-soft text-accent" aria-hidden>
              <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 4h6l1 2h3a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3z" />
                <path d="m9 13 2 2 4-4" />
              </svg>
            </span>
            {t.documents}
          </h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {data.documents_needed.map((d, i) => (
              <li key={i} className="flex items-start gap-2 rounded-lg bg-surface-2 px-3 py-2 text-ink">
                <span className="mt-0.5 text-accent" aria-hidden>
                  ✓
                </span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="rise flex gap-2 rounded-xl border border-line bg-surface-2 p-3 text-sm leading-relaxed text-ink-2 print:border-0 print:bg-transparent print:p-0">
        <span aria-hidden>ⓘ</span>
        <span>{t.disclaimer}</span>
      </p>

      {risky > 0 && (
        <button
          type="button"
          aria-pressed={onlyRisky}
          onClick={() => setOnlyRisky((v) => !v)}
          className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-4 py-2 text-start text-sm font-medium transition print:hidden ${
            onlyRisky ? "border-danger-line bg-danger-bg text-danger-ink" : "border-line bg-surface text-ink-2 hover:border-danger-line"
          }`}
        >
          <span
            aria-hidden
            className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${onlyRisky ? "bg-danger-line" : "bg-line"}`}
          >
            <span
              className={`absolute top-1 size-4 rounded-full bg-surface shadow transition-all ${
                onlyRisky ? "start-5" : "start-1"
              }`}
            />
          </span>
          {onlyRisky ? t.showAll : t.onlyRisky}
        </button>
      )}

      {shown.length > 0 && (
        <section className="space-y-7 pt-1">
          {sections.map(([name, fields], i) => (
            <div key={`${onlyRisky}-${i}`}>
              {name && (
                <h3 className="mb-3 flex items-center gap-3 text-sm font-semibold tracking-wide text-ink-3">
                  <span>{name}</span>
                  <span className="h-px flex-1 bg-line" />
                </h3>
              )}
              <ol className="space-y-3">
                {fields.map((f) => (
                  <FieldCard key={index} field={f} lang={lang} order={index++} speech={speech} />
                ))}
              </ol>
            </div>
          ))}
        </section>
      )}

      {streaming && (
        <div role="status" className="flex items-center gap-3 rounded-2xl border border-dashed border-line px-4 py-3 text-ink-3">
          <span className="flex gap-1" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-2 animate-bounce rounded-full bg-accent"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </span>
          {t.writing}
        </div>
      )}

      {data.key_terms.length > 0 && (
        <section className="rise rounded-2xl border border-line bg-surface p-5 shadow-card">
          <h3 className="flex items-center gap-2 font-semibold text-ink">
            <span className="grid size-8 place-items-center rounded-lg bg-accent-soft text-accent" aria-hidden>
              <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
                <path d="M4 19V5M9 8h6M9 12h4" />
              </svg>
            </span>
            {t.terms}
          </h3>
          <dl className="mt-3 divide-y divide-line">
            {data.key_terms.map((k, i) => (
              <div key={i} className="py-3 first:pt-1 last:pb-0">
                <dt dir="auto" className="font-semibold text-ink">
                  {k.term}
                </dt>
                <dd className="mt-0.5 leading-relaxed text-ink-2">{k.meaning}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </article>
  );
}

function FieldCard({ field, lang, order, speech }: { field: Field; lang: Language; order: number; speech: Speech }) {
  const t = lang.ui;
  const id = `field-${order}`;
  const spoken = [
    field.label_translated || field.label_original,
    field.meaning,
    field.example && `${t.example}: ${field.example}`,
    field.rejection_risk && `${t.risk}. ${field.rejection_reason}`,
  ]
    .filter(Boolean)
    .join(". ");
  const showTranslated = field.label_translated && field.label_translated !== field.label_original;
  const accentEdge = field.rejection_risk
    ? "border-s-4 border-s-danger-line"
    : !field.legible
      ? "border-s-4 border-s-warn-line"
      : "";

  return (
    <li
      style={{ animationDelay: `${Math.min(order, 12) * 45}ms` }}
      className={`field-card rise rounded-2xl border bg-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg sm:p-5 print:hover:translate-y-0 ${accentEdge} ${
        speech.speakingId === id ? "border-accent ring-2 ring-accent/40" : "border-line"
      }`}
    >
      {/* The printed label keeps its own direction: an English label inside
          an Arabic explanation must still read left to right. */}
      <div className="flex items-start justify-between gap-3">
        <p dir="auto" className="min-w-0 font-mono text-[13px] leading-snug text-ink-3">
          {field.label_original}
        </p>
        <SpeakButton id={id} text={spoken} speech={speech} lang={lang} />
      </div>
      {showTranslated && <p className="mt-1 text-lg font-semibold leading-snug text-ink">{field.label_translated}</p>}

      {!field.legible && (
        <p className="mt-3 rounded-lg border border-warn-line bg-warn-bg px-3 py-2 text-sm font-semibold text-warn-ink">
          ⚠ {t.unclear}
        </p>
      )}

      <dl className="mt-3 space-y-3">
        <div>
          <dt className="text-xs font-bold tracking-wide text-accent">{t.asks}</dt>
          <dd className="mt-0.5 leading-relaxed text-ink">{field.meaning}</dd>
        </div>
        {field.example && (
          <div>
            <dt className="text-xs font-bold tracking-wide text-accent">{t.example}</dt>
            <dd dir="auto" className="mt-1 rounded-lg border border-line bg-surface-2 px-3 py-2 leading-relaxed text-ink">
              {field.example}
            </dd>
          </div>
        )}
        {field.rejection_risk && (
          <div className="rounded-lg border border-danger-line/40 bg-danger-bg px-3 py-2 text-danger-ink">
            <dt className="text-sm font-bold">⚑ {t.risk}</dt>
            {field.rejection_reason && <dd className="mt-0.5 text-sm leading-relaxed">{field.rejection_reason}</dd>}
          </div>
        )}
      </dl>
    </li>
  );
}

function SpeakButton({
  id,
  text,
  speech,
  lang,
  withLabel = false,
}: {
  id: string;
  text: string;
  speech: Speech;
  lang: Language;
  withLabel?: boolean;
}) {
  if (!speech.supported) return null;
  const active = speech.speakingId === id;
  const label = active ? lang.ui.stop : lang.ui.listen;
  return (
    <button
      type="button"
      onClick={() => (active ? speech.stop() : speech.speak(id, text))}
      aria-label={label}
      aria-pressed={active}
      className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition active:scale-95 print:hidden ${
        withLabel ? "" : "min-w-11 justify-center px-0"
      } ${active ? "border-accent bg-accent text-on-accent" : "border-line bg-surface text-accent hover:border-accent"}`}
    >
      {active ? (
        <span className="flex h-4 items-end gap-0.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1 animate-pulse rounded-full bg-current"
              style={{ height: `${[60, 100, 75][i]}%`, animationDelay: `${i * 120}ms` }}
            />
          ))}
        </span>
      ) : (
        <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M11 5 6 9H3v6h3l5 4z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
        </svg>
      )}
      {withLabel && <span>{label}</span>}
    </button>
  );
}

function groupBySection(fields: Field[]): [string, Field[]][] {
  const groups: [string, Field[]][] = [];
  for (const f of fields) {
    const last = groups[groups.length - 1];
    if (last && last[0] === f.section) last[1].push(f);
    else groups.push([f.section, [f]]);
  }
  return groups;
}
