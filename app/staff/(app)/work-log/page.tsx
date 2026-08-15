import { redirect } from "next/navigation";
import { getStaffMember, getClients } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { LogWorkForm } from "@/components/staff/log-work-form";

export default async function StaffWorkLogPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  const clients = await getClients();
  const byId = new Map(clients.map((c) => [c.id, c]));
  const name = (cid: string) => byId.get(cid)?.business || byId.get(cid)?.contact || byId.get(cid)?.email || "Client";
  const workable = clients.map((c) => ({ id: c.id, label: c.business || c.contact || c.email }));
  const ids = clients.map((c) => c.id);

  const db = createClient();
  const { data: log } = ids.length
    ? await db.from("client_work_log").select("*").in("client_id", ids).order("worked_on", { ascending: false }).limit(200)
    : { data: [] as any[] };
  const rows = (log ?? []) as any[];
  const total = rows.reduce((s, w) => s + Number(w.hours || 0), 0);
  const pending = rows.filter((w) => !w.approved).length;

  return (
    <div className="flex flex-col gap-8">
      <div><h1 className="font-fraunces text-[32px] font-normal text-forest">Work log</h1><span className="rule-gold mb-4 mt-2" /><p className="max-w-[48em] prose-soft">Log the hours you work by service line. An admin approves each entry before it appears on the client&apos;s Work Log and weekly report.</p></div>

      <section>
        <h2 className="mb-3 font-fraunces text-[20px] font-medium text-forest">Log work</h2>
        {workable.length === 0 ? <p className="text-[15px] prose-muted">No clients assigned to you yet.</p> : <LogWorkForm clients={workable} />}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap gap-6">
          <div><p className="kicker">Entries</p><p className="font-fraunces text-[24px] text-charcoal tabular-nums">{rows.length}</p></div>
          <div><p className="kicker">Total hours</p><p className="font-fraunces text-[24px] text-charcoal tabular-nums">{total.toFixed(1)}</p></div>
          <div><p className="kicker">Awaiting approval</p><p className="font-fraunces text-[24px] text-charcoal tabular-nums">{pending}</p></div>
        </div>
        {rows.length === 0 ? <p className="text-[15px] prose-muted">No entries yet.</p> : (
          <div className="overflow-x-auto border border-line-warm">
            <table className="w-full min-w-[720px] border-collapse bg-white text-left text-[14px]">
              <thead><tr className="border-b border-line-soft text-ink-faint"><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Client</th><th className="p-3 font-medium">Service</th><th className="p-3 font-medium">Task</th><th className="p-3 font-medium">By</th><th className="p-3 font-medium text-right">Hours</th><th className="p-3 font-medium">Status</th></tr></thead>
              <tbody>
                {rows.map((w) => (
                  <tr key={w.id} className="border-b border-line-soft/60">
                    <td className="p-3 prose-muted">{w.worked_on}</td>
                    <td className="p-3 text-charcoal">{name(w.client_id)}</td>
                    <td className="p-3 prose-soft">{w.service || "—"}</td>
                    <td className="p-3 prose-soft">{w.task || "—"}</td>
                    <td className="p-3 prose-muted">{w.performed_by || "—"}</td>
                    <td className="p-3 text-right tabular-nums">{Number(w.hours).toFixed(1)}</td>
                    <td className="p-3">{w.approved ? <span className="text-[12px] font-semibold text-forest">Approved</span> : <span className="text-[12px] text-ink-faint">Pending</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
