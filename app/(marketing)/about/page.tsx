import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { ImageSlot } from "@/components/image-slot";
import { PILLARS } from "@/content/about-faq";
import { SITE, TRUST_POINTS } from "@/content/site";
import { getSiteContent, pick } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About",
  description:
    "Hybrid consulting and virtual assistance — one firm behind your business, on-site when it matters and virtual when it counts. Leadership, team structure, and the four pillars behind the work.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About · Hill Country Consultants",
    description:
      "Hybrid consulting and virtual assistance — one firm behind your business, on-site when it matters and virtual when it counts.",
    url: "/about",
  },
};

/** The coordinated team behind every engagement. */
const TEAM: { t: string; d: string }[] = [
  { t: "Leadership", d: "Sets standards, owns quality, and stays accountable for every engagement." },
  { t: "Account management", d: "Your single point of contact — coordinates the work and keeps you informed." },
  { t: "Administrative support", d: "Day-to-day admin, inbox, scheduling, and document production." },
  { t: "Project management", d: "Plans, timelines, task boards, and status reporting that keep work moving." },
  { t: "Creative & marketing specialists", d: "Graphics, branding, content, and campaign support on your brand." },
  { t: "Publishing specialists", d: "Editorial, formatting, cover and distribution coordination, and launch assets." },
  { t: "Digital & web specialists", d: "Landing pages, multi-page sites, PWAs, and custom app builds." },
  { t: "Construction documentation specialists", d: "Submittals, cut sheets, compliance files, and transmittal logs." },
  { t: "Agriculture & land support", d: "Stewardship records, program paperwork, and regenerative-plan frameworks." },
  { t: "Grant & nonprofit support", d: "Research, application preparation, and funder reporting." },
  { t: "Corporate training specialists", d: "Class delivery, workbooks, and hands-on build labs, virtual or on-site." },
  { t: "Specialist partners", d: "Vetted contractors and licensed professionals brought in when a scope calls for them." },
];

export default async function AboutPage() {
  const c = await getSiteContent();
  return (
    <>
      <section className="bg-white border-b border-line">
        <div className="shell py-16">
          <SectionHeading
            as="h1"
            kicker="About"
            title={pick(c, "about.title", "A whole firm behind your business.")}
            intro={pick(c, "about.intro", "One flat monthly fee puts admin, documentation, compliance, coordination, marketing, publishing and more behind you. On-site when the moment calls for it — a walkthrough, an event, a kickoff — and virtual the rest of the time.")}
          />
        </div>
      </section>

      {/* ── Four pillars ── */}
      <section className="section-cream">
        <div className="shell py-16">
          <h2 className="mb-8 font-fraunces text-[26px] font-medium text-forest">Four pillars</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p) => (
              <div key={p.t} className="border-t border-line-soft pt-4">
                <h3 className="font-fraunces text-[20px] font-medium text-forest">{p.t}</h3>
                <p className="mt-2 text-[15.5px] prose-soft">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Leadership (placeholder — bio & credentials to be supplied) ── */}
      <section className="section-white">
        <div className="shell py-16">
          <h2 className="font-fraunces text-[26px] font-medium text-forest">Leadership</h2>
          <span className="rule-gold mb-8 mt-3" />
          <div className="grid gap-10 md:grid-cols-[280px_1fr]">
            <ImageSlot label="Founder / leadership portrait" ratio="4 / 5" />
            <div className="flex flex-col gap-4">
              <p className="text-[17px] prose-soft">
                Hill Country Consultants is founder-led, built on hands-on experience across business
                operations, documentation, marketing, publishing, and the specialty work our clients rely on.
              </p>
              <div className="border border-line-warm bg-cream/50 p-6">
                <p className="kicker mb-3">Founder-led</p>
                <p className="text-[15px] prose-soft">
                  The firm is led by its founder, whose hands-on background spans business operations, documentation,
                  compliance, marketing, publishing, and the specialty work our clients rely on — the same disciplines
                  Hill Country Consultants delivers. Leadership sets the quality standard every deliverable is measured
                  against and stays close to the work rather than above it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Team structure ── */}
      <section className="section-cream">
        <div className="shell py-16">
          <h2 className="font-fraunces text-[26px] font-medium text-forest">One coordinated team</h2>
          <span className="rule-gold mb-4 mt-3" />
          <p className="mb-10 max-w-[60em] text-[17px] prose-soft">
            &ldquo;A whole firm behind your business&rdquo; is how we&apos;re built. Rather than one generalist
            stretched across everything, Hill Country Consultants brings specialists together under one company —
            coordinated by a single account lead, working from shared systems, and billed as one flat fee. That
            structure is how one company can deliver across so many categories without you hiring, onboarding, or
            managing separate vendors.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((r) => (
              <div key={r.t} className="border border-line-warm bg-white p-6">
                <h3 className="font-fraunces text-[18px] font-medium text-forest">{r.t}</h3>
                <p className="mt-2 text-[15px] prose-soft">{r.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[14px] prose-muted">Every engagement is coordinated by a single account lead, with specialists assigned by the work your plan calls for.</p>
        </div>
      </section>

      {/* ── What you can count on ── */}
      <section className="section-white">
        <div className="shell py-16">
          <h2 className="font-fraunces text-[24px] font-medium text-forest">What you can count on</h2>
          <span className="rule-gold mb-6 mt-3" />
          <ul className="grid gap-4 md:grid-cols-2">
            {TRUST_POINTS.map((t) => (
              <li key={t.t} className="border-t border-line-soft pt-3">
                <p className="text-[16px] font-medium text-charcoal">{t.t}</p>
                <p className="text-[15px] prose-muted">{t.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Closing ── */}
      <section className="section-cream">
        <div className="shell flex flex-col items-start gap-4 py-14">
          <p className="text-[18px] prose-soft">
            One firm, one point of contact, one flat monthly fee — on-site when it matters, virtual when it counts.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/get-started" className="btn-gold">Get Started</Link>
            <Link href="/faq" className="btn-outline">Read the FAQ</Link>
          </div>
        </div>
      </section>
    </>
  );
}
