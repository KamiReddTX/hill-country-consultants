import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CLASSES, classBySlug, CLASS_DETAIL, TRAINING_INFO, TRAINING_FAQS, sampleAgenda } from "@/content/classes";

export function generateStaticParams() {
  return CLASSES.map((c) => ({ class: c.slug }));
}

export function generateMetadata({ params }: { params: { class: string } }): Metadata {
  const c = classBySlug(params.class);
  if (!c) return { title: "Class" };
  return {
    title: `${c.name} · Training`,
    description: c.why,
    alternates: { canonical: `/training/${c.slug}` },
    openGraph: {
      title: `${c.name} · Training · Hill Country Consultants`,
      description: c.why,
      url: `/training/${c.slug}`,
    },
  };
}

export default function ClassPage({ params }: { params: { class: string } }) {
  const c = classBySlug(params.class);
  if (!c) notFound();
  const bookHref = `/book?add=${c.bookItem}&class=${c.slug}`;
  // Carry the class into the inquiry form so the customer never re-types it.
  const requestHref = `/get-started?service=${encodeURIComponent("Corporate Training")}&class=${encodeURIComponent(c.name)}`;
  const isFullDay = c.bookItem === "class-full";
  const detail = CLASS_DETAIL[c.slug];
  const agenda = sampleAgenda(isFullDay);

  return (
    <>
      <section className="bg-white border-b border-line">
        <div className="shell py-16">
          <Link href="/training" className="kicker hover:text-forest">← All classes</Link>
          <p className="kicker mt-6">{c.no}</p>
          <h1 className="mt-2 max-w-[22em] font-fraunces text-[clamp(30px,4.4vw,48px)] font-normal text-forest">{c.name}</h1>
          <span className="rule-gold mt-3" />
          <p className="mt-4 text-[15px] prose-muted">For {c.who} · {c.format} · on-site or live-virtual</p>
          <p className="mt-1 text-[14px] prose-muted">Minimum enrollment 20 participants; the base price covers up to 20, and additional attendees are $250 each. Classes book 30–90 days out.</p>
          <p className="mt-6 max-w-[46em] text-[19px] prose-soft">{c.why}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href={requestHref} className="btn-gold">Request a training date</Link>
            <Link href={bookHref} className="btn-outline">Book &amp; pay</Link>
          </div>
        </div>
      </section>

      <section className="section-cream">
        <div className="shell grid gap-12 py-16 md:grid-cols-2">
          <div>
            <h2 className="font-fraunces text-[24px] font-medium text-forest">What your team leaves with</h2>
            <span className="rule-gold mb-6 mt-3" />
            <ul className="flex flex-col gap-3">
              {c.leave.map((x, i) => <li key={i} className="border-t border-line-soft pt-3 text-[16px] prose-soft">{x}</li>)}
            </ul>
          </div>
          {detail && (
            <div>
              <h2 className="font-fraunces text-[24px] font-medium text-forest">Learning objectives</h2>
              <span className="rule-gold mb-6 mt-3" />
              <ul className="flex flex-col gap-3">
                {detail.objectives.map((x, i) => <li key={i} className="border-t border-line-soft pt-3 text-[16px] prose-soft">{x}</li>)}
              </ul>
            </div>
          )}
        </div>
      </section>

      {detail && (
        <section className="section-white">
          <div className="shell py-16">
            <h2 className="font-fraunces text-[24px] font-medium text-forest">Training modules</h2>
            <span className="rule-gold mb-6 mt-3" />
            <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {detail.modules.map((m, i) => (
                <li key={i} className="border border-line-warm bg-white p-4">
                  <span className="kicker">Module {i + 1}</span>
                  <p className="mt-1 text-[16px] text-charcoal">{m}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="section-cream">
        <div className="shell py-16">
          <h2 className="font-fraunces text-[24px] font-medium text-forest">Sample agenda</h2>
          <span className="rule-gold mb-6 mt-3" />
          <p className="mb-6 text-[15px] prose-muted">{isFullDay ? "Full day, ~6 hours" : "Half day, ~4 hours"} — a sample; we tailor the flow to your team.</p>
          <ol className="flex flex-col gap-2">
            {agenda.map((a, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-3 border-t border-line-soft pt-2">
                <span className="font-fraunces text-[16px] text-forest">{a.t}</span>
                <span className="text-[15px] prose-soft">{a.d}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section-white">
        <div className="shell grid gap-8 py-16 md:grid-cols-2">
          <div><p className="kicker mb-2">Delivery</p><p className="text-[16px] prose-soft">{TRAINING_INFO.delivery}</p></div>
          <div><p className="kicker mb-2">Materials &amp; build lab</p><p className="text-[16px] prose-soft">{TRAINING_INFO.materials}</p></div>
          <div><p className="kicker mb-2">Certificate</p><p className="text-[16px] prose-soft">{TRAINING_INFO.certificate}</p></div>
          <div><p className="kicker mb-2">Customization</p><p className="text-[16px] prose-soft">{TRAINING_INFO.customization}</p></div>
          <div><p className="kicker mb-2">Travel (on-site)</p><p className="text-[16px] prose-soft">{TRAINING_INFO.travel}</p></div>
          <div><p className="kicker mb-2">After the class</p><p className="text-[16px] prose-soft">{TRAINING_INFO.postSupport}</p></div>
          <div className="md:col-span-2"><p className="kicker mb-2">Who teaches it</p><p className="max-w-[52em] text-[16px] prose-soft">{TRAINING_INFO.instructor}</p></div>
        </div>
      </section>

      <section className="section-cream">
        <div className="shell py-16">
          <h2 className="font-fraunces text-[24px] font-medium text-forest">Questions</h2>
          <span className="rule-gold mb-6 mt-3" />
          <div className="flex max-w-[60em] flex-col gap-3">
            {TRAINING_FAQS.map((f, i) => (
              <details key={i} className="border border-line-warm bg-white">
                <summary className="min-h-touch cursor-pointer px-4 py-3 text-[16px] font-medium text-charcoal">{f.q}</summary>
                <div className="border-t border-line-soft px-4 py-3 text-[15px] prose-soft">{f.a}</div>
              </details>
            ))}
          </div>
          <p className="mt-8 text-[15px] prose-muted">
            Standalone {isFullDay ? "full-day rate $4,500" : "half-day rate $3,000"}. Classes are included in every plan at your tier&apos;s cadence.
          </p>
        </div>
      </section>

      <section className="section-white">
        <div className="shell flex flex-col items-start gap-4 py-14">
          <h2 className="font-fraunces text-[26px] text-forest">Bring this class to your team.</h2>
          <div className="flex flex-wrap gap-4">
            <Link href={requestHref} className="btn-gold">Request a training date</Link>
            <Link href={bookHref} className="btn-outline">Book &amp; pay</Link>
          </div>
        </div>
      </section>
    </>
  );
}
