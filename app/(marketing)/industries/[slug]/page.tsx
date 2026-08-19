import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageSlot } from "@/components/image-slot";
import { INDUSTRIES, industryBySlug, INDUSTRY_SCOPE_ENDS, INDUSTRY_SCOPE_BY_SLUG } from "@/content/industries";

const nameBySlug = (slug: string) => INDUSTRIES.find((i) => i.slug === slug)?.name ?? slug;

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
    openGraph: {
      title: `${ind.name} · Hill Country Consultants`,
      description: ind.headline,
      url: `/industries/${ind.slug}`,
    },
  };
}

export default function IndustryPage({ params }: { params: { slug: string } }) {
  const ind = industryBySlug(params.slug);
  if (!ind) notFound();

  // Start Here highlights the services most relevant to this industry on the
  // booking page — it filters the list, it does not add anything to the cart.
  // Nothing is added to a booking until the customer sets a quantity.
  const startHref = `/book?industry=${ind.slug}`;

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
            <p className="text-[15.5px] prose-muted">{INDUSTRY_SCOPE_BY_SLUG[ind.slug] || INDUSTRY_SCOPE_ENDS}</p>
          </div>
        </div>
      </section>

      {/* ── What you walk away with ── */}
      <section className="section-cream">
        <div className="shell py-16">
          <h2 className="font-fraunces text-[24px] font-medium text-forest">What you walk away with</h2>
          <span className="rule-gold mb-7 mt-3" />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {ind.deliverables.map((d, i) => (
              <div key={i} className="flex gap-3 border border-line-warm bg-white p-5">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 bg-gold" aria-hidden="true" />
                <p className="text-[15.5px] prose-soft">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sample work (redacted placeholders) ── */}
      <section className="section-white">
        <div className="shell py-16">
          <h2 className="font-fraunces text-[24px] font-medium text-forest">Sample work</h2>
          <span className="rule-gold mb-2 mt-3" />
          <p className="mb-7 max-w-[46em] text-[15px] prose-muted">
            Representative examples for this industry. Client work is shown redacted — no confidential information is ever displayed.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ind.samples.map((s) => <ImageSlot key={s} label={s} src="" />)}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section-cream">
        <div className="shell max-w-[56em] py-16">
          <h2 className="font-fraunces text-[24px] font-medium text-forest">Common questions</h2>
          <span className="rule-gold mb-7 mt-3" />
          <div className="flex flex-col gap-6">
            {ind.faqs.map((f, i) => (
              <div key={i} className="border-t border-line-soft pt-4">
                <h3 className="font-fraunces text-[18px] font-medium text-forest">{f.q}</h3>
                <p className="mt-2 text-[16px] prose-soft">{f.a}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-[15px] prose-muted">
            More in our <Link href="/faq" className="link-underline">full FAQ</Link>.
          </p>
        </div>
      </section>

      {/* ── Related industries ── */}
      {ind.related.length > 0 && (
        <section className="section-white">
          <div className="shell py-14">
            <h2 className="font-fraunces text-[20px] font-medium text-forest">Related industries</h2>
            <span className="rule-gold mb-6 mt-3" />
            <div className="flex flex-wrap gap-4">
              {ind.related.map((r) => (
                <Link key={r} href={`/industries/${r}`} className="btn-outline text-[15px]">{nameBySlug(r)}</Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Start here ── */}
      <section className="section-cream">
        <div className="shell flex flex-col items-start gap-5 py-16">
          <h2 className="font-fraunces text-[clamp(24px,3.2vw,32px)] font-normal text-forest">Start here</h2>
          <span className="rule-gold" />
          <p className="max-w-[46em] text-[15.5px] prose-soft">
            We&apos;ll highlight the services most relevant to {ind.name.toLowerCase()} on the booking page. Nothing is
            added to your booking until you set a quantity — so you choose exactly what you want.
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-4">
            <Link href={startHref} className="btn-gold">See recommended services</Link>
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
