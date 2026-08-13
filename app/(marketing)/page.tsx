import type { Metadata } from "next";
import Link from "next/link";
import { ImageSlot } from "@/components/image-slot";
import { PLANS } from "@/content/pricing";
import { HOME_STEPS } from "@/content/site";

export const metadata: Metadata = {
  title: "The capability of a full staff. Without the payroll.",
  description:
    "One flat monthly fee puts a whole firm behind your business — admin, documentation, compliance, coordination, marketing, publishing and more. On-site when it matters, virtual when it counts.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-white border-b border-line">
        <div className="shell grid items-center gap-14 py-20 md:grid-cols-2 md:py-24">
          <div>
            <p className="kicker mb-5">Hybrid consulting &amp; virtual assistance</p>
            <h1 className="font-fraunces text-[clamp(38px,6vw,64px)] font-normal leading-[1.06] text-forest">
              The capability of a full staff. Without the payroll.
            </h1>
            <p className="mt-6 max-w-[34em] prose-soft">
              One flat monthly fee puts a whole firm behind your business. Admin, documentation,
              compliance, coordination, marketing, publishing and more. On-site when it matters,
              virtual when it counts. No salaries, no benefits, no office overhead.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/get-started" className="btn-gold text-[15px]">
                Get Started
              </Link>
              <Link href="/plans" className="link-underline text-[15px]">
                See plans and pricing
              </Link>
            </div>
          </div>
          <ImageSlot label="Modern glass-and-concrete building exterior with reflected greenery" src="/images/hero.jpg" />
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="section-cream">
        <div className="shell py-20">
          <h2 className="font-fraunces text-[clamp(28px,3.6vw,38px)] font-normal leading-tight text-forest">
            How it works
          </h2>
          <span className="rule-gold mb-11 mt-3" />
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-5">
            {HOME_STEPS.map((s) => (
              <div key={s.n} className="border-t border-line-soft pt-4">
                <p className="font-inter text-[13px] tracking-[0.14em] text-ink-faint">{s.n}</p>
                <p className="mt-2.5 text-[16.5px] prose-soft">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Plans teaser ─────────────────────────────────────── */}
      <section className="section-white">
        <div className="shell py-20">
          <h2 className="font-fraunces text-[clamp(28px,3.6vw,38px)] font-normal leading-tight text-forest">
            Three plans. Every service line in all of them.
          </h2>
          <span className="rule-gold mb-5 mt-3" />
          <p className="mb-11 max-w-[46em] prose-muted">
            Your tier sets how much of each you get — not which ones you&apos;re allowed to use.
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            {PLANS.map((pl) => (
              <div key={pl.name} className="flex flex-col gap-3.5 border border-line-warm bg-cream p-8">
                <h3 className="font-fraunces text-[24px] font-medium text-forest">{pl.name}</h3>
                <span className="rule-gold" />
                <p className="font-fraunces text-[32px] leading-none text-charcoal tabular-nums">{pl.price}</p>
                <p className="flex-1 text-[16px] prose-muted">{pl.best}</p>
                <Link href="/plans" className="link-underline self-start text-[14.5px]">
                  What&apos;s included
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The math ─────────────────────────────────────────── */}
      <section className="section-cream">
        <div className="shell grid items-start gap-10 py-16 md:grid-cols-[1fr_2fr]">
          <div>
            <h2 className="font-fraunces text-[clamp(26px,3.4vw,34px)] font-normal leading-tight text-forest">
              The math
            </h2>
            <span className="rule-gold mt-3" />
          </div>
          <p className="text-[20px] prose-soft">
            Hiring in-house gets you one person with one skill set, and you carry the salary,
            benefits, PTO, equipment, software and management that come with them. With us that
            overhead is our cost, not yours — and you get a whole firm for one flat monthly fee.
          </p>
        </div>
      </section>

      {/* ── Closing CTA ──────────────────────────────────────── */}
      <section className="section-white">
        <div className="shell flex flex-col items-start gap-6 py-16">
          <h2 className="font-fraunces text-[clamp(26px,3.4vw,34px)] font-normal leading-tight text-forest">
            Start with a free 30-minute strategy session.
          </h2>
          <p className="max-w-[42em] prose-soft">
            We map the work, recommend a plan tier or a standalone scope, and put it in writing
            before anything begins.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/get-started" className="btn-gold text-[15px]">Get Started</Link>
            <Link href="/services" className="btn-outline text-[15px]">Browse services</Link>
          </div>
        </div>
      </section>
    </>
  );
}
