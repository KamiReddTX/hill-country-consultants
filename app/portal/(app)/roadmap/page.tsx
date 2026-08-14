import { redirect } from "next/navigation";
import { getPortalClient, getClientRoadmap, ROADMAP_FRAMEWORK } from "@/lib/portal";
import { SITE } from "@/content/site";

const STATUS_STYLE: Record<string, string> = {
  "Complete": "border-forest bg-forest text-white",
  "In progress": "border-gold bg-gold/15 text-forest",
  "Not started": "border-line-warm bg-white text-ink-faint",
};

export default async function RoadmapPage() {
  const client = await getPortalClient();
  if (!client) redirect("/portal/login");

  const rows = await getClientRoadmap(client.id);
  const byPhase = new Map(rows.map((r) => [r.phase, r]));
  const phases = ROADMAP_FRAMEWORK.map((p) => ({
    ...p,
    status: byPhase.get(p.key)?.status || "Not started",
    note: byPhase.get(p.key)?.note || "",
  }));
  const done = phases.filter((p) => p.status === "Complete").length;
  const pct = Math.round((done / phases.length) * 100);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Your 30-day roadmap</h1>
        <span className="rule-gold mb-4 mt-2" />
        <p className="max-w-[48em] prose-soft">
          Your account team updates each phase as the work moves. Day 30 is your first full review — book it
          from the last step whenever you&apos;re ready.
        </p>
        <div className="mt-5 max-w-md">
          <div className="flex justify-between text-[13px] prose-muted"><span>Progress</span><span>{done} of {phases.length} phases complete</span></div>
          <div className="mt-1 h-1.5 w-full bg-line-soft"><div className="h-1.5 bg-gold" style={{ width: `${pct}%` }} /></div>
        </div>
      </div>

      <ol className="flex flex-col gap-3">
        {phases.map((r) => (
          <li key={r.key} className="grid gap-2 border border-line-warm bg-white p-5 sm:grid-cols-[120px_1fr_auto] sm:items-start">
            <p className="kicker sm:pt-1">{r.window}</p>
            <div>
              <p className="font-medium text-charcoal">{r.t}</p>
              <p className="text-[14px] prose-soft">{r.d}</p>
              {r.note && <p className="mt-1 text-[14px] text-forest">{r.note}</p>}
              {r.key === "review" && (
                <a href={SITE.reviewUrl} target="_blank" rel="noopener noreferrer" className="btn-gold mt-3 inline-block text-[14px]">
                  Schedule your 30-day review
                </a>
              )}
            </div>
            <span className={`justify-self-start rounded-full border px-2.5 py-0.5 text-[12px] font-semibold sm:justify-self-end ${STATUS_STYLE[r.status] || STATUS_STYLE["Not started"]}`}>
              {r.status}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
