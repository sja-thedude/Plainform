// Hero illustration: a dense form page with one field picked out, and the
// same field explained in several languages. Built from HTML so every
// script renders with its proper font.
const BUBBLES = [
  { lang: "ar", dir: "rtl", text: "تاريخ الميلاد: اليوم ثم الشهر ثم السنة", delay: "0s" },
  { lang: "bn", dir: "ltr", text: "জন্ম তারিখ: দিন, মাস, বছর", delay: "0.15s" },
  { lang: "es", dir: "ltr", text: "Fecha de nacimiento: día, mes, año", delay: "0.3s" },
] as const;

export function HeroArt() {
  return (
    <div aria-hidden className="relative mx-auto h-56 w-full max-w-sm select-none sm:h-64">
      <div className="hero-float absolute left-2 top-2 w-[62%] -rotate-3 rounded-lg border border-line bg-surface p-4 shadow-card sm:p-5">
        <div className="mb-3 h-2.5 w-3/4 rounded bg-ink/80" />
        <div className="mb-4 h-1.5 w-1/2 rounded bg-ink-3/50" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`mb-2 rounded border px-2 py-2 ${
              i === 2 ? "border-accent bg-accent-soft ring-2 ring-accent/30" : "border-line"
            }`}
          >
            <div className={`h-1.5 rounded ${i === 2 ? "w-2/3 bg-accent" : "w-1/2 bg-ink-3/40"}`} />
          </div>
        ))}
      </div>

      <div className="absolute right-0 top-10 z-10 flex w-[58%] flex-col gap-2 sm:top-12">
        {BUBBLES.map((b) => (
          <p
            key={b.lang}
            lang={b.lang}
            dir={b.dir}
            style={{ animationDelay: b.delay }}
            className="rise rounded-xl rounded-ss-sm border border-line bg-surface px-3 py-1.5 text-[13px] leading-snug text-ink shadow-card"
          >
            {b.text}
          </p>
        ))}
      </div>

      <svg
        viewBox="0 0 120 60"
        className="absolute left-[44%] top-[2%] hidden w-16 text-accent sm:block"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M4 40 C 40 4, 80 4, 112 22" strokeDasharray="5 6" className="hero-dash" />
        <path d="M102 12 L 113 22 L 99 27" />
      </svg>
    </div>
  );
}
