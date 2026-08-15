import { redirect } from "next/navigation";
import { getStaffMember, isSalesOrAdmin, isPrivileged, getClients, getStaffOptions } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { AccountTeam } from "@/components/staff/account-team";

export default async function AccountsPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isSalesOrAdmin(me)) return <p className="text-[15px] prose-muted">Accounts is for sales and admins.</p>;

  const [clients, staffOptions] = await Promise.all([getClients(), getStaffOptions()]);
  const code = (s: string | null | undefined) => (s ?? "").trim().toUpperCase();
  const mine = clients.filter((c) => isPrivileged(me) || (!!me.employee_code && code(c.rep_code) === code(me.employee_code)) || c.assigned_to === me.id);

  // Team members for these accounts (RLS lets me read assignments on accounts I can reach).
  const staffLabel = new Map(staffOptions.map((s) => [s.id, s.label]));
  const ids = mine.map((c) => c.id);
  const db = createClient();
  const { data: assignments } = ids.length ? await db.from("client_assignments").select("*").in("client_id", ids) : { data: [] as any[] };
  const teamByClient = new Map<string, { id: string; staffId: string; label: string }[]>();
  (assignments ?? []).forEach((a: any) => {
    const arr = teamByClient.get(a.client_id) || [];
    arr.push({ id: a.id, staffId: a.staff_id, label: staffLabel.get(a.staff_id) || "Staff" });
    teamByClient.set(a.client_id, arr);
  });
  const owns = (c: any) => isPrivileged(me) || c.assigned_to === me.id;

  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="font-fraunces text-[32px] font-normal text-forest">Accounts</h1><span className="rule-gold mb-4 mt-2" /><p className="text-[14px] prose-muted">Clients you own or carry the rep code for. On accounts you own, add specialists to the team so they can do their part.</p></div>
      {mine.length === 0 ? <p className="text-[15px] prose-muted">No accounts yet. Convert a won lead in the Pipeline.</p> : (
        <ul className="grid gap-3 md:grid-cols-2">
          {mine.map((c) => (
            <li key={c.id} className="border border-line-warm bg-white p-4">
              <p className="font-medium text-charcoal">{c.business || c.contact || c.email}</p>
              <p className="text-[13px] prose-muted">{c.contact || "—"}{c.phone ? ` · ${c.phone}` : ""}</p>
              <p className="mt-1 text-[12px] text-ink-faint">Since {c.created_at?.slice(0, 10)} · {c.status} · rep {c.rep_code || "—"}</p>
              {owns(c) ? (
                <div className="mt-2"><p className="text-[12px] font-semibold text-forest">Team</p>
                  <AccountTeam clientId={c.id} members={teamByClient.get(c.id) || []} options={staffOptions} /></div>
              ) : (
                (teamByClient.get(c.id) || []).length > 0 && (
                  <p className="mt-2 text-[12px] prose-muted">Team: {(teamByClient.get(c.id) || []).map((m) => m.label).join(", ")}</p>
                )
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
