import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CLASSES, classBySlug } from "@/content/classes";

export function generateStaticParams() {
  return CLASSES.map((c) => ({ class: c.slug }));
}

export function generateMetadata({ params }: { params: { class: string } }): Metadata {
  const c = classBySlug(params.class);
  if (!c) return { title: "Class" };
  return {
    title: `${c.name} · Training`,
    description: c.why,
    alternates: { canonical: `/training/${c.slug}` },
    openGraph: {
      title: `${c.name} · Training · Hill Country Consultants`,
      description: c.why,
      url: `/training/${c.slug}`,
    },
  };
}

export default function ClassPage({ params }: { params: { class: string } }) {
  const c = classBySlug(params.class);
  if (!c) notFound();
  const bookHref = `/book?add=${c.bookItem}&class=${c.slug}`;

  return (
    <>
      <section className="bg-white border-b border-line">
        <div className="shell py-16">
          <Link href="/training" className="kicker hover:text-forest">← All classes</Link>
          <p className="kicker mt-6">{c.no}</p>
          <h1 className="mt-2 max-w-[22em] font-fraunces text-[clamp(30px,4.4vw,48px)] font-normal text-forest">{c.name}</h1>
          <span className="rule-gold mt-3" />
          <p className="mt-4 text-[15px] prose-muted">For {c.who} · {c.format}</p>
          <p className="mt-6 max-w-[46em] text-[19px] prose-soft">{c.why}</p>
          <Link href={bookHref} className="btn-gold mt-8">Book this class</Link>
        </div>
      </section>

      <section className="section-cream">
        <div className="shell py-16">
          <h2 className="font-fraunces text-[24px] font-medium text-forest">What your team leaves with</h2>
          <span className="rule-gold mb-6 mt-3" />
          <ul className="grid gap-3 md:grid-cols-2">
            {c.leave.map((x, i) => (
              <li key={i} className="border-t border-line-soft pt-3 text-[16px] prose-soft">{x}</li>
            ))}
          </ul>
          <p className="mt-8 text-[15px] prose-muted">
            Standalone {c.format.toLowerCase().includes("full") ? "full-day rate $4,500" : "half-day rate $3,000"}.
            Classes are included in every plan at your tier&apos;s cadence.
          </p>
        </div>
      </section>
    </>
  );
}
