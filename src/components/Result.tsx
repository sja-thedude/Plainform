import type { Explanation, Field } from "@/lib/schema";
import type { Language } from "@/lib/languages";

// The display serif only covers Latin script.
const LATIN = new Set(["en", "fr", "es", "tl"]);

export function Result({ data, lang }: { data: Explanation; lang: Language }) {
  const t = lang.ui;
  const sections = groupBySection(data.fields);
  const risky = data.fields.filter((f) => f.rejection_risk).length;
  const unclear = data.fields.filter((f) => !f.legible).length;
  let index = 0;

  return (
    <article dir={lang.dir} lang={lang.code} className="space-y-5 text-start">
      <section className="rise overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="h-1.5 bg-accent" />
        <div className="p-5 sm:p-6">
          <p className="text-sm font-semibold text-accent">{data.is_form ? t.summary : t.notAForm}</p>
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

      <p className="rise flex gap-2 rounded-xl border border-line bg-surface-2 p-3 text-sm leading-relaxed text-ink-2 print:border-0 print:bg-transparent print:p-0">
        <span aria-hidden>ⓘ</span>
        <span>{t.disclaimer}</span>
      </p>

      {data.fields.length > 0 && (
        <section className="space-y-7 pt-1">
          {sections.map(([name, fields], i) => (
            <div key={i}>
              {name && (
                <h3 className="mb-3 flex items-center gap-3 text-sm font-semibold tracking-wide text-ink-3">
                  <span>{name}</span>
                  <span className="h-px flex-1 bg-line" />
                </h3>
              )}
              <ol className="space-y-3">
                {fields.map((f) => (
                  <FieldCard key={index} field={f} lang={lang} order={index++} />
                ))}
              </ol>
            </div>
          ))}
        </section>
      )}
    </article>
  );
}

function FieldCard({ field, lang, order }: { field: Field; lang: Language; order: number }) {
  const t = lang.ui;
  const showTranslated = field.label_translated && field.label_translated !== field.label_original;
  const accentEdge = field.rejection_risk
    ? "border-s-4 border-s-danger-line"
    : !field.legible
      ? "border-s-4 border-s-warn-line"
      : "";

  return (
    <li
      style={{ animationDelay: `${Math.min(order, 12) * 45}ms` }}
      className={`field-card rise rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg sm:p-5 print:hover:translate-y-0 ${accentEdge}`}
    >
      {/* The printed label keeps its own direction: an English label inside
          an Arabic explanation must still read left to right. */}
      <p dir="auto" className="font-mono text-[13px] leading-snug text-ink-3">
        {field.label_original}
      </p>
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

function groupBySection(fields: Field[]): [string, Field[]][] {
  const groups: [string, Field[]][] = [];
  for (const f of fields) {
    const last = groups[groups.length - 1];
    if (last && last[0] === f.section) last[1].push(f);
    else groups.push([f.section, [f]]);
  }
  return groups;
}
