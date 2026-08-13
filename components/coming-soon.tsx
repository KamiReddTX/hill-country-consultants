import Link from "next/link";

/**
 * Honest placeholder for routes scaffolded but not yet built out.
 * Carries no fabricated business content — just the section name and a way back.
 */
export function ComingSoon({ title, note }: { title: string; note?: string }) {
  return (
    <section className="section-cream min-h-[60vh]">
      <div className="shell flex flex-col items-start gap-5 py-24">
        <p className="kicker">Hill Country Consultants</p>
        <h1 className="font-fraunces text-[clamp(30px,4vw,44px)] font-normal text-forest">{title}</h1>
        <span className="rule-gold" />
        <p className="max-w-[44em] prose-soft">
          {note ??
            "This page is scaffolded and will be built from the approved prototype copy in the next phase."}
        </p>
        <Link href="/" className="link-underline">Back to home</Link>
      </div>
    </section>
  );
}
