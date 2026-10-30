"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { at: 0, label: "Reading the page" },
  { at: 8, label: "Finding every field" },
  { at: 22, label: "Writing plain explanations" },
];

// Typical time for a full page; the bar eases towards 95% and waits there.
const EXPECTED_SECS = 45;

export function Loading({ startedAt, languageName }: { startedAt: number; languageName: string }) {
  const [now, setNow] = useState(startedAt);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);
  const secs = Math.max(0, (now - startedAt) / 1000);
  const progress = Math.min(95, 100 * (1 - Math.exp(-secs / (EXPECTED_SECS / 2.5))));
  const current = STEPS.findLastIndex((s) => secs >= s.at);

  return (
    <div role="status" aria-live="polite" className="rise space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-display text-lg font-semibold">Explaining your form in {languageName}</p>
          <p className="shrink-0 text-sm tabular-nums text-ink-3">{Math.round(secs)}s</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <ol className="mt-4 space-y-2">
          {STEPS.map((s, i) => (
            <li
              key={s.label}
              className={`flex items-center gap-3 text-sm transition-colors duration-300 ${
                i <= current ? "text-ink" : "text-ink-3"
              }`}
            >
              <span
                className={`grid size-6 place-items-center rounded-full border text-xs transition-all duration-300 ${
                  i < current
                    ? "border-accent bg-accent text-on-accent"
                    : i === current
                      ? "border-accent text-accent"
                      : "border-line"
                }`}
              >
                {i < current ? "✓" : i + 1}
              </span>
              {s.label}
              {i === current && <span className="size-1.5 animate-pulse rounded-full bg-accent" />}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-ink-3">Usually 20 to 60 seconds. Your form is not saved anywhere.</p>
      </div>

      <div aria-hidden className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-2xl border border-line bg-surface p-4" style={{ opacity: 1 - i * 0.35 }}>
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton mt-3 h-5 w-2/3" />
            <div className="skeleton mt-4 h-3 w-full" />
            <div className="skeleton mt-2 h-3 w-5/6" />
            <div className="skeleton mt-4 h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
