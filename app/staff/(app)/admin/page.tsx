import { redirect } from "next/navigation";
import { getStaffMember, isAdmin, getDirectory, getClients, getBookings, getOnTheClock, periodOf, usd } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { AssignSelect } from "@/components/staff/assign-select";
import { StatusSelect } from "@/components/staff/status-select";
import { AddStaffForm } from "@/components/staff/add-staff-form";
import { ForceClockOutButton } from "@/components/staff/force-clockout-button";
import { ApproveButton } from "@/components/staff/approve-button";
import { PrintButton } from "@/components/staff/print-button";
import { money } from "@/lib/portal";

export default async function AdminPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isAdmin(me)) return <p className="text-[15px] prose-muted">The Admin tab is for administrators only.</p>;

  const [directory, clients, bookings, onClock] = await Promise.all([getDirectory(), getClients(), getBookings(), getOnTheClock()]);
  const staffName = new Map(directory.map((s) => [s.id, s.name || s.email]));
  const period = periodOf(0);

  const db = createClient();
  const [{ data: periodPunches }, { data: approvals }] = await Promise.all([
    db.from("punches").select("*").gte("started_at", period.startISO).lte("started_at", period.endISO + "T23:59:59Z"),
    db.from("timesheet_approvals").select("*").eq("period_start", period.startISO),
  ]);
  const hoursByStaff = new Map<string, number>();
  (periodPunches ?? []).forEach((p) => hoursByStaff.set(p.staff_id, (hoursByStaff.get(p.staff_id) || 0) + Number(p.hours || 0)));
  const approvedSet = new Set((approvals ?? []).map((a) => a.staff_id));

  return (
    <div className="flex flex-col gap-12">
      <div><h1 className="font-fraunces text-[32px] font-normal text-forest">Admin</h1><span className="rule-gold mb-2 mt-2" /><p className="text-[13px] prose-muted">Administrators only.</p></div>

      {/* On the clock now */}
      <section>
        <h2 className="mb-3 font-fraunces text-[22px] font-medium text-forest">On the clock now</h2>
        {onClock.length === 0 ? <p className="text-[15px] prose-muted">Nobody is clocked in.</p> : (
          <ul className="flex flex-col gap-2">
            {onClock.map((p) => {
              const el = (Date.now() - new Date(p.started_at).getTime()) / 3600000;
              return (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 border border-line-warm bg-white p-4">
                  <div><p className="font-medium text-charcoal">{staffName.get(p.staff_id) || "Unknown"}</p>
                    <p className="text-[13px] prose-muted">Since {new Date(p.started_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · ~{el.toFixed(1)}h{el > 4 ? " · over 4h" : ""}{p.note ? ` · ${p.note}` : ""}</p></div>
                  <ForceClockOutButton punchId={p.id} startedAt={p.started_at} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Timesheets */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-fraunces text-[22px] font-medium text-forest">Timesheets · {period.label}</h2>
          <PrintButton label="Print timesheets" />
        </div>
        <div className="mt-3 overflow-x-auto border border-line-warm">
          <table className="w-full min-w-[640px] border-collapse bg-white text-left text-[14px]">
            <thead><tr className="border-b border-line-soft text-ink-faint"><th className="p-3 font-medium">Staff</th><th className="p-3 font-medium">Role</th><th className="p-3 font-medium text-right">Hours</th><th className="p-3 font-medium text-right">Gross</th><th className="p-3 font-medium">Approve</th></tr></thead>
            <tbody>
              {directory.filter((s) => s.hourly).map((s) => {
                const h = hoursByStaff.get(s.id) || 0;
                return (
                  <tr key={s.id} className="border-b border-line-soft/60">
                    <td className="p-3 font-medium text-charcoal">{s.name || s.email}</td>
                    <td className="p-3 prose-muted">{s.role}</td>
                    <td className="p-3 text-right tabular-nums">{h.toFixed(1)}</td>
                    <td className="p-3 text-right tabular-nums">{usd(h * Number(s.rate || 0))}</td>
                    <td className="p-3"><ApproveButton staffId={s.id} periodStart={period.startISO} periodEnd={period.endISO} approved={approvedSet.has(s.id)} /></td>
                  </tr>
                );
              })}
              {directory.filter((s) => s.hourly).length === 0 && <tr><td colSpan={5} className="p-3 prose-muted">No hourly staff yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* Staff directory */}
      <section>
        <h2 className="mb-3 font-fraunces text-[22px] font-medium text-forest">Staff directory</h2>
        <div className="mb-4"><AddStaffForm /></div>
        <div className="overflow-x-auto border border-line-warm">
          <table className="w-full min-w-[720px] border-collapse bg-white text-left text-[14px]">
            <thead><tr className="border-b border-line-soft text-ink-faint"><th className="p-3 font-medium">Name</th><th className="p-3 font-medium">Email</th><th className="p-3 font-medium">Role</th><th className="p-3 font-medium">Code</th><th className="p-3 font-medium text-right">Rate</th><th className="p-3 font-medium">Hourly</th><th className="p-3 font-medium">Active</th></tr></thead>
            <tbody>
              {directory.map((s) => (
                <tr key={s.id} className="border-b border-line-soft/60">
                  <td className="p-3 font-medium text-charcoal">{s.name || "—"}</td><td className="p-3 prose-muted">{s.email}</td>
                  <td className="p-3 prose-soft">{s.role}</td><td className="p-3 prose-muted">{s.employee_code || "—"}</td>
                  <td className="p-3 text-right tabular-nums">{s.hourly ? usd(Number(s.rate || 0)) : "—"}</td>
                  <td className="p-3">{s.hourly ? "Yes" : "No"}</td><td className="p-3">{s.active ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Client access & assignment */}
      <section>
        <h2 className="mb-1 font-fraunces text-[22px] font-medium text-forest">Client access &amp; assignment</h2>
        <p className="mb-3 text-[13px] prose-muted">Ownership is a role. Setting it here clears the client from the unassigned queue everywhere. No passwords or access codes are stored or shown.</p>
        <div className="overflow-x-auto border border-line-warm">
          <table className="w-full min-w-[760px] border-collapse bg-white text-left text-[14px]">
            <thead><tr className="border-b border-line-soft text-ink-faint"><th className="p-3 font-medium">Business</th><th className="p-3 font-medium">Contact</th><th className="p-3 font-medium w-56">Owner (role)</th><th className="p-3 font-medium w-40">Status</th><th className="p-3 font-medium">Rep</th></tr></thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-line-soft/60">
                  <td className="p-3 font-medium text-charcoal">{c.business || "—"}</td>
                  <td className="p-3 prose-muted">{c.contact || "—"}<br /><span className="text-[12px]">{c.email}</span></td>
                  <td className="p-3"><AssignSelect clientId={c.id} current={c.assigned_to} /></td>
                  <td className="p-3"><StatusSelect clientId={c.id} current={c.status} /></td>
                  <td className="p-3 prose-muted">{c.rep_code || "—"}</td>
                </tr>
              ))}
              {clients.length === 0 && <tr><td colSpan={5} className="p-3 prose-muted">No clients yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* All bookings */}
      <section>
        <h2 className="mb-3 font-fraunces text-[22px] font-medium text-forest">All bookings</h2>
        {bookings.length === 0 ? <p className="text-[15px] prose-muted">No bookings yet.</p> : (
          <ul className="flex flex-col gap-2">
            {bookings.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 border border-line-warm bg-white p-4">
                <div><p className="font-medium text-charcoal">{b.ref} · {money(b.paid_cents)} <span className="text-[12px] text-ink-faint">({b.pay_mode})</span></p>
                  <p className="text-[13px] prose-muted">Start {b.start_date || "TBC"}{b.class_name ? ` · ${b.class_name}` : ""} · {(b.items || []).length} item(s)</p>
                  {b.consent_at && <p className="text-[11px] text-ink-faint">Consent {new Date(b.consent_at).toLocaleDateString()} · IP {b.consent_ip || "—"}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
