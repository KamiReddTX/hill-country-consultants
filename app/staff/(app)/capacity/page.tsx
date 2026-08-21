import { redirect } from "next/navigation";
import { getStaffMember, isPrivileged, getClients, getDirectory } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase/server";
import { allotmentFor } from "@/content/pricing";
import { CapacityEditor } from "@/components/staff/capacity-editor";
import { TimeOffDecision } from "@/components/staff/time-off-actions";

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
  const [directory, clients, { data: workLog }, { data: assignments }, { data: timeOff }] = await Promise.all([
    getDirectory(),
    getClients(),
    admin.from("client_work_log").select("performed_by, hours, worked_on").gte("worked_on", cutoff),
    admin.from("client_assignments").select("client_id, staff_id"),
    admin.from("time_off_requests").select("*").in("status", ["pending", "approved"]),
  ]);

  // Approved time off overlapping the next 7 days reduces effective capacity.
  const today = new Date();
  const window: string[] = Array.from({ length: 7 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() + i); return d.toISOString().slice(0, 10); });
  const offDaysByStaff = new Map<string, number>();
  for (const t of timeOff ?? []) {
    if ((t as any).status !== "approved") continue;
    const sid = (t as any).staff_id; const s = (t as any).start_date; const e = (t as any).end_date;
    const days = window.filter((d) => d >= s && d <= e).length;
    if (days) offDaysByStaff.set(sid, (offDaysByStaff.get(sid) || 0) + days);
  }
  const nameById = new Map(directory.map((s) => [s.id, s.name || s.email]));
  const pendingTimeOff = (timeOff ?? []).filter((t) => (t as any).status === "pending");
  const fmtDay = (iso: string) => new Date(`${String(iso).slice(0, 10)}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

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
      const offHours = (offDaysByStaff.get(s.id) || 0) * (cap / 5); // days off × daily hours
      const effective = Math.max(0, cap - offHours);
      const logged = loggedByStaff.get(s.id) || 0;
      const util = effective > 0 ? Math.round((logged / effective) * 100) : 0;
      const committed = committedWeekly(s.id);
      return { s, cap, offHours, effective, logged, util, committed, headroom: effective - logged };
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

      {pendingTimeOff.length > 0 && (
        <section className="border-2 border-gold bg-cream/40 p-4">
          <p className="mb-2 text-[14px] font-semibold text-forest">Time-off requests awaiting your decision</p>
          <ul className="flex flex-col gap-2">
            {pendingTimeOff.map((t: any) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-2 text-[14px]">
                <span className="text-charcoal">
                  <span className="font-medium">{nameById.get(t.staff_id) || "—"}</span> · {t.kind} · {fmtDay(t.start_date)}{t.end_date !== t.start_date && ` – ${fmtDay(t.end_date)}`}
                  {t.note && <span className="prose-muted"> · {t.note}</span>}
                </span>
                <TimeOffDecision id={t.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="overflow-x-auto border border-line-warm">
        <table className="w-full min-w-[900px] border-collapse bg-white text-left text-[14px]">
          <thead>
            <tr className="border-b border-line-soft text-ink-faint">
              <th className="p-3 font-medium">Staffer</th><th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium">Weekly target</th><th className="p-3 font-medium">Off this wk</th><th className="p-3 font-medium">Logged this week</th>
              <th className="p-3 font-medium">Utilization</th><th className="p-3 font-medium">Headroom</th>
              <th className="p-3 font-medium">Committed VA/wk</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ s, cap, offHours, logged, util, committed, headroom }) => (
              <tr key={s.id} className="border-b border-line-soft/60">
                <td className="p-3 font-medium text-charcoal">{s.name || s.email}</td>
                <td className="p-3 prose-muted">{(s.roles && s.roles.length ? s.roles.join(", ") : s.role)}</td>
                <td className="p-3"><CapacityEditor staffId={s.id} current={cap} /></td>
                <td className={`p-3 tabular-nums ${offHours > 0 ? "text-amber-700" : "prose-muted"}`}>{offHours > 0 ? `${offHours.toFixed(1)}h` : "—"}</td>
                <td className="p-3 tabular-nums">{logged.toFixed(1)}h</td>
                <td className={`p-3 font-medium tabular-nums ${utilClass(util)}`}>{util}%</td>
                <td className={`p-3 tabular-nums ${headroom < 0 ? "text-red-700" : "text-charcoal"}`}>{headroom.toFixed(1)}h</td>
                <td className="p-3 tabular-nums prose-soft">{committed >= 0.05 ? `${committed.toFixed(1)}h` : "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} className="p-3 prose-muted">No staff to show.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-[12px] prose-muted">Utilization turns amber at 85% and red at/over 100%. Committed VA/wk counts only VA-hour allotments on plan accounts — one-off and non-VA work isn&rsquo;t included.</p>
    </div>
  );
}
