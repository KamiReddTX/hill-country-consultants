import { redirect } from "next/navigation";
import Link from "next/link";
import { getStaffMember, isSalesOrAdmin, getLeads } from "@/lib/staff";
import { LeadActions } from "@/components/staff/lead-actions";

const STAGES = ["New lead", "Contacted", "Qualified", "Proposal", "Closed won", "Closed lost"];

export default async function PipelinePage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isSalesOrAdmin(me)) return <p className="text-[15px] prose-muted">The pipeline is for sales and admins.</p>;
  const leads = await getLeads();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="font-fraunces text-[32px] font-normal text-forest">Pipeline</h1><span className="rule-gold mt-2" /></div>
        <Link href="/staff/intake" className="btn-gold px-5 text-[14px]">Add a lead</Link>
      </div>
      {leads.length === 0 ? (
        <p className="border border-dashed border-line-warm bg-white p-6 text-[15px] prose-muted">No leads yet. <Link href="/staff/intake" className="link-underline">Add your first lead.</Link></p>
      ) : (
        <div className="flex flex-col gap-6">
          {STAGES.map((stage) => {
            const inStage = leads.filter((l) => (l.stage || "New lead") === stage);
            if (inStage.length === 0) return null;
            return (
              <section key={stage}>
                <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-forest">{stage} · {inStage.length}</h2>
                <ul className="flex flex-col gap-2">
                  {inStage.map((l) => (
                    <li key={l.id} className="border border-line-warm bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div><p className="font-medium text-charcoal">{l.business || "—"}</p>
                          <p className="text-[13px] prose-muted">{l.contact || "—"}{l.email ? ` · ${l.email}` : ""}{l.phone ? ` · ${l.phone}` : ""}</p>
                          <p className="text-[12px] text-ink-faint">{l.industry || "—"}{l.tier ? ` · ${l.tier}` : ""} · rep {l.rep_code || "—"}</p>
                          {l.pain && <p className="mt-1 text-[13px] prose-soft">{l.pain}</p>}
                        </div>
                        <LeadActions leadId={l.id} stage={l.stage} hasEmail={!!l.email} />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
