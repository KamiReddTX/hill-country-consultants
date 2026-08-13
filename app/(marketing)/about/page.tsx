import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { PILLARS, STANDARDS } from "@/content/about-faq";
import { SITE, TRUST_POINTS } from "@/content/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Hybrid consulting and virtual assistance — one firm behind your business, on-site when it matters and virtual when it counts. The four pillars behind the work.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About · Hill Country Consultants",
    description:
      "Hybrid consulting and virtual assistance — one firm behind your business, on-site when it matters and virtual when it counts. The four pillars behind the work.",
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <>
      <section className="bg-white border-b border-line">
        <div className="shell py-16">
          <SectionHeading
            as="h1"
            kicker="About"
            title="A whole firm behind your business."
            intro="One flat monthly fee puts admin, documentation, compliance, coordination, marketing, publishing and more behind you. On-site when the moment calls for it — a walkthrough, an event, a kickoff — and virtual the rest of the time."
          />
        </div>
      </section>

      <section className="section-cream">
        <div className="shell py-16">
          <h2 className="mb-8 font-fraunces text-[26px] font-medium text-forest">Four pillars</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p) => (
              <div key={p.t} className="border-t border-line-soft pt-4">
                <h3 className="font-fraunces text-[20px] font-medium text-forest">{p.t}</h3>
                <p className="mt-2 text-[15.5px] prose-soft">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-white">
        <div className="shell grid gap-10 py-16 md:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="font-fraunces text-[24px] font-medium text-forest">How we hold the standard</h2>
            <span className="rule-gold mb-6 mt-3" />
            <ul className="flex flex-col gap-3">
              {STANDARDS.map((s, i) => (
                <li key={i} className="border-t border-line-soft pt-3 text-[16px] prose-soft">{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-fraunces text-[24px] font-medium text-forest">What you can count on</h2>
            <span className="rule-gold mb-6 mt-3" />
            <ul className="flex flex-col gap-4">
              {TRUST_POINTS.map((t) => (
                <li key={t.t} className="border-t border-line-soft pt-3">
                  <p className="text-[16px] font-medium text-charcoal">{t.t}</p>
                  <p className="text-[15px] prose-muted">{t.d}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section-cream">
        <div className="shell flex flex-col items-start gap-4 py-14">
          <p className="text-[18px] prose-soft">
            {SITE.since}. {SITE.locations}, {SITE.serving}.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/get-started" className="btn-gold">Get Started</Link>
            <Link href="/faq" className="btn-outline">Read the FAQ</Link>
          </div>
        </div>
      </section>
    </>
  );
}
