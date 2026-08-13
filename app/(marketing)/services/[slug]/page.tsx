import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageSlot } from "@/components/image-slot";
import { RateLines } from "@/components/rate-lines";
import {
  SERVICE_DETAILS, SERVICE_META, SERVICE_SLUGS, SERVICE_GROUPS, isServiceKey,
} from "@/content/services";

export function generateStaticParams() {
  return SERVICE_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  if (!isServiceKey(params.slug)) return { title: "Service" };
  const meta = SERVICE_META[params.slug];
  return {
    title: meta.name,
    description: meta.desc,
    alternates: { canonical: `/services/${params.slug}` },
    openGraph: {
      title: `${meta.name} · Hill Country Consultants`,
      description: meta.desc,
      url: `/services/${params.slug}`,
    },
  };
}

function imgFor(slug: string) {
  for (const g of SERVICE_GROUPS) {
    const hit = g.items.find((i) => i.key === slug);
    if (hit) return hit;
  }
  return { img: "", src: "" };
}

export default function ServiceDetailPage({ params }: { params: { slug: string } }) {
  if (!isServiceKey(params.slug)) notFound();
  const key = params.slug;
  const d = SERVICE_DETAILS[key];

  return (
    <>
      <section className="bg-white border-b border-line">
        <div className="shell grid items-center gap-12 py-16 md:grid-cols-2">
          <div>
            <p className="kicker mb-4">Services</p>
            <h1 className="font-fraunces text-[clamp(30px,4.4vw,48px)] font-normal text-forest">{d.headline}</h1>
            <span className="rule-gold mt-3" />
            <p className="mt-6 text-[18px] prose-soft">{d.pain}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/get-started" className="btn-gold">Book a strategy session</Link>
              <Link href="/plans" className="btn-outline">See plans</Link>
            </div>
          </div>
          <ImageSlot label={imgFor(key).img} src={imgFor(key).src} />
        </div>
      </section>

      <section className="section-cream">
        <div className="shell grid gap-12 py-16 md:grid-cols-2">
          <div>
            <h2 className="font-fraunces text-[24px] font-medium text-forest">What&apos;s included</h2>
            <span className="rule-gold mb-6 mt-3" />
            <ul className="flex flex-col gap-3">
              {d.included.map((x, i) => (
                <li key={i} className="border-t border-line-soft pt-3 text-[16px] prose-soft">{x}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-fraunces text-[24px] font-medium text-forest">What to expect</h2>
            <span className="rule-gold mb-6 mt-3" />
            <ul className="flex flex-col gap-3">
              {d.expect.map((x, i) => (
                <li key={i} className="border-t border-line-soft pt-3 text-[16px] prose-soft">{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section-white">
        <div className="shell py-16">
          <h2 className="font-fraunces text-[24px] font-medium text-forest">Rates</h2>
          <span className="rule-gold mb-6 mt-3" />
          <RateLines svc={key} />
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div>
              <p className="kicker mb-2">The scope</p>
              <p className="text-[16px] prose-soft">{d.scope}</p>
            </div>
            <div>
              <p className="kicker mb-2">How to start</p>
              <p className="text-[16px] prose-soft">{d.how}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-cream">
        <div className="shell flex flex-col items-start gap-4 py-12">
          <p className="text-[15px] prose-muted">Explore the rest of the menu.</p>
          <Link href="/services" className="link-underline">← All services</Link>
        </div>
      </section>
    </>
  );
}
