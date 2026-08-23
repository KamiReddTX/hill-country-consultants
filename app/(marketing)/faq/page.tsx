import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { FAQS } from "@/content/about-faq";
import { getSiteFaqs } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "How Hill Country Consultants works — what we do, hybrid meaning, hours, booking, pricing, contracts, payment, turnaround and credentials.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ · Hill Country Consultants",
    description:
      "How Hill Country Consultants works — what we do, hybrid meaning, hours, booking, pricing, contracts, payment, turnaround and credentials.",
    url: "/faq",
  },
};

export default async function FaqPage() {
  const managed = await getSiteFaqs();
  // Use the admin-managed list when present; otherwise the built-in defaults.
  const faqs = managed.length ? managed.map((f) => ({ q: f.question, a: f.answer })) : FAQS;
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <section className="bg-white border-b border-line">
        <div className="shell py-16">
          <SectionHeading as="h1" kicker="FAQ" title="Questions, answered." />
        </div>
      </section>
      <section className="section-cream">
        <div className="shell max-w-[60em] py-16">
          <dl className="flex flex-col">
            {faqs.map((f, i) => (
              <div key={i} className="border-t border-line-soft py-6">
                <dt className="font-fraunces text-[20px] font-medium text-forest">{f.q}</dt>
                <dd className="mt-2 text-[16.5px] prose-soft">{f.a}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/get-started" className="btn-gold">Get Started</Link>
            <Link href="/book" className="btn-outline">Book &amp; Pay</Link>
          </div>
        </div>
      </section>
    </>
  );
}
