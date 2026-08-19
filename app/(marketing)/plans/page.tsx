import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { PLANS, PLAN_ROWS, PLAN_INCLUDED, PLAN_BILLED, PLAN_TERMS } from "@/content/pricing";
import { PlanInterest } from "@/components/plan-interest";
import { PlanChooser } from "@/components/plan-chooser";

export const metadata: Metadata = {
  title: "Plans & Pricing",
  description:
    "Foundation $1,500/mo, Momentum $4,250/mo, Enterprise $7,000/mo. Every service line is in all three — your tier sets the volume, not which ones you can use.",
  alternates: { canonical: "/plans" },
  openGraph: {
    title: "Plans & Pricing · Hill Country Consultants",
    description:
      "Foundation $1,500/mo, Momentum $4,250/mo, Enterprise $7,000/mo. Every service line is in all three — your tier sets the volume, not which ones you can use.",
    url: "/plans",
  },
};

export default function PlansPage() {
  return (
    <>
      <section className="bg-white border-b border-line">
        <div className="shell py-16">
          <SectionHeading
            as="h1"
            kicker="Plans & pricing"
            title="Three plans. Every service line in all of them."
            intro="Your tier sets how much of each you get — not which ones you're allowed to use."
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {PLANS.map((pl) => (
              <div key={pl.name} className="flex flex-col gap-3.5 border border-line-warm bg-cream p-8">
                <h2 className="font-fraunces text-[24px] font-medium text-forest">{pl.name}</h2>
                <span className="rule-gold" />
                <p className="font-fraunces text-[32px] leading-none text-charcoal tabular-nums">{pl.price}</p>
                <p className="flex-1 text-[16px] prose-muted">{pl.best}</p>
                <PlanInterest plan={pl.name} />
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-[52em] text-[15.5px] prose-muted">
            Between tiers? We can set a custom allotment — just ask in your free strategy session.
          </p>
        </div>
      </section>

      <section className="section-cream">
        <div className="shell py-16">
          <h2 className="mb-6 font-fraunces text-[26px] font-medium text-forest">What each tier includes</h2>
          <div className="overflow-x-auto border border-line-warm">
            <table className="w-full min-w-[720px] border-collapse bg-white text-left">
              <thead>
                <tr className="bg-forest text-white">
                  <th className="p-4 font-inter text-[13px] font-semibold uppercase tracking-wide">&nbsp;</th>
                  {PLANS.map((p) => (
                    <th key={p.name} className="p-4 font-fraunces text-[18px] font-medium">
                      {p.name}
                      <span className="block font-inter text-[13px] font-normal text-gold-onForest">{p.price}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PLAN_ROWS.map((row, i) => (
                  <tr key={row.label} className={i % 2 ? "bg-cream/40" : "bg-white"}>
                    <th scope="row" className="p-4 align-top font-inter text-[14px] font-semibold text-forest">{row.label}</th>
                    <td className="p-4 align-top text-[14.5px] prose-soft">{row.f}</td>
                    <td className="p-4 align-top text-[14.5px] prose-soft">{row.m}</td>
                    <td className="p-4 align-top text-[14.5px] prose-soft">{row.e}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[13.5px] prose-muted">
            Allotments reset monthly unless a cell notes otherwise — <span className="font-medium text-charcoal">/qtr</span> = per quarter, <span className="font-medium text-charcoal">per term</span> = once per contract term. Unused allotment does not roll over.
          </p>
          <div className="mt-10 max-w-[42em]">
            <PlanChooser />
          </div>
        </div>
      </section>

      <section className="section-white">
        <div className="shell grid gap-10 py-16 md:grid-cols-3">
          <div>
            <p className="kicker mb-3">Every plan includes</p>
            <ul className="flex flex-col gap-2.5">
              {PLAN_INCLUDED.map((x, i) => <li key={i} className="text-[15.5px] prose-soft">{x}</li>)}
            </ul>
          </div>
          <div>
            <p className="kicker mb-3">Billed separately</p>
            <ul className="flex flex-col gap-2.5">
              {PLAN_BILLED.map((x, i) => <li key={i} className="text-[15.5px] prose-soft">{x}</li>)}
            </ul>
          </div>
          <div>
            <p className="kicker mb-3">Terms</p>
            <ul className="flex flex-col gap-2.5">
              {PLAN_TERMS.map((x, i) => <li key={i} className="text-[15.5px] prose-soft">{x}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="section-cream">
        <div className="shell flex flex-col items-start gap-5 py-14">
          <p className="max-w-[44em] text-[18px] prose-soft">
            Prefer to buy one thing? À-la-carte rates are published on each service page. Standalone
            projects are paid in full at booking, or as set out in your written quote.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/book" className="btn-gold">Book &amp; Pay</Link>
            <Link href="/services" className="btn-outline">Browse services</Link>
          </div>
        </div>
      </section>
    </>
  );
}
