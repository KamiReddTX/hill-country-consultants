import { redirect } from "next/navigation";
import Link from "next/link";
import { getStaffMember, isPrivileged, getClients, getBookings } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { WorkLogApproveButton } from "@/components/staff/worklog-approve-button";
import { money } from "@/lib/portal";
import { LocalTime } from "@/components/local-time";

/** Admin — slim cross-client operations. Per-client management now lives on the
 *  Clients tab; team pay & password resets live on the Payroll tab. What remains
 *  here are the aggregate queues a manager clears across every client at once. */
export default async function AdminPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isPrivileged(me)) return <p className="text-[15px] prose-muted">The Admin tab is for administrators and business managers only.</p>;

  const [clients, bookings] = await Promise.all([getClients(), getBookings()]);
  const clientName = new Map(clients.map((c) => [c.id, c.business || c.contact || c.email]));

  const db = createClient();
  const { data: pendingLog } = await db.from("client_work_log").select("*").eq("approved", false).order("worked_on", { ascending: false }).limit(200);

  return (
    <div className="flex flex-col gap-12">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Admin ops</h1>
        <span className="rule-gold mb-2 mt-2" />
        <p className="max-w-[52em] text-[13px] prose-muted">
          Cross-client operational queues. Manage individual clients on the <Link href="/staff/clients" className="link-underline">Clients</Link> tab; team pay, timesheets, and password resets are on the <Link href="/staff/payroll" className="link-underline">Payroll</Link> tab.
        </p>
      </div>

      {/* Work-log approvals — across all clients */}
      <section>
        <h2 className="mb-1 font-fraunces text-[22px] font-medium text-forest">Work-log approvals</h2>
        <p className="mb-3 text-[13px] prose-muted">Hours a VA/AM logged against a client. Approve to publish them to that client&apos;s Work Log and weekly report.</p>
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

      {/* All bookings — across all clients */}
      <section>
        <h2 className="mb-3 font-fraunces text-[22px] font-medium text-forest">All bookings</h2>
        {bookings.length === 0 ? <p className="text-[15px] prose-muted">No bookings yet.</p> : (
          <ul className="flex flex-col gap-2">
            {bookings.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 border border-line-warm bg-white p-4">
                <div><p className="font-medium text-charcoal">{clientName.get((b as any).client_id) || b.ref} · {money(b.paid_cents)} <span className="text-[12px] text-ink-faint">({b.pay_mode})</span></p>
                  <p className="text-[13px] prose-muted">{b.ref} · start {b.start_date || "TBC"}{b.class_name ? ` · ${b.class_name}` : ""} · {(b.items || []).length} item(s)</p>
                  {b.consent_at && <p className="text-[11px] text-ink-faint">Consent <LocalTime iso={b.consent_at} mode="date" /> · IP {b.consent_ip || "—"}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
