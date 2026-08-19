import type { Metadata } from "next";
import Link from "next/link";
import { ImageSlot } from "@/components/image-slot";

export const metadata: Metadata = {
  title: "Our Work · Hill Country Consultants",
  description: "A look at the work Hill Country Consultants produces — construction submittals, documents & compliance, brand & marketing, publishing, websites & digital, podcast & media, events, training, agriculture, and nonprofits.",
  alternates: { canonical: "/work" },
};

const CATEGORIES: { t: string; samples: string[] }[] = [
  { t: "Construction", samples: ["Submittal cover", "OEM cut sheet", "Marked selections", "Compliance checklist"] },
  { t: "Documents & Compliance", samples: ["Capability statement", "Company profile", "Prequal package", "SOP manual"] },
  { t: "Brand & Marketing", samples: ["Brand guide", "Social graphic", "Flyer", "Campaign concept"] },
  { t: "Publishing", samples: ["Book cover", "Interior spread", "eBook", "Launch graphic"] },
  { t: "Websites & Digital", samples: ["Landing page", "Multi-page site", "PWA", "Dashboard"] },
  { t: "Podcast & Media", samples: ["Episode thumbnail", "Audiogram", "Social clip", "Show art"] },
  { t: "Events", samples: ["Event setup", "Run-of-show", "Stage", "Guest experience"] },
  { t: "Training", samples: ["Class workbook", "Build-lab output", "Certificate", "Agenda"] },
  { t: "Agriculture", samples: ["Stewardship calendar", "Land records", "Regenerative plan", "Field"] },
  { t: "Nonprofits", samples: ["Grant research report", "Application narrative", "Budget", "Compliance checklist"] },
];

export default function WorkPage() {
  return (
    <>
      <section className="bg-white border-b border-line">
        <div className="shell py-16">
          <p className="kicker">Our work</p>
          <h1 className="mt-2 max-w-[20em] font-fraunces text-[clamp(30px,4.4vw,48px)] font-normal text-forest">The work behind the firm.</h1>
          <span className="rule-gold mt-3" />
          <p className="mt-6 max-w-[48em] text-[18px] prose-soft">
            A cross-section of what we produce, by category. Client work is shown redacted — no confidential
            information is ever displayed. Want the full picture for your industry?{" "}
            <Link href="/get-started" className="link-underline">Start a conversation.</Link>
          </p>
        </div>
      </section>

      {CATEGORIES.map((c, idx) => (
        <section key={c.t} className={idx % 2 === 0 ? "section-cream" : "section-white"}>
          <div className="shell py-14">
            <h2 className="font-fraunces text-[24px] font-medium text-forest">{c.t}</h2>
            <span className="rule-gold mb-6 mt-3" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {c.samples.map((s) => <ImageSlot key={s} label={s} src="" />)}
            </div>
          </div>
        </section>
      ))}

      <section className="section-cream">
        <div className="shell flex flex-col items-start gap-4 py-14">
          <p className="text-[13px] prose-muted">Portfolio samples are being added — redacted client work and case studies will populate each category. No confidential client information is ever shown.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/get-started" className="btn-gold">Get started</Link>
            <Link href="/services" className="btn-outline">Browse services</Link>
          </div>
        </div>
      </section>
    </>
  );
}
