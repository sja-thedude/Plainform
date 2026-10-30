export function EmptyState() {
  return (
    <div className="rise flex flex-col items-center rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-10 text-center">
      <svg viewBox="0 0 96 96" className="size-24 text-accent" fill="none" aria-hidden>
        <rect x="18" y="10" width="50" height="66" rx="6" className="fill-surface" stroke="currentColor" strokeWidth="2.5" />
        <path d="M28 26h30M28 36h22M28 46h26M28 56h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity=".45" />
        <circle cx="64" cy="62" r="16" className="fill-accent-soft" stroke="currentColor" strokeWidth="2.5" />
        <path d="m75.5 73.5 10 10" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M58 62h12M64 56v12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <p className="mt-4 font-display text-xl font-semibold text-ink">Your explanation will appear here</p>
      <p className="mt-1 max-w-xs text-ink-2">
        Take a photo of a form, upload one, or try one of the sample forms to see how it works.
      </p>
    </div>
  );
}
