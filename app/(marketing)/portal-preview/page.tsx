import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Client Portal Preview",
  description: "See inside the Hill Country Consultants client portal — dashboard, onboarding tracker, 30-day roadmap, task board, project status, weekly reports, work log, document vault, and messaging. Every client gets one.",
  alternates: { canonical: "/portal-preview" },
};

/** Small on-brand mock building blocks (static, illustrative). */
const Bar = ({ pct }: { pct: number }) => (
  <div className="h-1.5 w-full bg-line-soft"><div className="h-1.5 bg-gold" style={{ width: `${pct}%` }} /></div>
);
const Dot = ({ done }: { done?: boolean }) => (
  <span className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border text-[9px] leading-none ${done ? "border-forest bg-forest text-white" : "border-gold bg-white text-transparent"}`}>✓</span>
);

function FeatureCard({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border border-line-warm bg-white p-5">
      <div>
        <h3 className="font-fraunces text-[19px] font-medium text-forest">{title}</h3>
        <p className="mt-1 text-[14.5px] prose-soft">{desc}</p>
      </div>
      <div className="mt-1 border border-line-soft bg-cream/40 p-3">{children}</div>
    </div>
  );
}

export default function PortalPreviewPage() {
  return (
    <>
      <section className="bg-white border-b border-line">
        <div className="shell py-16">
          <p className="kicker">The client portal</p>
          <h1 className="mt-2 max-w-[20em] font-fraunces text-[clamp(30px,4.4vw,48px)] font-normal text-forest">See inside your client portal.</h1>
          <span className="rule-gold mt-3" />
          <p className="mt-6 max-w-[48em] text-[18px] prose-soft">
            Every client — plan or standalone booking — gets their own secure portal. No guessing what we did this week,
            no chasing status, no wondering who to call. Here&apos;s what&apos;s waiting inside.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/get-started" className="btn-gold">Get started</Link>
            <Link href="/portal/login" className="btn-outline">Existing client — log in</Link>
          </div>
        </div>
      </section>

      <section className="section-cream">
        <div className="shell py-16">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard title="Dashboard & onboarding tracker" desc="Your week-one onboarding, step by step — each step is marked complete as it happens.">
              <div className="flex justify-between text-[11px] prose-muted"><span>Onboarding</span><span>3 of 5</span></div>
              <div className="mt-1"><Bar pct={60} /></div>
              <ul className="mt-3 flex flex-col gap-1.5 text-[13px]">
                {[["Kickoff call", true], ["30-day roadmap", true], ["Credential handoff", true], ["Shared task board", false], ["File structure", false]].map(([t, d], i) => (
                  <li key={i} className="flex items-start gap-2"><Dot done={d as boolean} /><span className={d ? "text-ink-faint line-through" : "text-charcoal"}>{t as string}</span></li>
                ))}
              </ul>
            </FeatureCard>

            <FeatureCard title="30-day roadmap" desc="What we deliver, in what order, by what date — and what we need from you.">
              <ul className="flex flex-col gap-2 text-[13px]">
                {[["Days 1–5", "Onboarding complete"], ["Days 5–10", "Document baseline"], ["Days 10–20", "First deliverables"], ["Day 30", "First full review"]].map(([w, t], i) => (
                  <li key={i} className="border-l-2 border-gold pl-2"><span className="text-[11px] text-ink-faint">{w}</span><br /><span className="text-charcoal">{t}</span></li>
                ))}
              </ul>
            </FeatureCard>

            <FeatureCard title="Task board" desc="Requested, in progress, in review, delivered — add a request yourself, we confirm same day.">
              <div className="grid grid-cols-3 gap-1.5">
                {[["Requested", ["New flyer"]], ["In progress", ["Submittal 2"]], ["Delivered", ["Kickoff"]]].map(([c, items], i) => (
                  <div key={i} className="border border-line-soft bg-white p-1.5">
                    <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-forest">{c as string}</p>
                    {(items as string[]).map((it) => <p key={it} className="border border-line-soft bg-cream/50 p-1 text-[11px] text-charcoal">{it}</p>)}
                  </div>
                ))}
              </div>
            </FeatureCard>

            <FeatureCard title="Project status" desc="See exactly where every project stands, at a glance.">
              <ul className="flex flex-col gap-2 text-[13px]">
                {[["Brand refresh", "In review", "text-gold"], ["Q3 submittals", "On track", "text-forest"], ["Website build", "In progress", "text-charcoal"]].map(([n, s, c], i) => (
                  <li key={i} className="flex items-center justify-between"><span className="text-charcoal">{n}</span><span className={`text-[12px] font-semibold ${c}`}>{s}</span></li>
                ))}
              </ul>
            </FeatureCard>

            <FeatureCard title="Weekly reports" desc="Every Friday: what we delivered, the hours it took, what's in flight, and what's next.">
              <ul className="flex flex-col gap-1.5 text-[13px]">
                {["Week of Sep 15 — delivered 4 items", "Week of Sep 8 — delivered 3 items", "Week of Sep 1 — delivered 5 items"].map((r) => (
                  <li key={r} className="flex items-center justify-between border-b border-line-soft pb-1"><span className="text-charcoal">{r}</span><span className="text-[11px] text-forest">PDF</span></li>
                ))}
              </ul>
            </FeatureCard>

            <FeatureCard title="Work log" desc="Daily entries with hours by service line, reconciled against your allotment.">
              <ul className="flex flex-col gap-1.5 text-[13px]">
                {[["Sep 18", "Submittals", "2.0h"], ["Sep 17", "Admin", "1.5h"], ["Sep 16", "Marketing", "3.0h"]].map(([d, s, h], i) => (
                  <li key={i} className="flex items-center justify-between text-charcoal"><span>{d} · {s}</span><span className="tabular-nums text-ink-faint">{h}</span></li>
                ))}
              </ul>
            </FeatureCard>

            <FeatureCard title="Credential vault" desc="A secure record of every login we hold — usernames, passwords, and access — editable by you, so work never stops on a changed password. Documents and deliverables live separately under Calendar & files.">
              <ul className="flex flex-col gap-1.5 text-[13px]">
                {[["Google Workspace", "In sync"], ["Website hosting", "In sync"], ["Ad manager", "Needs re-sync"]].map(([n, s], i) => (
                  <li key={i} className="flex items-center justify-between"><span className="text-charcoal">🔒 {n}</span><span className={`text-[11px] font-semibold ${s === "In sync" ? "text-forest" : "text-red-700"}`}>{s}</span></li>
                ))}
              </ul>
            </FeatureCard>

            <FeatureCard title="Messaging" desc="Two-way messaging with your account team — with files, right in the portal or by email.">
              <div className="flex flex-col gap-1.5">
                <span className="max-w-[80%] bg-cream/70 px-2 py-1 text-[12px] text-charcoal">Can you push the launch to Friday?</span>
                <span className="ml-auto max-w-[80%] bg-forest px-2 py-1 text-[12px] text-white">Done — moved to Fri, calendar updated.</span>
              </div>
            </FeatureCard>

            <FeatureCard title="Calendar & files" desc="Shared calendar for due dates and events, plus a private space for your deliverables and files.">
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 21 }).map((_, i) => (
                  <span key={i} className={`aspect-square border text-center text-[9px] leading-[1.6] ${[4, 11, 16].includes(i) ? "border-forest bg-forest/10 text-forest" : "border-line-soft text-ink-faint"}`}>{i + 1}</span>
                ))}
              </div>
            </FeatureCard>
          </div>

          <div className="mt-10 border border-line-warm bg-white p-6">
            <h2 className="font-fraunces text-[22px] font-medium text-forest">Why it matters</h2>
            <p className="mt-2 max-w-[60em] text-[16px] prose-soft">
              The portal keeps you organized and informed without a single status meeting. You always know what&apos;s done,
              what&apos;s in progress, what it cost in hours, and what&apos;s next — and everything we produce is in one place,
              yours to keep. It&apos;s the difference between hoping the work is happening and watching it happen.
            </p>
          </div>
        </div>
      </section>

      <section className="section-white">
        <div className="shell flex flex-col items-start gap-4 py-14">
          <h2 className="font-fraunces text-[26px] text-forest">Ready for your own portal?</h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/get-started" className="btn-gold">Get started</Link>
            <Link href="/portal/login" className="btn-outline">Existing client — log in</Link>
            <Link href="/plans" className="link-underline self-center text-[15px]">See plans &amp; pricing</Link>
          </div>
          <p className="text-[13px] prose-muted">Screens shown are illustrative examples of the live portal.</p>
        </div>
      </section>
    </>
  );
}
