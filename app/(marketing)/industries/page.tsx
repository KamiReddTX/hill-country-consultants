import type { Metadata } from "next";
import Link from "next/link";
import { ImageSlot } from "@/components/image-slot";
import { SectionHeading } from "@/components/section-heading";
import { INDUSTRIES } from "@/content/industries";

export const metadata: Metadata = {
  title: "Industries",
  description:
    "Where we bring the deepest working knowledge — construction, authors and personal brands, food and hospitality, small and mid-size business, nonprofits, and agriculture.",
  alternates: { canonical: "/industries" },
  openGraph: {
    title: "Industries · Hill Country Consultants",
    description:
      "Where we bring the deepest working knowledge — construction, authors and personal brands, food and hospitality, small and mid-size business, nonprofits, and agriculture.",
    url: "/industries",
  },
};

export default function IndustriesPage() {
  return (
    <>
      <section className="bg-white border-b border-line">
        <div className="shell py-16">
          <SectionHeading
            as="h1"
            kicker="Industries"
            title="Built for the way your work actually runs."
            intro="The four pillars apply anywhere, but these are the fields where we bring the deepest working knowledge."
          />
        </div>
      </section>
      <section className="section-cream">
        <div className="shell grid gap-8 py-16 md:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((ind) => (
            <Link key={ind.slug} href={`/industries/${ind.slug}`} className="flex flex-col gap-4 border border-line-warm bg-white p-6 transition-colors hover:border-gold">
              <ImageSlot label={ind.img} ratio="16 / 9" />
              <h2 className="font-fraunces text-[21px] font-medium text-forest">{ind.name}</h2>
              <p className="text-[16px] prose-soft">{ind.headline}</p>
              <span className="link-underline self-start text-[14.5px]">How we help</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
