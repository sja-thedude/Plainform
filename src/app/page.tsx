"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Result } from "@/components/Result";
import { LANGUAGES, getLanguage, type LangCode } from "@/lib/languages";
import { SAMPLES, cachedResultUrl, type Sample } from "@/lib/samples";
import type { Explanation } from "@/lib/schema";

type Source = { kind: "sample"; sample: Sample } | { kind: "file"; file: Blob; name: string; preview: string | null };

type Status =
  | { state: "idle" }
  | { state: "loading"; startedAt: number }
  | { state: "done"; data: Explanation }
  | { state: "error"; message: string };

const MAX_SIDE = 2400;
const MAX_BYTES = 4 * 1024 * 1024;

export default function Home() {
  const [langCode, setLangCode] = useState<LangCode>("en");
  const [source, setSource] = useState<Source | null>(null);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const lang = getLanguage(langCode)!;

  useEffect(() => {
    const match = navigator.languages
      .map((l) => l.slice(0, 2).toLowerCase())
      .find((l) => getLanguage(l) || l === "fil");
    if (match) setLangCode(match === "fil" ? "tl" : (match as LangCode));
  }, []);

  const run = useCallback(async (src: Source, code: LangCode) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setStatus({ state: "loading", startedAt: Date.now() });
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));

    try {
      let blob: Blob;
      let name: string;
      if (src.kind === "sample") {
        const cached = await fetch(cachedResultUrl(src.sample.id, code), { signal: ctrl.signal });
        if (cached.ok) {
          setStatus({ state: "done", data: await cached.json() });
          return;
        }
        blob = await (await fetch(src.sample.image, { signal: ctrl.signal })).blob();
        name = `${src.sample.id}.png`;
      } else {
        blob = src.file;
        name = src.name;
      }

      const body = new FormData();
      body.append("file", blob, name);
      body.append("lang", code);
      const res = await fetch("/api/explain", { method: "POST", body, signal: ctrl.signal });
      const json = await res.json().catch(() => ({ error: "Something went wrong. Please try again." }));
      if (!res.ok) throw new Error(json.error);
      setStatus({ state: "done", data: json });
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setStatus({ state: "error", message: e instanceof Error ? e.message : "Something went wrong." });
    }
  }, []);

  function chooseLanguage(code: LangCode) {
    setLangCode(code);
    if (source) run(source, code);
  }

  function chooseSample(sample: Sample) {
    const src: Source = { kind: "sample", sample };
    setSource(src);
    run(src, langCode);
  }

  async function chooseFile(file: File | undefined) {
    if (!file) return;
    try {
      const prepared = await prepareFile(file);
      if (source?.kind === "file" && source.preview) URL.revokeObjectURL(source.preview);
      const src: Source = { kind: "file", ...prepared };
      setSource(src);
      run(src, langCode);
    } catch (e) {
      setSource(null);
      setStatus({ state: "error", message: e instanceof Error ? e.message : "Could not open that file." });
    }
  }

  function reset() {
    abortRef.current?.abort();
    setSource(null);
    setStatus({ state: "idle" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:pt-10">
      <header className="print:hidden">
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-dark">Plainform</h1>
        <p className="mt-1 text-lg text-stone-700">Any official form, explained in plain words, in your language.</p>
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-teal-200 bg-brand-soft/60 p-3 text-sm text-teal-950">
          <span aria-hidden>🔒</span>
          <span>
            <strong>Nothing is stored.</strong> Your form is read once to write the explanation, then forgotten. No
            account, no database, no copies kept, no tracking.
          </span>
        </p>
      </header>

      <section className="mt-6 print:hidden" aria-labelledby="lang-heading">
        <h2 id="lang-heading" className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          1. Explain it in
        </h2>
        <div className="mt-2 grid grid-cols-4 gap-2" role="radiogroup" aria-labelledby="lang-heading">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="radio"
              aria-checked={l.code === langCode}
              lang={l.code}
              dir={l.dir}
              title={l.english}
              onClick={() => chooseLanguage(l.code)}
              className={`min-h-12 rounded-xl border px-2 py-2 text-base leading-tight transition ${
                l.code === langCode
                  ? "border-brand bg-brand font-semibold text-white"
                  : "border-stone-300 bg-white hover:border-brand"
              }`}
            >
              {l.native}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 print:hidden" aria-labelledby="form-heading">
        <h2 id="form-heading" className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          2. Choose a form
        </h2>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand px-3 py-3 text-center font-semibold text-white shadow-sm hover:bg-brand-dark">
            <span aria-hidden>📷</span> Take a photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                chooseFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          <label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-brand bg-white px-3 py-3 text-center font-semibold text-brand-dark hover:bg-brand-soft/40">
            <span aria-hidden>📄</span> Upload image or PDF
            <input
              type="file"
              accept="image/*,.heic,.heif,application/pdf"
              className="sr-only"
              onChange={(e) => {
                chooseFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        <p className="mt-5 text-sm text-stone-600">Or try a sample blank form:</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {SAMPLES.map((s) => {
            const active = source?.kind === "sample" && source.sample.id === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => chooseSample(s)}
                className={`group overflow-hidden rounded-xl border bg-white text-start shadow-sm transition hover:border-brand ${
                  active ? "border-brand ring-2 ring-brand" : "border-stone-300"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image} alt="" className="aspect-[4/3] w-full object-cover object-top" />
                <span className="block px-2 pb-2 pt-1.5">
                  <span className="block text-sm font-semibold leading-tight">{s.title}</span>
                  <span className="block text-xs text-stone-500">{s.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div ref={resultRef} className="scroll-mt-4 pt-8">
        {status.state === "loading" && <Loading startedAt={status.startedAt} />}

        {status.state === "error" && (
          <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-900">
            {status.message}
          </div>
        )}

        {status.state === "done" && (
          <>
            <div className="mb-4 flex items-center justify-between gap-2 print:hidden">
              {source?.kind === "file" && source.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={source.preview} alt="Your form" className="h-16 w-12 rounded border object-cover" />
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  lang={lang.code}
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 font-medium hover:border-brand"
                >
                  {lang.ui.print}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 font-medium hover:border-brand"
                >
                  New form
                </button>
              </div>
            </div>
            <Result data={status.data} lang={lang} />
            <p className="mt-8 hidden text-xs text-stone-500 print:block">
              Explained by Plainform. Not legal, medical or immigration advice.
            </p>
          </>
        )}
      </div>

      <footer className="mt-16 border-t border-stone-300 pt-4 text-xs leading-relaxed text-stone-500 print:hidden">
        Plainform explains what each field on a form is asking for. It is not legal, medical or immigration advice and
        does not tell you what to write or whether to sign. If any part of your form could not be read clearly, it says
        so instead of guessing. Sample forms are blank templates made for this demo.
      </footer>
    </main>
  );
}

function Loading({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(startedAt);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const secs = Math.max(0, Math.round((now - startedAt) / 1000));
  const step =
    secs < 8 ? "Reading the form…" : secs < 25 ? "Finding every field…" : "Writing plain explanations…";

  return (
    <div role="status" className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <span className="size-5 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-hidden />
      <div>
        <p className="font-semibold">{step}</p>
        <p className="text-sm text-stone-500">Usually 20–60 seconds. {secs}s</p>
      </div>
    </div>
  );
}

// Images are resized and re-encoded as JPEG in the browser. This keeps
// uploads small and turns HEIC photos into something the server accepts
// (on browsers that can decode HEIC, such as Safari).
async function prepareFile(file: File): Promise<{ file: Blob; name: string; preview: string | null }> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (isPdf) {
    if (file.size > MAX_BYTES) throw new Error("That PDF is too large. Please use one under 4 MB, or a photo of the page.");
    return { file: new Blob([file], { type: "application/pdf" }), name: file.name, preview: null };
  }

  const url = URL.createObjectURL(file);
  const img = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = url;
    });
  } catch {
    URL.revokeObjectURL(url);
    const heic = /\.(heic|heif)$/i.test(file.name) || /hei[cf]/.test(file.type);
    throw new Error(
      heic
        ? "This browser can't open HEIC photos. Use \"Take a photo\" instead, or save the picture as JPG first."
        : "That file couldn't be opened as an image. Please use a JPG, PNG or PDF.",
    );
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
  if (!blob) throw new Error("That image couldn't be processed. Please try another.");
  return { file: blob, name: "form.jpg", preview: url };
}
