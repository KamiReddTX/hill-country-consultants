import type { Metadata } from "next";
import Link from "next/link";
import { ImageSlot } from "@/components/image-slot";
import { SectionHeading } from "@/components/section-heading";
import { RateLines } from "@/components/rate-lines";
import { SERVICE_GROUPS, SERVICE_META, publicServiceSlug } from "@/content/services";
import { INDUSTRIES } from "@/content/industries";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Fourteen service lines — admin and coordination, construction submittals, compliance, marketing and brand, publishing and media, digital, training, systems, events, agriculture and grants.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Services · Hill Country Consultants",
    description:
      "Fourteen service lines — admin and coordination, construction submittals, compliance, marketing and brand, publishing and media, digital, training, systems, events, agriculture and grants.",
    url: "/services",
  },
};

export default function ServicesPage() {
  return (
    <>
      <section className="bg-white border-b border-line">
        <div className="shell py-16">
          <SectionHeading
            as="h1"
            kicker="Services"
            title="Every service line, in one firm."
            intro="Buy a plan and use all of them at your tier's volume, or book any one à la carte. Scoped work is quoted in writing before it begins."
          />
          <div className="mt-8 border-t border-[#e8e0cd] pt-6">
            <p className="mb-3.5 font-inter text-[11.5px] font-medium uppercase tracking-[0.14em] text-ink-faint">
              Or see services by industry
            </p>
            <div className="flex flex-wrap gap-2.5">
              {INDUSTRIES.map((ind) => (
                <Link
                  key={ind.slug}
                  href={`/industries/${ind.slug}`}
                  className="border border-[#d8cdb3] bg-cream px-4 py-3 font-inter text-[14px] font-semibold text-charcoal transition-colors hover:bg-[#ede5d2]"
                >
                  {ind.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {SERVICE_GROUPS.map((group, gi) => (
        <section key={group.group} className={gi % 2 === 0 ? "section-cream" : "section-white"}>
          <div className="shell py-14">
            <h2 className="mb-8 font-fraunces text-[24px] font-medium text-forest">{group.group}</h2>
            <div className="grid gap-8 md:grid-cols-2">
              {group.items.map((item) => {
                const meta = SERVICE_META[item.key];
                return (
                  <article key={item.key} className="flex flex-col gap-4 border border-line-warm bg-white p-6">
                    <ImageSlot label={item.img} src={item.src} ratio="16 / 9" />
                    <h3 className="font-fraunces text-[21px] font-medium text-forest">{meta.name}</h3>
                    <p className="text-[16px] prose-soft">{meta.desc}</p>
                    <Link href={`/services/${publicServiceSlug(item.key)}`} className="link-underline self-start text-[14.5px]">
                      What you receive
                    </Link>
                    <div className="mt-1 border-t border-line-soft pt-5">
                      <span className="rule-gold" />
                      <p className="kicker mb-3 mt-3">Book on its own</p>
                      <RateLines svc={item.key} />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      <section className="section-cream">
        <div className="shell flex flex-col items-start gap-5 py-14">
          <p className="max-w-[46em] text-[18px] prose-soft">
            Not sure which lines you need? Start with the free 30-minute strategy session — we map
            the work and put a plan or scope in writing before anything begins.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/get-started" className="btn-gold">Get Started</Link>
            <Link href="/plans" className="btn-outline">See plans &amp; pricing</Link>
          </div>
        </div>
      </section>
    </>
  );
}
