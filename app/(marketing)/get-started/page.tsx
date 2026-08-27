import type { Metadata } from "next";
import { SectionHeading } from "@/components/section-heading";
import { InquiryForm } from "@/components/inquiry-form";
import { HOURS, SITE } from "@/content/site";

const NEXT_STEPS: { t: string; d: string }[] = [
  { t: "We reply the same business day", d: "Send the form and we acknowledge it the same business day. Requests received outside business hours or on a closed day (Wednesday and Sunday) are reviewed the next business day." },
  { t: "A quick call or email first", d: "We'll reach out to confirm what you need and set a time for your free 30-minute strategy session. No pressure, no obligation." },
  { t: "The session is free and virtual", d: "Thirty minutes by video or phone. We map the work, name what hurts most today, and recommend a plan tier or a standalone scope." },
  { t: "Everything in writing before anything begins", d: "You get scope and pricing in writing. Nothing starts — and you pay nothing — until you approve it." },
];

export const metadata: Metadata = {
  title: "Get Started",
  description:
    "Book the free 30-minute strategy session. We map the work, recommend a plan tier or a standalone scope, and put it in writing before anything begins.",
  alternates: { canonical: "/get-started" },
  openGraph: {
    title: "Get Started · Hill Country Consultants",
    description:
      "Book the free 30-minute strategy session. We map the work, recommend a plan tier or a standalone scope, and put it in writing before anything begins.",
    url: "/get-started",
  },
};

export default function GetStartedPage({
  searchParams,
}: {
  searchParams: { service?: string; class?: string };
}) {
  const presetService = searchParams.service ?? "";
  const presetClass = searchParams.class ?? "";
  return (
    <>
      <section className="bg-white border-b border-line">
        <div className="shell py-16">
          <SectionHeading
            as="h1"
            kicker="Get Started"
            title="Start with a free 30-minute strategy session."
            intro="We map the work, recommend a plan tier or a standalone scope, and put it in writing before anything begins. No obligation."
          />
        </div>
      </section>

      <section className="section-white">
        <div className="shell py-14">
          <h2 className="font-fraunces text-[24px] font-medium text-forest">What happens next</h2>
          <span className="rule-gold mb-8 mt-3" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {NEXT_STEPS.map((s, i) => (
              <div key={i} className="flex flex-col gap-2.5 border border-line-warm bg-cream/50 p-6">
                <p className="font-inter text-[13px] tracking-[0.14em] text-ink-faint">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="font-fraunces text-[18px] font-medium text-forest">{s.t}</h3>
                <p className="text-[15px] prose-soft">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-cream">
        <div className="shell grid gap-10 py-16 md:grid-cols-[1.4fr_1fr]">
          <InquiryForm presetService={presetService} presetClass={presetClass} />
          <aside className="flex flex-col gap-8">
            <div>
              <p className="kicker mb-2">Talk to us</p>
              <a className="block text-[17px] link-underline" href={`mailto:${SITE.email}`}>{SITE.email}</a>
              <a className="mt-2 block text-[17px] link-underline" href={SITE.phoneHref}>{SITE.phone}</a>
              <p className="mt-3 text-[15px] prose-muted">{SITE.locations}, {SITE.serving}.</p>
            </div>
            <div>
              <p className="kicker mb-3">Hours (Eastern)</p>
              <ul className="flex flex-col gap-1.5">
                {HOURS.map((h) => (
                  <li key={h.d} className="flex justify-between gap-6 text-[15px] prose-soft">
                    <span>{h.d}</span><span className="prose-muted">{h.h}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
