import type { Metadata } from "next";
import Link from "next/link";
import { ApplicationForm } from "@/components/careers/application-form";
import { openJobs } from "@/content/careers";

export const metadata: Metadata = {
  title: "Careers — Open Roles · Hill Country Consultants",
  description: "Join Hill Country Consultants. See open roles and apply online — a coordinated business-support firm across operations, creative, production, and specialty services. Remote / Hybrid, U.S.-based roles — primarily remote, with local and regional on-site as needed, serving clients nationwide.",
  alternates: { canonical: "/careers" },
};

const WHY = [
  { t: "One firm, many crafts", d: "Work alongside specialists across operations, marketing, publishing, media, web, and more — real variety, real coordination." },
  { t: "Remote / Hybrid", d: "Primarily remote, with local and regional on-site work when a project calls for it. We serve clients nationwide across time zones." },
  { t: "Clear systems", d: "Task boards, checklists, weekly reporting, and a shared portal mean you always know what's expected and where work stands." },
];

export default function CareersPage() {
  const jobs = openJobs();
  return (
    <div className="shell py-14">
      <div className="max-w-[46em]">
        <p className="kicker">Careers at Hill Country Consultants</p>
        <h1 className="mt-2 font-fraunces text-[40px] leading-[1.1] text-forest">Do a whole firm&apos;s worth of work — with a team behind you.</h1>
        <span className="rule-gold mb-5 mt-4 block" />
        <p className="text-[17px] leading-relaxed prose-soft">
          We&apos;re a coordinated business-support firm: virtual assistance and admin, documentation and compliance, marketing and design,
          publishing, media, web, and specialty services — all under one roof. Browse our open roles below, or send a general application
          and tell us what you do best.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {WHY.map((w) => (
          <div key={w.t} className="border border-line-warm bg-white p-5">
            <p className="font-fraunces text-[18px] text-forest">{w.t}</p>
            <p className="mt-1 text-[14.5px] prose-soft">{w.d}</p>
          </div>
        ))}
      </div>

      <p className="mt-6 max-w-[52em] border-l-2 border-gold pl-4 text-[14px] leading-relaxed prose-muted">
        <strong className="text-charcoal">Every role is remote / hybrid and U.S.-based</strong> — primarily remote, with local and regional on-site work when a project calls for it. You&apos;ll need a <strong>Windows computer</strong> with a <strong>dual-monitor</strong> setup, a <strong>wired Ethernet</strong> connection (not Wi-Fi only), and a <strong>smartphone and/or tablet</strong> that can run apps (the Creative Specialist role additionally requires a Mac laptop). Because we handle client data, every role also meets standard security basics &mdash; antivirus and an updated, encrypted Windows, 2FA on work accounts, a secured home network, and a signed confidentiality agreement &mdash; and consents to a background check.
      </p>

      {/* Open roles */}
      <section className="mt-12">
        <h2 className="font-fraunces text-[26px] text-forest">Open roles</h2>
        <span className="rule-gold mb-6 mt-2 block" />
        {jobs.length === 0 ? (
          <p className="max-w-[46em] text-[15px] prose-muted">No specific openings posted right now — but we&apos;re always glad to meet capable people. Send a general application below.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((j) => (
              <Link key={j.slug} href={`/careers/${j.slug}`} className="group flex flex-col gap-2 border border-line-warm bg-white p-6 transition-colors hover:border-forest">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-fraunces text-[22px] text-forest">{j.title}</h3>
                  <span className="text-[12px] uppercase tracking-wide text-ink-faint">{j.type}</span>
                </div>
                <p className="text-[13px] prose-muted">{j.location}</p>
                <p className="text-[14.5px] prose-soft">{j.summary}</p>
                <p className="mt-1 text-[13px] font-medium text-charcoal">{j.pay}</p>
                <span className="mt-2 text-[14px] font-semibold text-forest group-hover:underline">View role &amp; apply →</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* General application */}
      <section className="mt-14">
        <h2 className="font-fraunces text-[26px] text-forest">Don&apos;t see your role? Apply anyway.</h2>
        <p className="mb-6 mt-1 max-w-[46em] text-[15px] prose-muted">Fields marked with * are required. Requirements vary by role — some ask for a résumé, a portfolio URL, or specific work samples — and the application shows what applies once you choose a position. Applying from a role page carries that position in automatically.</p>
        <div className="max-w-[52em]">
          <ApplicationForm />
        </div>
      </section>
    </div>
  );
}
