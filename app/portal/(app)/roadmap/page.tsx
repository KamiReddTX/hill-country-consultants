import { redirect } from "next/navigation";
import { getPortalClient } from "@/lib/portal";

const FRAMEWORK = [
  { window: "Days 1–5", t: "Onboarding complete", d: "Kickoff call, credential handoff through the vault, task board live, channels and file structure built." },
  { window: "Days 5–10", t: "Document baseline", d: "We inventory what exists — capabilities statement, certifications, insurance, SOPs — and list what is missing or expired." },
  { window: "Days 10–20", t: "First deliverables", d: "Highest-pain work first, against your tier allotment. Every item runs its pre-delivery review before it reaches you." },
  { window: "Days 15–25", t: "Systems and templates", d: "Naming convention, folder structure, intake forms and reusable templates so the work holds after we hand it back." },
  { window: "Day 30", t: "First full review", d: "What we delivered, what is in flight, what capacity went unused, and what we recommend for the next thirty days." },
];

export default async function RoadmapPage() {
  const client = await getPortalClient();
  if (!client) redirect("/portal/login");
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Your 30-day roadmap</h1>
        <span className="rule-gold mb-4 mt-2" />
        <p className="max-w-[48em] prose-soft">
          Your specific roadmap is confirmed on your kickoff call and appears here with real dates and status.
          Until then, here is how the first thirty days typically run — nothing below is marked complete.
        </p>
      </div>
      <ol className="flex flex-col gap-3">
        {FRAMEWORK.map((r) => (
          <li key={r.t} className="grid gap-2 border border-line-warm bg-white p-5 sm:grid-cols-[120px_1fr_auto] sm:items-center">
            <p className="kicker">{r.window}</p>
            <div><p className="font-medium text-charcoal">{r.t}</p><p className="text-[14px] prose-soft">{r.d}</p></div>
            <span className="text-[12px] font-semibold text-ink-faint">Confirmed after kickoff</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
