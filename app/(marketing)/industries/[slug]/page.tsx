import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageSlot } from "@/components/image-slot";
import { INDUSTRIES, industryBySlug, INDUSTRY_SCOPE_ENDS } from "@/content/industries";

export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ slug: i.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const ind = industryBySlug(params.slug);
  if (!ind) return { title: "Industry" };
  return {
    title: ind.name,
    description: ind.headline,
    alternates: { canonical: `/industries/${ind.slug}` },
    openGraph: { title: ind.name, url: `/industries/${ind.slug}` },
  };
}

export default function IndustryPage({ params }: { params: { slug: string } }) {
  const ind = industryBySlug(params.slug);
  if (!ind) notFound();

  const bookParams = new URLSearchParams();
  if (ind.cart.length) bookParams.set("add", ind.cart.join(","));
  if (ind.quotes.length) bookParams.set("quote", ind.quotes.join(","));
  const startHref = bookParams.toString() ? `/book?${bookParams.toString()}` : "/book";

  return (
    <>
      {/* ── Hero: name + the outcome ── */}
      <section className="bg-white border-b border-line">
        <div className="shell grid items-center gap-12 py-16 md:grid-cols-2">
          <div>
            <p className="kicker mb-4">{ind.name}</p>
            <h1 className="font-fraunces text-[clamp(30px,4.4vw,48px)] font-normal leading-[1.1] text-forest">
              {ind.headline}
            </h1>
            <span className="rule-gold mt-4" />
          </div>
          <ImageSlot label={ind.img} />
        </div>
      </section>

      {/* ── The problem ── */}
      <section className="section-cream">
        <div className="shell max-w-[52em] py-16">
          <p className="kicker mb-3">The problem</p>
          <p className="text-[20px] leading-relaxed prose-soft">{ind.problem}</p>
        </div>
      </section>

      {/* ── What we handle + where our scope ends ── */}
      <section className="section-white">
        <div className="shell py-16">
          <h2 className="font-fraunces text-[24px] font-medium text-forest">What we handle</h2>
          <span className="rule-gold mb-7 mt-3" />
          <ul className="grid gap-x-10 gap-y-3 sm:grid-cols-2">
            {ind.handles.map((h, i) => (
              <li key={i} className="border-t border-line-soft pt-3 text-[16.5px] prose-soft">{h}</li>
            ))}
          </ul>
          <div className="mt-12 max-w-[46em] border-l-2 border-gold pl-5">
            <p className="kicker mb-2">Where our scope ends</p>
            <p className="text-[15.5px] prose-muted">{INDUSTRY_SCOPE_ENDS}</p>
          </div>
        </div>
      </section>

      {/* ── Start here ── */}
      <section className="section-cream">
        <div className="shell flex flex-col items-start gap-5 py-16">
          <h2 className="font-fraunces text-[clamp(24px,3.2vw,32px)] font-normal text-forest">Start here</h2>
          <span className="rule-gold" />
          <div className="mt-1 flex flex-wrap items-center gap-4">
            <Link href={startHref} className="btn-gold">Start here</Link>
            <Link href="/get-started" className="link-underline text-[15px]">
              Or book a free 30-minute strategy session
            </Link>
          </div>
          <Link href="/industries" className="link-underline mt-4 text-[14.5px]">← All industries</Link>
        </div>
      </section>
    </>
  );
}
