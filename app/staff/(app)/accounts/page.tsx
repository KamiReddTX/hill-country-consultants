import { redirect } from "next/navigation";
import { getStaffMember, isSalesOrAdmin, getClients, isPrivileged } from "@/lib/staff";

export default async function AccountsPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isSalesOrAdmin(me)) return <p className="text-[15px] prose-muted">Accounts is for sales and admins.</p>;
  const clients = await getClients();
  const code = (s: string | null | undefined) => (s ?? "").trim().toUpperCase();
  const mine = clients.filter((c) => isPrivileged(me) || (!!me.employee_code && code(c.rep_code) === code(me.employee_code)) || c.assigned_to === me.id);
  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="font-fraunces text-[32px] font-normal text-forest">Accounts</h1><span className="rule-gold mb-4 mt-2" /><p className="text-[14px] prose-muted">Clients carrying your employee code, or owned by your role.</p></div>
      {mine.length === 0 ? <p className="text-[15px] prose-muted">No accounts yet. Convert a won lead in the Pipeline.</p> : (
        <ul className="grid gap-3 md:grid-cols-2">
          {mine.map((c) => (
            <li key={c.id} className="border border-line-warm bg-white p-4">
              <p className="font-medium text-charcoal">{c.business || c.contact || c.email}</p>
              <p className="text-[13px] prose-muted">{c.contact || "—"}{c.phone ? ` · ${c.phone}` : ""}</p>
              <p className="mt-1 text-[12px] text-ink-faint">Since {c.created_at?.slice(0, 10)} · {c.status} · rep {c.rep_code || "—"}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
