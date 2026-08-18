import { redirect } from "next/navigation";
import { getStaffMember, isAdmin, getDirectory, getOnTheClock, periodOf, usd } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { ForceClockOutButton } from "@/components/staff/force-clockout-button";
import { ApproveButton } from "@/components/staff/approve-button";
import { PrintButton } from "@/components/staff/print-button";
import { PasswordResetForm } from "@/components/staff/password-reset-form";
import { StaffResetActions } from "@/components/staff/staff-reset-actions";
import { LocalTime } from "@/components/local-time";

/** Payroll & access — team-facing admin operations that used to live on the
 *  Admin tab: who's on the clock, timesheets/payroll, and password resets. */
export default async function PayrollPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isAdmin(me)) return <p className="text-[15px] prose-muted">Payroll is for administrators only.</p>;

  const [directory, onClock] = await Promise.all([getDirectory(), getOnTheClock()]);
  const staffName = new Map(directory.map((s) => [s.id, s.name || s.email]));
  const period = periodOf(0);

  const db = createClient();
  const [{ data: periodPunches }, { data: approvals }, { data: resetReqs }] = await Promise.all([
    db.from("punches").select("*").gte("started_at", period.startISO).lte("started_at", period.endISO + "T23:59:59Z"),
    db.from("timesheet_approvals").select("*").eq("period_start", period.startISO),
    db.from("staff_reset_requests").select("*").eq("status", "pending").order("requested_at", { ascending: false }),
  ]);
  const hoursByStaff = new Map<string, number>();
  (periodPunches ?? []).forEach((p) => hoursByStaff.set(p.staff_id, (hoursByStaff.get(p.staff_id) || 0) + Number(p.hours || 0)));
  const approvedSet = new Set((approvals ?? []).map((a) => a.staff_id));

  return (
    <div className="flex flex-col gap-12">
      <div><h1 className="font-fraunces text-[32px] font-normal text-forest">Payroll &amp; access</h1><span className="rule-gold mb-2 mt-2" /><p className="text-[13px] prose-muted">Time, pay, and password resets for the team. Administrators only.</p></div>

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
                    <p className="text-[13px] prose-muted">Since <LocalTime iso={p.started_at} mode="time" /> · ~{el.toFixed(1)}h{el > 4 ? " · over 4h" : ""}{p.note ? ` · ${p.note}` : ""}</p></div>
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

      {/* Password resets */}
      <section>
        <h2 className="mb-1 font-fraunces text-[22px] font-medium text-forest">Password resets</h2>
        <p className="mb-3 text-[13px] prose-muted">Email a client or employee a link to set a new password for their portal.</p>
        <PasswordResetForm />
      </section>

      {/* Employee reset requests */}
      <section>
        <h2 className="mb-1 font-fraunces text-[22px] font-medium text-forest">Employee reset requests</h2>
        <p className="mb-3 text-[13px] prose-muted">Employees can&apos;t reset their own password — approve a request to send them the recovery email.</p>
        {(resetReqs ?? []).length === 0 ? <p className="text-[15px] prose-muted">No pending requests.</p> : (
          <ul className="flex flex-col gap-2">
            {(resetReqs ?? []).map((r: any) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 border border-line-warm bg-white p-4">
                <div><p className="font-medium text-charcoal">{r.email}</p>
                  <p className="text-[12px] prose-muted">Requested <LocalTime iso={r.requested_at} /></p></div>
                <StaffResetActions id={r.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
