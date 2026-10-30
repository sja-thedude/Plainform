"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { HeroArt } from "@/components/HeroArt";
import { Loading } from "@/components/Loading";
import { Result } from "@/components/Result";
import { ThemeToggle } from "@/components/ThemeToggle";
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
  const [dragging, setDragging] = useState(false);
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
      const offline = e instanceof TypeError;
      setStatus({
        state: "error",
        message: offline
          ? "Couldn't reach Plainform. Check your internet connection and try again."
          : e instanceof Error
            ? e.message
            : "Something went wrong. Please try again.",
      });
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
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }

  function reset() {
    abortRef.current?.abort();
    setSource(null);
    setStatus({ state: "idle" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 pt-4 sm:px-6 print:hidden">
        <Link href="/" className="flex min-h-11 items-center gap-2 rounded-lg font-display text-xl font-bold text-ink">
          <Logo />
          Plainform
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <section className="grid items-center gap-6 pb-8 pt-8 sm:pt-12 md:grid-cols-[1.1fr_1fr] print:hidden">
          <div className="rise">
            <h1 className="font-display text-[2.6rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl">
              Understand any form <span className="text-accent">before you sign it.</span>
            </h1>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-ink-2">
              Photograph a visa application, hospital form or rental agreement. Plainform explains every field in plain
              words, in your own language.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm text-ink-2 shadow-card">
              <LockIcon />
              <span>
                <strong className="text-ink">Nothing is stored.</strong> No account, no database, no tracking.
              </span>
            </p>
          </div>
          <HeroArt />
        </section>

        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:items-start">
          <div className="space-y-8 md:sticky md:top-6 print:hidden">
            <section aria-labelledby="lang-heading" className="rise" style={{ animationDelay: "80ms" }}>
              <StepHeading n={1} id="lang-heading">
                Explain it in
              </StepHeading>
              <div className="mt-3 grid grid-cols-4 gap-2" role="radiogroup" aria-labelledby="lang-heading">
                {LANGUAGES.map((l) => {
                  const active = l.code === langCode;
                  return (
                    <button
                      key={l.code}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => chooseLanguage(l.code)}
                      className={`flex min-h-14 flex-col items-center justify-center rounded-xl border px-1 py-1.5 transition duration-200 active:scale-95 ${
                        active
                          ? "border-accent bg-accent text-on-accent shadow-card"
                          : "border-line bg-surface text-ink hover:-translate-y-0.5 hover:border-accent"
                      }`}
                    >
                      <span lang={l.code} dir={l.dir} className="text-[15px] font-semibold leading-tight">
                        {l.native}
                      </span>
                      {l.native !== l.english && (
                        <span className={`text-[11px] leading-tight ${active ? "opacity-80" : "text-ink-3"}`}>
                          {l.english}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <section aria-labelledby="form-heading" className="rise" style={{ animationDelay: "160ms" }}>
              <StepHeading n={2} id="form-heading">
                Add your form
              </StepHeading>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  chooseFile(e.dataTransfer.files?.[0]);
                }}
                className={`mt-3 rounded-2xl border-2 border-dashed p-4 transition duration-200 ${
                  dragging ? "scale-[1.01] border-accent bg-accent-soft" : "border-line bg-surface"
                }`}
              >
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-3 text-center font-semibold text-on-accent shadow-card transition hover:bg-accent-hover active:scale-[0.98] has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent">
                    <CameraIcon />
                    Take a photo
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
                  <label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-accent bg-surface px-3 text-center font-semibold text-accent transition hover:bg-accent-soft active:scale-[0.98] has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent">
                    <UploadIcon />
                    Upload file
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
                <p className="mt-3 text-center text-xs text-ink-3">
                  JPG, PNG, HEIC or PDF (first page). You can also drop a file here.
                </p>
              </div>

              <p className="mb-2 mt-6 text-sm font-medium text-ink-2">Or try a sample blank form</p>
              <div className="grid grid-cols-3 gap-2.5">
                {SAMPLES.map((s) => {
                  const active = source?.kind === "sample" && source.sample.id === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => chooseSample(s)}
                      aria-pressed={active}
                      className={`group overflow-hidden rounded-xl border bg-surface text-start shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] ${
                        active ? "border-accent ring-2 ring-accent" : "border-line"
                      }`}
                    >
                      <span className="block overflow-hidden bg-surface-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={s.thumb}
                          alt={`Blank ${s.title.toLowerCase()} form`}
                          width={480}
                          height={360}
                          loading="lazy"
                          className="aspect-[4/3] w-full object-cover object-top transition duration-500 group-hover:scale-105"
                        />
                      </span>
                      <span className="block px-2.5 pb-2.5 pt-2">
                        <span className="block text-sm font-semibold leading-tight text-ink">{s.title}</span>
                        <span className="mt-0.5 block text-xs leading-snug text-ink-3">{s.blurb}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <div ref={resultRef} className="min-w-0 scroll-mt-4" aria-live="polite">
            {status.state === "idle" && <EmptyState />}

            {status.state === "loading" && <Loading startedAt={status.startedAt} languageName={lang.english} />}

            {status.state === "error" && (
              <div role="alert" className="rise rounded-2xl border border-danger-line/50 bg-danger-bg p-5 text-danger-ink">
                <p className="font-display text-lg font-semibold">That didn&apos;t work</p>
                <p className="mt-1 leading-relaxed">{status.message}</p>
                {source && (
                  <button
                    type="button"
                    onClick={() => run(source, langCode)}
                    className="mt-4 min-h-11 rounded-lg bg-danger-ink px-4 font-semibold text-danger-bg transition hover:opacity-90"
                  >
                    Try again
                  </button>
                )}
              </div>
            )}

            {status.state === "done" && (
              <>
                <div className="mb-4 flex items-center justify-between gap-2 print:hidden">
                  {source?.kind === "file" && source.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={source.preview}
                      alt="Your form"
                      className="h-16 w-12 rounded-md border border-line object-cover shadow-card"
                    />
                  ) : (
                    <span className="text-sm text-ink-3">{lang.english}</span>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      lang={lang.code}
                      className="min-h-11 rounded-lg border border-line bg-surface px-4 font-medium text-ink transition hover:border-accent hover:text-accent"
                    >
                      {lang.ui.print}
                    </button>
                    <button
                      type="button"
                      onClick={reset}
                      className="min-h-11 rounded-lg border border-line bg-surface px-4 font-medium text-ink transition hover:border-accent hover:text-accent"
                    >
                      New form
                    </button>
                  </div>
                </div>
                <Result data={status.data} lang={lang} />
                <p className="mt-8 hidden text-xs text-ink-3 print:block">
                  Explained by Plainform. Not legal, medical or immigration advice.
                </p>
              </>
            )}
          </div>
        </div>

        <section className="mt-20 grid gap-4 sm:grid-cols-3 print:hidden">
          {[
            {
              icon: <LockIcon className="size-6" />,
              title: "Nothing is kept",
              body: "Your form is read once to write the explanation, then forgotten. No accounts, no database, no copies.",
            },
            {
              icon: <GlobeIcon />,
              title: "Eight languages",
              body: "English, Arabic, Urdu, Hindi, Bengali, Tagalog, French and Spanish, with right-to-left support.",
            },
            {
              icon: <EyeIcon />,
              title: "Honest when unsure",
              body: "If part of the page is blurred or cut off, Plainform says so instead of guessing.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <div className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent">{f.icon}</div>
              <p className="mt-3 font-display text-lg font-semibold text-ink">{f.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-2">{f.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-line print:hidden">
        <p className="mx-auto max-w-5xl px-4 py-6 text-xs leading-relaxed text-ink-3 sm:px-6">
          Plainform explains what each field on a form is asking for. It is not legal, medical or immigration advice and
          does not tell you what to write or whether to sign. Sample forms are blank templates made for this demo, with
          fictional issuers.
        </p>
      </footer>
    </div>
  );
}

function StepHeading({ n, id, children }: { n: number; id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="flex items-center gap-2.5 font-display text-xl font-semibold text-ink">
      <span className="grid size-7 place-items-center rounded-full bg-accent-soft font-sans text-sm font-bold text-accent">
        {n}
      </span>
      {children}
    </h2>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-accent" />
      <path d="M10 8h9l4 4v12H10z" className="fill-on-accent" opacity=".95" />
      <path d="M13 15h7M13 19h5" className="stroke-accent" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon({ className = "size-4 text-accent" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
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
