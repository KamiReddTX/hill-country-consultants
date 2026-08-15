import { redirect } from "next/navigation";
import { getStaffMember, getClients } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { GenerateReportForm } from "@/components/staff/generate-report-form";

export default async function StaffWeeklyPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  const clients = await getClients();
  const byId = new Map(clients.map((c) => [c.id, c]));
  const name = (cid: string) => byId.get(cid)?.business || byId.get(cid)?.contact || byId.get(cid)?.email || "Client";
  const clientOpts = clients.map((c) => ({ id: c.id, label: c.business || c.contact || c.email }));
  const ids = clients.map((c) => c.id);

  const db = createClient();
  const { data: reports } = ids.length
    ? await db.from("client_reports").select("id,client_id,name,created_at").in("client_id", ids).order("created_at", { ascending: false }).limit(100)
    : { data: [] as any[] };
  const rows = (reports ?? []) as any[];

  return (
    <div className="flex flex-col gap-8">
      <div><h1 className="font-fraunces text-[32px] font-normal text-forest">Weekly report</h1><span className="rule-gold mb-4 mt-2" /><p className="max-w-[48em] prose-soft">Generate this week&apos;s report for a client (last 7 days of approved hours + deliverables) and publish it to their portal. You can only run it for the clients you&apos;re on.</p></div>

      <section>
        <h2 className="mb-3 font-fraunces text-[20px] font-medium text-forest">Generate a report</h2>
        {clientOpts.length === 0 ? <p className="text-[15px] prose-muted">No clients assigned to you yet.</p> : <GenerateReportForm clients={clientOpts} />}
      </section>

      <section>
        <h2 className="mb-3 font-fraunces text-[20px] font-medium text-forest">Published reports</h2>
        {rows.length === 0 ? <p className="text-[15px] prose-muted">No reports published yet.</p> : (
          <ul className="flex flex-col gap-2">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 border border-line-warm bg-white p-4">
                <div><p className="font-medium text-charcoal">{name(r.client_id)}</p><p className="text-[12px] prose-muted">{r.name} · published {new Date(r.created_at).toLocaleDateString()}</p></div>
                <a href={`/api/client-report/${r.id}`} className="link-underline text-[13px]">Open</a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
