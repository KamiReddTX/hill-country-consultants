import { redirect } from "next/navigation";
import { getStaffMember, isSalesOrAdmin, getClients, isPrivileged } from "@/lib/staff";

export default async function FollowUpsPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isSalesOrAdmin(me)) return <p className="text-[15px] prose-muted">Follow-ups is for sales and admins.</p>;
  const clients = await getClients();
  const code = (s: string | null | undefined) => (s ?? "").trim().toUpperCase();
  const mine = clients.filter((c) => isPrivileged(me) || (!!me.employee_code && code(c.rep_code) === code(me.employee_code)) || c.assigned_to === me.id);

  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="font-fraunces text-[32px] font-normal text-forest">Follow-ups</h1><span className="rule-gold mb-4 mt-2" /><p className="text-[14px] prose-muted">Only clients carrying your employee code, or owned by your role.</p></div>
      {mine.length === 0 ? <p className="text-[15px] prose-muted">No follow-ups assigned to you.</p> : (
        <ul className="flex flex-col gap-2">
          {mine.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 border border-line-warm bg-white p-4">
              <div><p className="font-medium text-charcoal">{c.business || c.contact || c.email}</p>
                <p className="text-[13px] prose-muted">{c.contact || "—"}{c.phone ? ` · ${c.phone}` : ""} · {c.status}</p></div>
              <a href={`mailto:${c.email}`} className="link-underline text-[13px]">Email</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
