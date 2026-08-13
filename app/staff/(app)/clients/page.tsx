import { redirect } from "next/navigation";
import { getStaffMember, getClients } from "@/lib/staff";

export default async function ClientsPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  const clients = await getClients();
  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="font-fraunces text-[32px] font-normal text-forest">All clients</h1><span className="rule-gold mb-4 mt-2" /><p className="text-[14px] prose-muted">Ownership (the owning role) is set by an admin from the Admin tab. No access codes or passwords are shown anywhere in the staff area.</p></div>
      {clients.length === 0 ? <p className="text-[15px] prose-muted">No clients yet.</p> : (
        <div className="overflow-x-auto border border-line-warm">
          <table className="w-full min-w-[720px] border-collapse bg-white text-left text-[14px]">
            <thead><tr className="border-b border-line-soft text-ink-faint"><th className="p-3 font-medium">Business</th><th className="p-3 font-medium">Contact</th><th className="p-3 font-medium">Phone</th><th className="p-3 font-medium">Owner (role)</th><th className="p-3 font-medium">Status</th></tr></thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-line-soft/60">
                  <td className="p-3 font-medium text-charcoal">{c.business || "—"}</td>
                  <td className="p-3 prose-soft">{c.contact || "—"}</td>
                  <td className="p-3 prose-muted">{c.phone || "—"}</td>
                  <td className="p-3"><span className={c.assigned_to ? "text-forest" : "text-ink-faint"}>{c.assigned_to || "Unassigned"}</span></td>
                  <td className="p-3 prose-muted">{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
