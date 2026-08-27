import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { PLANS, PLAN_FEE_CENTS, PLAN_ROWS, PLAN_INCLUDED, PLAN_BILLED, PLAN_TERMS, DELIVERABLE_EQUIVALENTS } from "@/content/pricing";
import { PlanInterest } from "@/components/plan-interest";
import { PlanChooser } from "@/components/plan-chooser";
import { getSiteContent, pick } from "@/lib/site-content";

export const dynamic = "force-dynamic";

/** Split an admin-edited newline list into items, or fall back to the code list. */
const lines = (v: string | undefined, fallback: string[]) =>
  v && v.trim() ? v.split("\n").map((s) => s.trim()).filter(Boolean) : fallback;

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

export default async function PlansPage() {
  const c = await getSiteContent();
  const included = lines(c["plans.included"], PLAN_INCLUDED);
  const billed = lines(c["plans.billed"], PLAN_BILLED);
  const terms = lines(c["plans.terms"], PLAN_TERMS);
  return (
    <>
      <section className="bg-white border-b border-line">
        <div className="shell py-16">
          <SectionHeading
            as="h1"
            kicker="Plans & pricing"
            title={pick(c, "plans.title", "Three plans. Every service line in all of them.")}
            intro={pick(c, "plans.intro", "Your tier sets how much of each you get — not which ones you're allowed to use.")}
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {PLANS.map((pl) => (
              <div key={pl.name} className="flex flex-col gap-3.5 border border-line-warm bg-cream p-8">
                <h2 className="font-fraunces text-[24px] font-medium text-forest">{pl.name}</h2>
                <span className="rule-gold" />
                <p className="font-fraunces text-[32px] leading-none text-charcoal tabular-nums">{pl.price}</p>
                {(() => {
                  const monthly = PLAN_FEE_CENTS[pl.name] / 100;
                  const money = (n: number) => "$" + n.toLocaleString("en-US");
                  return (
                    <p className="text-[12.5px] prose-muted">
                      12-month term · {money(monthly * 12)}/yr billed monthly, or {money(monthly * 11)} paid up front for the year (save one month — {money(monthly)}).
                    </p>
                  );
                })()}
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

          <div className="mt-12 grid gap-10 md:grid-cols-2">
            <div>
              <h3 className="font-fraunces text-[20px] font-medium text-forest">How allotments work</h3>
              <span className="rule-gold mb-4 mt-2" />
              <ul className="flex flex-col gap-2.5 text-[15px] prose-soft">
                <li>Your tier sets the volume for each service line. The figures in the table are per-service maximums — not a promise that every maximum is used in the same month.</li>
                <li>Some work is project-based and scheduled by capacity (websites, publishing, events, training, larger builds), so it&apos;s planned into your month rather than delivered on demand.</li>
                <li>A large production project can span more than one period and may draw on more than one month&apos;s allotment; we scope that with you up front.</li>
                <li>Concurrency has limits — Foundation runs one active project, Momentum up to three, Enterprise at program level.</li>
                <li>Unused allotment doesn&apos;t roll over, and anything beyond your allotment is quoted in writing first.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-fraunces text-[20px] font-medium text-forest">What the turnaround levels mean</h3>
              <span className="rule-gold mb-4 mt-2" />
              <ul className="flex flex-col gap-2.5 text-[15px] prose-soft">
                <li><span className="font-medium text-charcoal">Standard</span> — your work enters the normal production queue.</li>
                <li><span className="font-medium text-charcoal">Priority in queue</span> — scheduled ahead of standard requests where capacity permits.</li>
                <li><span className="font-medium text-charcoal">Priority on everything</span> — first scheduling priority among active clients.</li>
              </ul>
              <p className="mt-3 text-[14px] prose-muted">Turnaround still varies by service — each service page gives the detail, and deadline work can be flagged as rush.</p>
            </div>
          </div>

          <div className="mt-12">
            <h3 className="font-fraunces text-[20px] font-medium text-forest">&ldquo;Deliverable packages&rdquo; by industry</h3>
            <span className="rule-gold mb-4 mt-2" />
            <p className="mb-5 max-w-[52em] text-[15px] prose-soft">
              Every plan includes a monthly allotment of <strong>deliverable packages</strong> — the core, spec-matched documents we produce for you. It isn&apos;t construction-only: each industry draws on the same allotment for its own equivalent. Here&apos;s what one package looks like in yours.
            </p>
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {DELIVERABLE_EQUIVALENTS.map((d) => (
                <div key={d.industry} className="border-t border-line-soft pt-2.5">
                  <p className="text-[15px] font-medium text-charcoal">{d.industry}</p>
                  <p className="text-[14px] prose-muted">{d.example}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 max-w-[42em]">
            <PlanChooser />
          </div>
        </div>
      </section>

      <section className="section-white">
        <div className="shell grid gap-10 py-16 md:grid-cols-3">
          <div>
            <p className="kicker mb-3">Every plan includes</p>
            <ul className="flex flex-col gap-2.5">
              {included.map((x, i) => <li key={i} className="text-[15.5px] prose-soft">{x}</li>)}
            </ul>
          </div>
          <div>
            <p className="kicker mb-3">Billed separately</p>
            <ul className="flex flex-col gap-2.5">
              {billed.map((x, i) => <li key={i} className="text-[15.5px] prose-soft">{x}</li>)}
            </ul>
          </div>
          <div>
            <p className="kicker mb-3">Terms</p>
            <ul className="flex flex-col gap-2.5">
              {terms.map((x, i) => <li key={i} className="text-[15.5px] prose-soft">{x}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="section-cream">
        <div className="shell flex flex-col items-start gap-5 py-14">
          <p className="max-w-[44em] text-[18px] prose-soft">
            Prefer to buy one thing? À la carte rates are published on each service page. Standalone
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
