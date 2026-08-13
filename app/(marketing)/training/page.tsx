import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { CLASSES } from "@/content/classes";

export const metadata: Metadata = {
  title: "Corporate Training",
  description:
    "Eight corporate classes taught on site or virtually — workbook, resource pack and a hands-on build lab where your team produces real deliverables in the room.",
  alternates: { canonical: "/training" },
  openGraph: {
    title: "Corporate Training · Hill Country Consultants",
    description:
      "Eight corporate classes taught on site or virtually — workbook, resource pack and a hands-on build lab where your team produces real deliverables in the room.",
    url: "/training",
  },
};

export default function TrainingPage() {
  return (
    <>
      <section className="bg-white border-b border-line">
        <div className="shell py-16">
          <SectionHeading
            as="h1"
            kicker="Training"
            title="Eight corporate classes"
            intro="Half or full day, on site or virtual, with a hands-on build lab where your team produces real deliverables. Content is tailored to your industry before the session; up to 20 participants, add $75 per person beyond 20."
          />
        </div>
      </section>
      <section className="section-cream">
        <div className="shell grid gap-8 py-16 md:grid-cols-2">
          {CLASSES.map((c) => (
            <Link key={c.slug} href={`/training/${c.slug}`} className="flex flex-col gap-3 border border-line-warm bg-white p-6 transition-colors hover:border-gold">
              <p className="kicker">{c.no}</p>
              <h2 className="font-fraunces text-[21px] font-medium text-forest">{c.name}</h2>
              <p className="text-[14px] prose-muted">For {c.who} · {c.format}</p>
              <p className="text-[15.5px] prose-soft">{c.why}</p>
              <span className="link-underline self-start text-[14px]">Class details</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
