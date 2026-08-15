import { redirect } from "next/navigation";
import { getStaffMember, isAdmin, isPrivileged, getDirectory, getClients, getBookings, getOnTheClock, periodOf, usd } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { AssignSelect } from "@/components/staff/assign-select";
import { DeleteClientButton } from "@/components/staff/delete-client-button";
import { StatusSelect } from "@/components/staff/status-select";
import { RoadmapCheck } from "@/components/staff/roadmap-check";
import { ForceClockOutButton } from "@/components/staff/force-clockout-button";
import { ApproveButton } from "@/components/staff/approve-button";
import { PrintButton } from "@/components/staff/print-button";
import { WorkLogApproveButton } from "@/components/staff/worklog-approve-button";
import { GenerateReportForm } from "@/components/staff/generate-report-form";
import { PasswordResetForm } from "@/components/staff/password-reset-form";
import { StaffResetActions } from "@/components/staff/staff-reset-actions";
import { AccountTeam } from "@/components/staff/account-team";
import { AddClientForm } from "@/components/staff/add-client-form";
import { BillingSelect } from "@/components/staff/billing-select";
import { money } from "@/lib/portal";

export default async function AdminPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isPrivileged(me)) return <p className="text-[15px] prose-muted">The Admin tab is for administrators and business managers only.</p>;
  const admin = isAdmin(me);

  const [directory, clients, bookings, onClock] = await Promise.all([getDirectory(), getClients(), getBookings(), getOnTheClock()]);
  const staffName = new Map(directory.map((s) => [s.id, s.name || s.email]));
  const clientName = new Map(clients.map((c) => [c.id, c.business || c.contact || c.email]));
  const clientOpts = clients.map((c) => ({ id: c.id, label: c.business || c.contact || c.email }));
  const ownerOpts = directory.filter((s) => s.active !== false).map((s) => ({ id: s.id, label: `${s.name || s.email} · ${s.role}` }));
  const teamOpts = directory.filter((s) => s.active !== false).map((s) => ({ id: s.id, label: s.name || s.email }));
  const period = periodOf(0);

  const db = createClient();
  const [{ data: periodPunches }, { data: approvals }, { data: pendingLog }, { data: resetReqs }, { data: assignments }] = await Promise.all([
    db.from("punches").select("*").gte("started_at", period.startISO).lte("started_at", period.endISO + "T23:59:59Z"),
    db.from("timesheet_approvals").select("*").eq("period_start", period.startISO),
    db.from("client_work_log").select("*").eq("approved", false).order("worked_on", { ascending: false }).limit(100),
    db.from("staff_reset_requests").select("*").eq("status", "pending").order("requested_at", { ascending: false }),
    db.from("client_assignments").select("*"),
  ]);
  const teamByClient = new Map<string, { id: string; staffId: string; label: string }[]>();
  (assignments ?? []).forEach((a: any) => {
    const arr = teamByClient.get(a.client_id) || [];
    arr.push({ id: a.id, staffId: a.staff_id, label: staffName.get(a.staff_id) || "Staff" });
    teamByClient.set(a.client_id, arr);
  });
  const hoursByStaff = new Map<string, number>();
  (periodPunches ?? []).forEach((p) => hoursByStaff.set(p.staff_id, (hoursByStaff.get(p.staff_id) || 0) + Number(p.hours || 0)));
  const approvedSet = new Set((approvals ?? []).map((a) => a.staff_id));

  return (
    <div className="flex flex-col gap-12">
      <div><h1 className="font-fraunces text-[32px] font-normal text-forest">Admin</h1><span className="rule-gold mb-2 mt-2" /><p className="text-[13px] prose-muted">Administrators &amp; business managers.{admin ? "" : " Payroll, password resets, and account deletion are admin-only."}</p></div>

      {/* On the clock now — admin only */}
      {admin && <section>
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
      </section>}

      {/* Timesheets — admin only */}
      {admin && <section>
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
      </section>}

      {/* Work-log approvals */}
      <section>
        <h2 className="mb-1 font-fraunces text-[22px] font-medium text-forest">Work-log approvals</h2>
        <p className="mb-3 text-[13px] prose-muted">Hours a VA/AM logged against a client. Approve to publish them to the client&apos;s Work Log and weekly report.</p>
        {(pendingLog ?? []).length === 0 ? <p className="text-[15px] prose-muted">No entries waiting for approval.</p> : (
          <div className="overflow-x-auto border border-line-warm">
            <table className="w-full min-w-[720px] border-collapse bg-white text-left text-[14px]">
              <thead><tr className="border-b border-line-soft text-ink-faint"><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Client</th><th className="p-3 font-medium">Service</th><th className="p-3 font-medium">Task</th><th className="p-3 font-medium">By</th><th className="p-3 font-medium text-right">Hours</th><th className="p-3 font-medium">Approve</th></tr></thead>
              <tbody>
                {(pendingLog ?? []).map((w: any) => (
                  <tr key={w.id} className="border-b border-line-soft/60">
                    <td className="p-3 prose-muted">{w.worked_on}</td>
                    <td className="p-3 text-charcoal">{clientName.get(w.client_id) || "Client"}</td>
                    <td className="p-3 prose-soft">{w.service || "—"}</td>
                    <td className="p-3 prose-soft">{w.task || "—"}</td>
                    <td className="p-3 prose-muted">{w.performed_by || "—"}</td>
                    <td className="p-3 text-right tabular-nums">{Number(w.hours).toFixed(1)}</td>
                    <td className="p-3"><WorkLogApproveButton id={w.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Weekly reports */}
      <section>
        <h2 className="mb-1 font-fraunces text-[22px] font-medium text-forest">Weekly reports</h2>
        <p className="mb-3 text-[13px] prose-muted">Generate this week&apos;s PDF (last 7 days of approved hours + deliverables) and publish it to the client&apos;s Weekly Report tab.</p>
        {clientOpts.length === 0 ? <p className="text-[15px] prose-muted">No clients yet.</p> : <GenerateReportForm clients={clientOpts} />}
      </section>

      {/* Password resets — admin only */}
      {admin && <section>
        <h2 className="mb-1 font-fraunces text-[22px] font-medium text-forest">Password resets</h2>
        <p className="mb-3 text-[13px] prose-muted">Email a client or employee a link to set a new password for their portal. Copy their email from the tables below if needed.</p>
        <PasswordResetForm />
      </section>}

      {/* Employee reset requests — admin only */}
      {admin && <section>
        <h2 className="mb-1 font-fraunces text-[22px] font-medium text-forest">Employee reset requests</h2>
        <p className="mb-3 text-[13px] prose-muted">Employees can&apos;t reset their own password — approve a request to send them the recovery email.</p>
        {(resetReqs ?? []).length === 0 ? <p className="text-[15px] prose-muted">No pending requests.</p> : (
          <ul className="flex flex-col gap-2">
            {(resetReqs ?? []).map((r: any) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 border border-line-warm bg-white p-4">
                <div><p className="font-medium text-charcoal">{r.email}</p>
                  <p className="text-[12px] prose-muted">Requested {new Date(r.requested_at).toLocaleString()}</p></div>
                <StaffResetActions id={r.id} />
              </li>
            ))}
          </ul>
        )}
      </section>}

      {/* Client access & assignment */}
      <section>
        <h2 className="mb-1 font-fraunces text-[22px] font-medium text-forest">Clients</h2>
        <p className="mb-3 text-[13px] prose-muted">Add a client by hand (they get a portal invite), set the owner and team, status, billing, and 30-day roadmap.</p>
        <div className="mb-4 border border-line-warm bg-white p-4"><p className="mb-2 text-[13px] font-semibold text-forest">Add a client</p><AddClientForm /></div>
        <div className="overflow-x-auto border border-line-warm">
          <table className="w-full min-w-[860px] border-collapse bg-white text-left text-[14px]">
            <thead><tr className="border-b border-line-soft text-ink-faint"><th className="p-3 font-medium">Business</th><th className="p-3 font-medium">Contact</th><th className="p-3 font-medium w-56">Owner</th><th className="p-3 font-medium w-60">Team</th><th className="p-3 font-medium w-40">Status</th><th className="p-3 font-medium w-36">Billing</th><th className="p-3 font-medium w-36">30-day roadmap</th><th className="p-3 font-medium">Rep</th>{admin && <th className="p-3 font-medium">Delete</th>}</tr></thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-line-soft/60">
                  <td className="p-3 font-medium text-charcoal">{c.business || "—"}</td>
                  <td className="p-3 prose-muted">{c.contact || "—"}<br /><span className="text-[12px]">{c.email}</span></td>
                  <td className="p-3"><AssignSelect clientId={c.id} current={c.assigned_to} options={ownerOpts} /></td>
                  <td className="p-3"><AccountTeam clientId={c.id} members={teamByClient.get(c.id) || []} options={teamOpts} /></td>
                  <td className="p-3"><StatusSelect clientId={c.id} current={c.status} /></td>
                  <td className="p-3"><BillingSelect clientId={c.id} current={(c as any).billing_type || "standard"} /></td>
                  <td className="p-3"><RoadmapCheck clientId={c.id} done={!!c.roadmap_at} /></td>
                  <td className="p-3 prose-muted">{c.rep_code || "—"}</td>
                  {admin && <td className="p-3"><DeleteClientButton clientId={c.id} label={c.business || c.contact || c.email} /></td>}
                </tr>
              ))}
              {clients.length === 0 && <tr><td colSpan={admin ? 9 : 8} className="p-3 prose-muted">No clients yet.</td></tr>}
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
