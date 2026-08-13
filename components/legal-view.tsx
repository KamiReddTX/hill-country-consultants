import Link from "next/link";
import { LEGAL, LEGAL_ORDER, type LegalPage } from "@/content/legal";
import { linkifyEmail } from "@/components/linkify";

/** Shared renderer for the four legal pages, with the legal subnav. */
export function LegalView({ page }: { page: LegalPage }) {
  return (
    <>
      <section className="bg-white border-b border-line">
        <div className="shell py-16">
          <p className="kicker mb-4">{page.kicker}</p>
          <h1 className="font-fraunces text-[clamp(30px,4.4vw,46px)] font-normal text-forest">{page.title}</h1>
          <span className="rule-gold mt-3" />
          <p className="mt-3 text-[13px] text-ink-faint">{page.updated}</p>
          <p className="mt-6 max-w-[52em] text-[18px] prose-soft">{page.intro}</p>
        </div>
      </section>

      <section className="section-cream">
        <div className="shell grid gap-12 py-16 md:grid-cols-[220px_1fr]">
          <nav aria-label="Legal" className="h-max md:sticky md:top-24">
            <p className="kicker mb-3">Legal</p>
            <ul className="flex flex-col gap-2">
              {LEGAL_ORDER.map((k) => {
                const l = LEGAL[k];
                const active = l.slug === page.slug;
                return (
                  <li key={k}>
                    <Link
                      href={`/${l.slug}`}
                      className={`text-[15px] ${active ? "font-semibold text-forest" : "prose-muted hover:text-forest"}`}
                    >
                      {l.nav}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="max-w-[54em]">
            {page.sections.map((s) => (
              <div key={s.t} className="mb-10 border-t border-line-soft pt-6">
                <h2 className="font-fraunces text-[22px] font-medium text-forest">{s.t}</h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {s.lines.map((line, i) => (
                    <li key={i} className="text-[16px] prose-soft">{linkifyEmail(line)}</li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="mt-8 text-[15px] prose-muted">
              Questions? <a className="link-underline" href="mailto:info@hillcountryconsultants.com">info@hillcountryconsultants.com</a> · 470-478-1590
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
