import { redirect } from "next/navigation";
import { getStaffMember, isSalesOrAdmin, getClients } from "@/lib/staff";

function monthsSince(dateISO: string | null): number {
  if (!dateISO) return 0;
  const d = new Date(dateISO), now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
}

export default async function CommissionsPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isSalesOrAdmin(me)) return <p className="text-[15px] prose-muted">Commissions is for sales and admins.</p>;
  const clients = await getClients();
  const mine = me.employee_code ? clients.filter((c) => c.rep_code === me.employee_code) : [];

  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="font-fraunces text-[32px] font-normal text-forest">Commission tracking</h1><span className="rule-gold mb-4 mt-2" /></div>
      <p className="border-l-2 border-gold bg-cream px-4 py-3 text-[15px] text-charcoal">
        This statement is read-only. Hours and closes are set by an administrator from the sales report. Commission is paid
        only after a client has been retained three months — an administrator releases it. You cannot edit these inputs.
      </p>
      <section>
        <h2 className="mb-3 font-fraunces text-[20px] font-medium text-forest">Retention</h2>
        {mine.length === 0 ? <p className="text-[15px] prose-muted">No attributed clients yet.</p> : (
          <div className="overflow-x-auto border border-line-warm">
            <table className="w-full min-w-[560px] border-collapse bg-white text-left text-[14px]">
              <thead><tr className="border-b border-line-soft text-ink-faint"><th className="p-3 font-medium">Client</th><th className="p-3 font-medium">Retained since</th><th className="p-3 font-medium">Tenure</th><th className="p-3 font-medium">Commission status</th></tr></thead>
              <tbody>
                {mine.map((c) => {
                  const m = monthsSince(c.retained_since);
                  const eligible = m >= 3;
                  return (
                    <tr key={c.id} className="border-b border-line-soft/60">
                      <td className="p-3 font-medium text-charcoal">{c.business || c.contact || c.email}</td>
                      <td className="p-3 prose-muted">{c.retained_since || "—"}</td>
                      <td className="p-3 prose-muted">{m} mo</td>
                      <td className="p-3">{eligible ? <span className="font-semibold text-forest">Eligible — awaiting admin release</span> : <span className="text-ink-faint">Building tenure ({Math.min(m, 3)}/3 months)</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
