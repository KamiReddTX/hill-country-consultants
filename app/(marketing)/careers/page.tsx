import type { Metadata } from "next";
import { ApplicationForm } from "@/components/careers/application-form";

export const metadata: Metadata = {
  title: "Careers — Employment Application · Hill Country Consultants",
  description: "Join Hill Country Consultants. Apply to work with a coordinated business-support firm across operations, creative, production, and specialty services. Remote-friendly, Eastern time.",
};

const WHY = [
  { t: "One firm, many crafts", d: "Work alongside specialists across operations, marketing, publishing, media, web, and more — real variety, real coordination." },
  { t: "Remote-friendly", d: "We serve clients nationwide and work virtually, on Eastern-time business hours, with on-site work only when a project calls for it." },
  { t: "Clear systems", d: "Task boards, checklists, weekly reporting, and a shared portal mean you always know what's expected and where work stands." },
];

export default function CareersPage() {
  return (
    <div className="shell py-14">
      <div className="max-w-[46em]">
        <p className="kicker">Careers at Hill Country Consultants</p>
        <h1 className="mt-2 font-fraunces text-[40px] leading-[1.1] text-forest">Do a whole firm&apos;s worth of work — with a team behind you.</h1>
        <span className="rule-gold mb-5 mt-4 block" />
        <p className="text-[17px] leading-relaxed prose-soft">
          We&apos;re a coordinated business-support firm: virtual assistance and admin, documentation and compliance,
          marketing and design, publishing, media, web, and specialty services — all under one roof. We&apos;re always
          glad to meet capable, reliable people who take ownership of their work. Tell us what you do best.
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

      <section className="mt-12">
        <h2 className="font-fraunces text-[26px] text-forest">Employment application</h2>
        <p className="mb-6 mt-1 max-w-[46em] text-[15px] prose-muted">Fields marked with * are required. A résumé helps but isn&apos;t required to apply.</p>
        <div className="max-w-[52em]">
          <ApplicationForm />
        </div>
      </section>
    </div>
  );
}
