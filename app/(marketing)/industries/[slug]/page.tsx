import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageSlot } from "@/components/image-slot";
import { INDUSTRIES, industryBySlug } from "@/content/industries";
import { SERVICE_META, SERVICE_DETAILS } from "@/content/services";

export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ slug: i.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const ind = industryBySlug(params.slug);
  if (!ind) return { title: "Industry" };
  return { title: ind.name, description: ind.blurb, alternates: { canonical: `/industries/${ind.slug}` } };
}

export default function IndustryPage({ params }: { params: { slug: string } }) {
  const ind = industryBySlug(params.slug);
  if (!ind) notFound();

  const bookParams = new URLSearchParams();
  if (ind.cart.length) bookParams.set("add", ind.cart.join(","));
  if (ind.quotes.length) bookParams.set("quote", ind.quotes.join(","));
  const startHref = `/book?${bookParams.toString()}`;

  return (
    <>
      <section className="bg-white border-b border-line">
        <div className="shell grid items-center gap-12 py-16 md:grid-cols-2">
          <div>
            <p className="kicker mb-4">Industries</p>
            <h1 className="font-fraunces text-[clamp(30px,4.4vw,48px)] font-normal text-forest">{ind.name}</h1>
            <span className="rule-gold mt-3" />
            <p className="mt-6 text-[18px] prose-soft">{ind.blurb}</p>
          </div>
          <ImageSlot label={ind.img} />
        </div>
      </section>

      <section className="section-cream">
        <div className="shell grid gap-10 py-16 md:grid-cols-[1fr_1fr]">
          <div>
            <p className="kicker mb-2">What hurts today</p>
            <p className="text-[19px] prose-soft">{ind.pain}</p>
          </div>
          <div className="border border-line-warm bg-white p-7">
            <p className="kicker mb-2">A place to start</p>
            <p className="text-[17px] prose-soft">{ind.start}</p>
            <Link href={startHref} className="btn-gold mt-5">Start here</Link>
          </div>
        </div>
      </section>

      <section className="section-white">
        <div className="shell py-16">
          <h2 className="mb-8 font-fraunces text-[24px] font-medium text-forest">The lines that fit</h2>
          <div className="grid gap-8 md:grid-cols-2">
            {ind.services.map((key) => {
              const meta = SERVICE_META[key];
              const included = SERVICE_DETAILS[key].included.slice(0, 5);
              return (
                <article key={key} className="flex flex-col gap-3 border border-line-warm bg-cream p-6">
                  <h3 className="font-fraunces text-[20px] font-medium text-forest">{meta.name}</h3>
                  <p className="text-[15px] prose-soft">{meta.desc}</p>
                  <ul className="mt-1 flex flex-col gap-1.5">
                    {included.map((x, i) => (
                      <li key={i} className="text-[14.5px] prose-muted">— {x}</li>
                    ))}
                  </ul>
                  <Link href={`/services/${key}`} className="link-underline mt-1 self-start text-[14px]">
                    What you receive
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-cream">
        <div className="shell flex flex-col items-start gap-4 py-12">
          <Link href="/industries" className="link-underline">← All industries</Link>
        </div>
      </section>
    </>
  );
}
