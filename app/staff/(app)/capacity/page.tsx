import { redirect } from "next/navigation";
import { getStaffMember, isPrivileged, getClients, getDirectory } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase/server";
import { allotmentFor } from "@/content/pricing";
import { CapacityEditor } from "@/components/staff/capacity-editor";

export const dynamic = "force-dynamic";

/** Capacity & utilization — logged hours vs. each staffer's weekly target
 *  (actuals) alongside the committed VA-allotment load of their accounts.
 *  Admin / Business Manager. */
export default async function CapacityPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isPrivileged(me)) redirect("/staff");

  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const cutoff = weekAgo.toISOString().slice(0, 10);

  const admin = createServiceClient();
  const [directory, clients, { data: workLog }, { data: assignments }] = await Promise.all([
    getDirectory(),
    getClients(),
    admin.from("client_work_log").select("performed_by, hours, worked_on").gte("worked_on", cutoff),
    admin.from("client_assignments").select("client_id, staff_id"),
  ]);

  // Logged hours this week, per staffer.
  const loggedByStaff = new Map<string, number>();
  for (const w of workLog ?? []) {
    const id = (w as any).performed_by;
    if (!id) continue;
    loggedByStaff.set(id, (loggedByStaff.get(id) || 0) + Number((w as any).hours || 0));
  }

  // Committed weekly VA load: sum the VA allotment of each staffer's accounts
  // (owner or team member), converted from monthly to weekly.
  const planByClient = new Map(clients.map((c) => [c.id, (c as any).plan as string | null]));
  const clientsByStaff = new Map<string, Set<string>>();
  const add = (staffId: string, clientId: string) => {
    if (!staffId) return;
    const s = clientsByStaff.get(staffId) || new Set<string>();
    s.add(clientId); clientsByStaff.set(staffId, s);
  };
  for (const c of clients) if (c.assigned_to) add(c.assigned_to, c.id);
  for (const a of assignments ?? []) add((a as any).staff_id, (a as any).client_id);

  const committedWeekly = (staffId: string) => {
    const set = clientsByStaff.get(staffId);
    if (!set) return 0;
    let monthly = 0;
    for (const cid of set) monthly += allotmentFor(planByClient.get(cid), "va_hours") || 0;
    return monthly / 4.33; // monthly → weekly
  };

  const rows = directory
    .filter((s) => s.active !== false)
    .map((s) => {
      const cap = Number((s as any).weekly_capacity_hours ?? 40);
      const logged = loggedByStaff.get(s.id) || 0;
      const util = cap > 0 ? Math.round((logged / cap) * 100) : 0;
      const committed = committedWeekly(s.id);
      return { s, cap, logged, util, committed, headroom: cap - logged };
    })
    .sort((a, b) => b.util - a.util);

  const utilClass = (u: number) => (u >= 100 ? "text-red-700" : u >= 85 ? "text-amber-700" : "text-forest");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Capacity &amp; utilization</h1>
        <span className="rule-gold mb-2 mt-2" />
        <p className="max-w-[58em] text-[13px] prose-muted">
          Two reads on each person&rsquo;s load. <span className="font-medium">Logged this week</span> is the actual work-log hours they
          recorded in the last 7 days against their weekly target (utilization). <span className="font-medium">Committed VA/wk</span> is
          the recurring VA-hour allotment of the accounts they own or sit on, converted to a weekly figure — a forward look at the load
          they&rsquo;ve signed up for regardless of what&rsquo;s been logged yet. Set each target inline. Admin / Business Manager.
        </p>
      </div>

      <div className="overflow-x-auto border border-line-warm">
        <table className="w-full min-w-[820px] border-collapse bg-white text-left text-[14px]">
          <thead>
            <tr className="border-b border-line-soft text-ink-faint">
              <th className="p-3 font-medium">Staffer</th><th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium">Weekly target</th><th className="p-3 font-medium">Logged this week</th>
              <th className="p-3 font-medium">Utilization</th><th className="p-3 font-medium">Headroom</th>
              <th className="p-3 font-medium">Committed VA/wk</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ s, cap, logged, util, committed, headroom }) => (
              <tr key={s.id} className="border-b border-line-soft/60">
                <td className="p-3 font-medium text-charcoal">{s.name || s.email}</td>
                <td className="p-3 prose-muted">{(s.roles && s.roles.length ? s.roles.join(", ") : s.role)}</td>
                <td className="p-3"><CapacityEditor staffId={s.id} current={cap} /></td>
                <td className="p-3 tabular-nums">{logged.toFixed(1)}h</td>
                <td className={`p-3 font-medium tabular-nums ${utilClass(util)}`}>{util}%</td>
                <td className={`p-3 tabular-nums ${headroom < 0 ? "text-red-700" : "text-charcoal"}`}>{headroom.toFixed(1)}h</td>
                <td className="p-3 tabular-nums prose-soft">{committed >= 0.05 ? `${committed.toFixed(1)}h` : "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="p-3 prose-muted">No staff to show.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-[12px] prose-muted">Utilization turns amber at 85% and red at/over 100%. Committed VA/wk counts only VA-hour allotments on plan accounts — one-off and non-VA work isn&rsquo;t included.</p>
    </div>
  );
}
