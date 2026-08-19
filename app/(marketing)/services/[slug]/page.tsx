import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageSlot } from "@/components/image-slot";
import { RateLines } from "@/components/rate-lines";
import { ProjectSampleBoard } from "@/components/services/project-sample-board";
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

      {d.forWho && (
        <section className="section-white">
          <div className="shell py-14">
            <h2 className="font-fraunces text-[24px] font-medium text-forest">Who it&apos;s for</h2>
            <span className="rule-gold mb-6 mt-3" />
            <ul className="grid gap-3 md:grid-cols-3">
              {d.forWho.map((x, i) => <li key={i} className="border-t border-line-soft pt-3 text-[16px] prose-soft">{x}</li>)}
            </ul>
            {d.examples && (
              <div className="mt-8">
                <p className="kicker mb-3">What this covers</p>
                <div className="flex flex-wrap gap-2">
                  {d.examples.map((x, i) => <span key={i} className="border border-line-warm bg-cream/40 px-3 py-1.5 text-[14px] text-charcoal">{x}</span>)}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

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

      {(d.deliverables || d.provide) && (
        <section className="section-white">
          <div className="shell grid gap-12 py-16 md:grid-cols-2">
            {d.deliverables && (
              <div>
                <h2 className="font-fraunces text-[24px] font-medium text-forest">What you receive</h2>
                <span className="rule-gold mb-6 mt-3" />
                <ul className="flex flex-col gap-3">{d.deliverables.map((x, i) => <li key={i} className="border-t border-line-soft pt-3 text-[16px] prose-soft">{x}</li>)}</ul>
              </div>
            )}
            {d.provide && (
              <div>
                <h2 className="font-fraunces text-[24px] font-medium text-forest">What you provide</h2>
                <span className="rule-gold mb-6 mt-3" />
                <ul className="flex flex-col gap-3">{d.provide.map((x, i) => <li key={i} className="border-t border-line-soft pt-3 text-[16px] prose-soft">{x}</li>)}</ul>
              </div>
            )}
          </div>
        </section>
      )}

      {d.process && (
        <section className="section-cream">
          <div className="shell py-16">
            <h2 className="font-fraunces text-[24px] font-medium text-forest">How it works</h2>
            <span className="rule-gold mb-6 mt-3" />
            <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {d.process.map((s, i) => (
                <li key={i} className="border border-line-warm bg-white p-5">
                  <p className="kicker mb-1">Step {i + 1}</p>
                  <p className="font-fraunces text-[18px] text-forest">{s.t}</p>
                  <p className="mt-1 text-[15px] prose-soft">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {key === "pm" && (
        <section className="section-white">
          <div className="shell py-16">
            <h2 className="font-fraunces text-[24px] font-medium text-forest">See it in action</h2>
            <span className="rule-gold mb-6 mt-3" />
            <ProjectSampleBoard />
          </div>
        </section>
      )}

      {key === "grants" && (
        <section className="section-cream">
          <div className="shell py-16">
            <h2 className="font-fraunces text-[24px] font-medium text-forest">Sample deliverables</h2>
            <span className="rule-gold mb-6 mt-3" />
            <p className="mb-6 max-w-[52em] text-[16px] prose-soft">Researched, ranked, and prepared to the funder&apos;s guidelines. A sampling:</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {["Grant research report", "Ranked shortlist", "Application narrative", "Budget worksheet", "Compliance checklist", "Prospect list"].map((lbl) => (
                <ImageSlot key={lbl} label={lbl} src="" />
              ))}
            </div>
            <p className="mt-4 text-[12px] prose-muted">Redacted samples shown for format; no confidential client information is displayed.</p>
          </div>
        </section>
      )}

      {key === "ag" && (
        <section className="section-cream">
          <div className="shell py-16">
            <h2 className="font-fraunces text-[24px] font-medium text-forest">Sample deliverables</h2>
            <span className="rule-gold mb-6 mt-3" />
            <p className="mb-6 max-w-[52em] text-[16px] prose-soft">Organized, seasonal, and specific to your land. A sampling:</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {["Stewardship calendar", "Land records", "Regenerative plan", "Production calendar", "Program paperwork", "Field & pasture"].map((lbl) => (
                <ImageSlot key={lbl} label={lbl} src="" />
              ))}
            </div>
            <p className="mt-4 text-[12px] prose-muted">Portfolio samples — add your real deliverables and land photos here.</p>
          </div>
        </section>
      )}

      {key === "events" && (
        <section className="section-cream">
          <div className="shell py-16">
            <h2 className="font-fraunces text-[24px] font-medium text-forest">Event samples</h2>
            <span className="rule-gold mb-6 mt-3" />
            <p className="mb-6 max-w-[52em] text-[16px] prose-soft">Planned, coordinated, and run to a timeline. A sampling:</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {["Event setup", "Registration table", "Run-of-show", "Stage / speaker", "Decor detail", "Guest experience"].map((lbl) => (
                <ImageSlot key={lbl} label={lbl} src="" />
              ))}
            </div>
            <p className="mt-4 text-[12px] prose-muted">Portfolio samples — add your real event photos here.</p>
          </div>
        </section>
      )}

      {key === "systems" && (
        <section className="section-cream">
          <div className="shell py-16">
            <h2 className="font-fraunces text-[24px] font-medium text-forest">Automations we build</h2>
            <span className="rule-gold mb-6 mt-3" />
            <p className="mb-6 max-w-[52em] text-[16px] prose-soft">Real, rule-based flows that run themselves. A few examples:</p>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Lead form submitted", "CRM record created", "Follow-up task assigned", "Email drafted"],
                ["Employee uploads paperwork", "Tracker updated", "Manager notified"],
                ["Client completes onboarding", "Project folder created", "Tasks generated"],
                ["Invoice paid", "Onboarding email sent", "Client portal created"],
              ].map((flow, i) => (
                <div key={i} className="flex flex-wrap items-center gap-x-2 gap-y-1 border border-line-warm bg-white p-4">
                  {flow.map((step, j) => (
                    <span key={j} className="flex items-center gap-2">
                      <span className="text-[14px] text-charcoal">{step}</span>
                      {j < flow.length - 1 && <span className="text-gold" aria-hidden="true">→</span>}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {key === "digital" && (
        <section className="section-cream">
          <div className="shell py-16">
            <h2 className="font-fraunces text-[24px] font-medium text-forest">Project samples</h2>
            <span className="rule-gold mb-6 mt-3" />
            <p className="mb-6 max-w-[52em] text-[16px] prose-soft">Responsive, tested, and handed off to you. A sampling:</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {["Landing page", "Multi-page site", "PWA on phone", "Checkout flow", "Booking form", "Dashboard"].map((lbl) => (
                <ImageSlot key={lbl} label={lbl} src="" />
              ))}
            </div>
            <p className="mt-4 text-[12px] prose-muted">Portfolio samples — add your real projects and screenshots here.</p>
          </div>
        </section>
      )}

      {key === "media" && (
        <section className="section-cream">
          <div className="shell py-16">
            <h2 className="font-fraunces text-[24px] font-medium text-forest">Media samples</h2>
            <span className="rule-gold mb-6 mt-3" />
            <p className="mb-6 max-w-[52em] text-[16px] prose-soft">Clean, on-brand, and published on schedule. A sampling:</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {["Episode thumbnail", "Audiogram", "Social clip", "Show art", "Promo graphic", "Waveform edit"].map((lbl) => (
                <ImageSlot key={lbl} label={lbl} src="" />
              ))}
            </div>
            <p className="mt-4 text-[12px] prose-muted">Portfolio samples — add your real episodes and clips here.</p>
          </div>
        </section>
      )}

      {key === "publishing" && (
        <section className="section-cream">
          <div className="shell py-16">
            <h2 className="font-fraunces text-[24px] font-medium text-forest">Published work</h2>
            <span className="rule-gold mb-6 mt-3" />
            <p className="mb-6 max-w-[52em] text-[16px] prose-soft">From manuscript to finished book — yours to own. A sampling:</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {["Book cover", "Interior spread", "eBook on device", "Back cover & blurb", "Launch graphic", "Proof copy"].map((lbl) => (
                <ImageSlot key={lbl} label={lbl} src="" />
              ))}
            </div>
            <p className="mt-4 text-[12px] prose-muted">Portfolio samples — add your published titles here.</p>
          </div>
        </section>
      )}

      {key === "brand" && (
        <section className="section-cream">
          <div className="shell py-16">
            <h2 className="font-fraunces text-[24px] font-medium text-forest">Brand-kit samples</h2>
            <span className="rule-gold mb-6 mt-3" />
            <p className="mb-6 max-w-[52em] text-[16px] prose-soft">A coherent system your whole team can apply correctly. A sampling:</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {["Brand guide cover", "Color palette", "Typography", "Logo variations", "Business card", "Social template"].map((lbl) => (
                <ImageSlot key={lbl} label={lbl} src="" />
              ))}
            </div>
            <p className="mt-4 text-[12px] prose-muted">Portfolio samples — add your real brand work here.</p>
          </div>
        </section>
      )}

      {key === "marketing" && (
        <section className="section-cream">
          <div className="shell py-16">
            <h2 className="font-fraunces text-[24px] font-medium text-forest">Design & campaign samples</h2>
            <span className="rule-gold mb-6 mt-3" />
            <p className="mb-6 max-w-[52em] text-[16px] prose-soft">On-brand, at the right dimensions, produced on a schedule. A sampling:</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {["Social graphic", "Flyer", "Ad creative", "Email design", "Carousel post", "Campaign concept"].map((lbl) => (
                <ImageSlot key={lbl} label={lbl} src="" />
              ))}
            </div>
            <p className="mt-4 text-[12px] prose-muted">Portfolio samples — add your real work here.</p>
          </div>
        </section>
      )}

      {key === "compliance" && (
        <section className="section-cream">
          <div className="shell py-16">
            <h2 className="font-fraunces text-[24px] font-medium text-forest">Sample deliverables</h2>
            <span className="rule-gold mb-6 mt-3" />
            <p className="mb-6 max-w-[52em] text-[16px] prose-soft">Branded, accurate, and built to a defined standard. A redacted sampling:</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {["Capability statement", "Company profile", "Executive bio", "Prequalification package", "SOP manual page", "Policy document"].map((lbl) => (
                <ImageSlot key={lbl} label={lbl} src="" />
              ))}
            </div>
            <p className="mt-4 text-[12px] prose-muted">Redacted samples shown for format; no confidential client information is displayed.</p>
          </div>
        </section>
      )}

      {key === "submittals" && (
        <section className="section-cream">
          <div className="shell py-16">
            <h2 className="font-fraunces text-[24px] font-medium text-forest">Inside a sample package</h2>
            <span className="rule-gold mb-6 mt-3" />
            <p className="mb-6 max-w-[52em] text-[16px] prose-soft">Every package is assembled on your letterhead and built to move through review cleanly. A redacted sample:</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {["Cover page (your letterhead)", "Submittal index", "OEM cut sheet", "Marked product selections", "Compliance checklist", "Transmittal"].map((lbl) => (
                <ImageSlot key={lbl} label={lbl} src="" />
              ))}
            </div>
            <p className="mt-4 text-[12px] prose-muted">Redacted samples shown for format; no confidential project information is displayed.</p>
          </div>
        </section>
      )}

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

      {(d.timeline || d.revisions || d.software || d.notIncluded || d.addOns) && (
        <section className="section-cream">
          <div className="shell grid gap-10 py-16 md:grid-cols-2">
            {d.timeline && <div><p className="kicker mb-2">Timeline</p><p className="text-[16px] prose-soft">{d.timeline}</p></div>}
            {d.revisions && <div><p className="kicker mb-2">Revisions</p><p className="text-[16px] prose-soft">{d.revisions}</p></div>}
            {d.software && <div><p className="kicker mb-2">Software &amp; platforms</p><ul className="flex flex-col gap-2">{d.software.map((x, i) => <li key={i} className="text-[15px] prose-soft">{x}</li>)}</ul></div>}
            {d.notIncluded && <div><p className="kicker mb-2">Not included</p><ul className="flex flex-col gap-2">{d.notIncluded.map((x, i) => <li key={i} className="text-[15px] prose-soft">{x}</li>)}</ul></div>}
            {d.addOns && <div><p className="kicker mb-2">Upgrades &amp; add-ons</p><ul className="flex flex-col gap-2">{d.addOns.map((x, i) => <li key={i} className="text-[15px] prose-soft">{x}</li>)}</ul></div>}
          </div>
        </section>
      )}

      {d.afterPurchase && (
        <section className="section-white">
          <div className="shell py-14">
            <h2 className="font-fraunces text-[24px] font-medium text-forest">After you purchase</h2>
            <span className="rule-gold mb-6 mt-3" />
            <p className="max-w-[52em] text-[16px] prose-soft">{d.afterPurchase}</p>
          </div>
        </section>
      )}

      {d.faqs && (
        <section className="section-cream">
          <div className="shell py-16">
            <h2 className="font-fraunces text-[24px] font-medium text-forest">Questions</h2>
            <span className="rule-gold mb-6 mt-3" />
            <div className="flex max-w-[60em] flex-col gap-3">
              {d.faqs.map((f, i) => (
                <details key={i} className="border border-line-warm bg-white">
                  <summary className="min-h-touch cursor-pointer px-4 py-3 text-[16px] font-medium text-charcoal">{f.q}</summary>
                  <div className="border-t border-line-soft px-4 py-3 text-[15px] prose-soft">{f.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section-white">
        <div className="shell flex flex-col items-start gap-4 py-14">
          <h2 className="font-fraunces text-[26px] text-forest">Ready to hand this off?</h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/get-started" className="btn-gold">Get started</Link>
            <Link href="/book" className="btn-outline">Book &amp; pay</Link>
            <Link href="/plans" className="btn-outline">See plans</Link>
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
