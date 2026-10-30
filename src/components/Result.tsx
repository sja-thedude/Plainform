import type { Explanation, Field } from "@/lib/schema";
import type { Language } from "@/lib/languages";

export function Result({ data, lang }: { data: Explanation; lang: Language }) {
  const t = lang.ui;
  const sections = groupBySection(data.fields);

  return (
    <article dir={lang.dir} lang={lang.code} className="space-y-5 text-start">
      <section className="rounded-2xl border border-teal-200 bg-white p-5 shadow-sm print:border-stone-400 print:shadow-none">
        <p className="text-sm font-semibold text-brand">{data.is_form ? t.summary : t.notAForm}</p>
        <h2 className="mt-1 text-xl font-bold leading-snug">{data.form_title}</h2>
        <p className="mt-3 text-base leading-relaxed text-stone-700">{data.summary}</p>
      </section>

      {data.image_note && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
          <p className="text-sm font-semibold">{t.imageNote}</p>
          <p className="mt-1">{data.image_note}</p>
        </section>
      )}

      <p className="rounded-xl bg-stone-200/70 p-3 text-sm leading-relaxed text-stone-700 print:bg-transparent print:p-0">
        {t.disclaimer}
      </p>

      {data.fields.length > 0 && (
        <section>
          <h3 className="mb-3 text-lg font-bold">
            {t.fields} <span className="font-normal text-stone-500">({data.fields.length})</span>
          </h3>
          <div className="space-y-6">
            {sections.map(([name, fields], i) => (
              <div key={i}>
                {name && (
                  <h4 className="mb-2 border-b border-stone-300 pb-1 text-sm font-semibold uppercase tracking-wide text-stone-500">
                    {name}
                  </h4>
                )}
                <ol className="space-y-3">
                  {fields.map((f, j) => (
                    <FieldCard key={j} field={f} lang={lang} />
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function FieldCard({ field, lang }: { field: Field; lang: Language }) {
  const t = lang.ui;
  const showTranslated = field.label_translated && field.label_translated !== field.label_original;

  return (
    <li
      className={`field-card rounded-2xl border bg-white p-4 shadow-sm print:shadow-none ${
        field.legible ? "border-stone-200" : "border-amber-400"
      } ${field.rejection_risk ? "border-s-4 border-s-red-600" : ""}`}
    >
      {/* The printed label keeps its own direction: an English label inside
          an Arabic explanation must still read left to right. */}
      <p dir="auto" className="font-mono text-sm text-stone-500">
        {field.label_original}
      </p>
      {showTranslated && <p className="mt-0.5 text-lg font-semibold leading-snug">{field.label_translated}</p>}

      {!field.legible && (
        <p className="mt-2 rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-950">⚠ {t.unclear}</p>
      )}

      <dl className="mt-3 space-y-3">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-brand">{t.asks}</dt>
          <dd className="mt-0.5 leading-relaxed">{field.meaning}</dd>
        </div>
        {field.example && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-brand">{t.example}</dt>
            <dd dir="auto" className="mt-1 rounded-lg bg-stone-100 px-3 py-2 leading-relaxed">
              {field.example}
            </dd>
          </div>
        )}
        {field.rejection_risk && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-red-900">
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
