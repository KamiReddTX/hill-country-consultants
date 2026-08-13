import type { Metadata } from "next";
import { SectionHeading } from "@/components/section-heading";
import { InquiryForm } from "@/components/inquiry-form";
import { HOURS, SITE } from "@/content/site";

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

export default function GetStartedPage() {
  return (
    <>
      <section className="bg-white border-b border-line">
        <div className="shell py-16">
          <SectionHeading
            as="h1"
            kicker="Get started"
            title="Start with a free 30-minute strategy session."
            intro="We map the work, recommend a plan tier or a standalone scope, and put it in writing before anything begins. No obligation."
          />
        </div>
      </section>

      <section className="section-cream">
        <div className="shell grid gap-10 py-16 md:grid-cols-[1.4fr_1fr]">
          <InquiryForm />
          <aside className="flex flex-col gap-8">
            <div>
              <p className="kicker mb-2">Talk to us</p>
              <a className="block text-[17px] link-underline" href={`mailto:${SITE.email}`}>{SITE.email}</a>
              <a className="mt-2 block text-[17px] link-underline" href={SITE.phoneHref}>{SITE.phone}</a>
              <p className="mt-3 text-[15px] prose-muted">{SITE.locations}, {SITE.serving}.</p>
            </div>
            <div>
              <p className="kicker mb-3">Hours (Central)</p>
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
