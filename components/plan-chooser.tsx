"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Lightweight three-question helper that suggests a plan tier. Purely
 * advisory — it points the visitor at a starting tier and toward Get Started,
 * it does not gate or price anything. Scores each answer 0/1/2 and maps the
 * total to Foundation / Momentum / Enterprise.
 */
type Choice = { label: string; score: 0 | 1 | 2 };

const QUESTIONS: { q: string; choices: Choice[] }[] = [
  {
    q: "How many fronts are you running at once?",
    choices: [
      { label: "One main thing", score: 0 },
      { label: "A few in parallel", score: 1 },
      { label: "Many, program-level", score: 2 },
    ],
  },
  {
    q: "How much day-to-day admin coverage do you need?",
    choices: [
      { label: "A couple hours a day", score: 0 },
      { label: "Most of a workday", score: 1 },
      { label: "Full daily coverage", score: 2 },
    ],
  },
  {
    q: "How many active projects at a time?",
    choices: [
      { label: "One", score: 0 },
      { label: "Two or three", score: 1 },
      { label: "More than three", score: 2 },
    ],
  },
];

const RESULT = {
  Foundation: { blurb: "Foundation covers a smaller business or brand with one main focus." },
  Momentum: { blurb: "Momentum fits a mid-size operation running several fronts at once." },
  Enterprise: { blurb: "Enterprise is program-level coverage with full daily support." },
} as const;

export function PlanChooser() {
  const [answers, setAnswers] = useState<(0 | 1 | 2 | null)[]>([null, null, null]);
  const done = answers.every((a) => a !== null);
  const total = answers.reduce<number>((s, a) => s + (a ?? 0), 0);
  const tier: keyof typeof RESULT = total <= 1 ? "Foundation" : total <= 4 ? "Momentum" : "Enterprise";

  return (
    <div className="border border-line-warm bg-white p-6 sm:p-8">
      <p className="kicker mb-2">Not sure which tier?</p>
      <h3 className="font-fraunces text-[22px] font-medium text-forest">Answer three questions</h3>
      <span className="rule-gold mb-6 mt-3" />
      <div className="flex flex-col gap-6">
        {QUESTIONS.map((item, qi) => (
          <div key={qi}>
            <p className="mb-2.5 text-[15.5px] font-medium text-charcoal">{item.q}</p>
            <div className="flex flex-wrap gap-2.5">
              {item.choices.map((c) => {
                const active = answers[qi] === c.score;
                return (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setAnswers((a) => a.map((v, i) => (i === qi ? c.score : v)))}
                    className={`border px-3.5 py-2 text-[14px] transition-colors ${
                      active ? "border-forest bg-forest text-white" : "border-line-warm bg-white text-charcoal hover:border-gold"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {done && (
        <div className="mt-7 border-t border-line-soft pt-5">
          <p className="text-[14px] prose-muted">Based on your answers, a good starting point is</p>
          <p className="mt-1 font-fraunces text-[24px] font-medium text-forest">{tier}</p>
          <p className="mt-1 text-[15px] prose-soft">{RESULT[tier].blurb}</p>
          <p className="mt-2 text-[14px] prose-muted">
            It&apos;s a starting point, not a rule — we confirm the right fit (and can set a custom allotment) in your free strategy session.
          </p>
          <Link href="/get-started" className="btn-gold mt-4 inline-block text-[15px]">Talk it through — free</Link>
        </div>
      )}
    </div>
  );
}
