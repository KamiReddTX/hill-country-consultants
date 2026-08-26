import { redirect } from "next/navigation";
import Link from "next/link";
import { getStaffMember, isAdmin, isPrivileged, getClients, getDirectory, getBookings } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/portal";
import { AddClientForm } from "@/components/staff/add-client-form";
import { AssignSelect } from "@/components/staff/assign-select";
import { AccountTeam } from "@/components/staff/account-team";
import { StatusSelect } from "@/components/staff/status-select";
import { BillingSelect } from "@/components/staff/billing-select";
import { RoadmapCheck } from "@/components/staff/roadmap-check";
import { DeleteClientButton } from "@/components/staff/delete-client-button";
import { ClientPortalAccessButton } from "@/components/staff/client-portal-access-button";
import { ClientVendorAssign } from "@/components/staff/client-vendor-assign";
import { ClientContactsManager } from "@/components/staff/client-contacts-manager";
import { GenerateReportForm } from "@/components/staff/generate-report-form";
import { LocalTime } from "@/components/local-time";
import { PlanSelect } from "@/components/staff/plan-select";
import { AutoOpenDetails } from "@/components/staff/auto-open-details";
import { RenewalDateInput } from "@/components/staff/renewal-date-input";
import { renewalDate } from "@/lib/health";

/** Format an ISO date-only string as a local day, or null. */
const fmtRenewal = (iso: string | null) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;
import { AllotmentAdjustForm } from "@/components/staff/allotment-adjust-form";
import { DeleteAdjustmentButton } from "@/components/staff/delete-adjustment-button";
import { computeAllotmentUsage, monthKey } from "@/lib/allotments";
import { ALLOTMENT_LINES } from "@/content/pricing";

/** Clients hub — one expandable row per client with everything about them:
 *  account setup, contacts & suspension, bookings, weekly reports, recent work
 *  log, and quick links into the deeper tabs. Replaces the scattered Admin
 *  client sections. */
export default async function ClientsPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isPrivileged(me)) {
    // Non-privileged staff keep a simple read-only roster.
    const [clients, directory] = await Promise.all([getClients(), getDirectory()]);
    const ownerName = new Map(directory.map((s) => [s.id, s.name || s.email]));
    return (
      <div className="flex flex-col gap-6">
        <div><h1 className="font-fraunces text-[32px] font-normal text-forest">All clients</h1><span className="rule-gold mb-4 mt-2" /><p className="text-[14px] prose-muted">Ownership is set by an admin. No access codes or passwords are shown anywhere in the staff area.</p></div>
        <div className="overflow-x-auto border border-line-warm">
          <table className="w-full min-w-[720px] border-collapse bg-white text-left text-[14px]">
            <thead><tr className="border-b border-line-soft text-ink-faint"><th className="p-3 font-medium">Business</th><th className="p-3 font-medium">Contact</th><th className="p-3 font-medium">Phone</th><th className="p-3 font-medium">Owner</th><th className="p-3 font-medium">Status</th></tr></thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-line-soft/60">
                  <td className="p-3 font-medium text-charcoal">{c.business || "—"}</td>
                  <td className="p-3 prose-soft">{c.contact || "—"}</td>
                  <td className="p-3 prose-muted">{c.phone || "—"}</td>
                  <td className="p-3"><span className={c.assigned_to ? "text-forest" : "text-ink-faint"}>{ownerName.get(c.assigned_to) || "Unassigned"}</span></td>
                  <td className="p-3 prose-muted">{c.status}</td>
                </tr>
              ))}
              {clients.length === 0 && <tr><td colSpan={5} className="p-3 prose-muted">No clients yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const admin = isAdmin(me);
  const [clients, directory, bookings] = await Promise.all([getClients(), getDirectory(), getBookings()]);
  const staffName = new Map(directory.map((s) => [s.id, s.name || s.email]));
  const ownerOpts = directory.filter((s) => s.active !== false).map((s) => ({ id: s.id, label: `${s.name || s.email} · ${s.role}` }));
  const teamOpts = directory.filter((s) => s.active !== false).map((s) => ({ id: s.id, label: s.name || s.email }));

  const db = createClient();
  const ym = monthKey();
  const [{ data: assignments }, { data: allContacts }, { data: workLog }, { data: reports }, { data: adjustments }, { data: prefVendors }, { data: vendorAssigns }] = await Promise.all([
    db.from("client_assignments").select("*"),
    db.from("client_contacts").select("*").order("created_at", { ascending: true }),
    db.from("client_work_log").select("*").order("worked_on", { ascending: false }).limit(400),
    db.from("client_reports").select("id,client_id,name,created_at").order("created_at", { ascending: false }),
    db.from("client_allotment_adjustments").select("*").eq("period_month", `${ym}-01`).order("created_at", { ascending: false }),
    db.from("preferred_vendors").select("id,name,active").order("name"),
    db.from("client_preferred_vendors").select("id,client_id,vendor_id,scope"),
  ]);
  const vendorOpts = ((prefVendors ?? []) as any[]).filter((v) => v.active).map((v) => ({ id: v.id, label: v.name }));
  const vendorNameById = new Map(((prefVendors ?? []) as any[]).map((v) => [v.id, v.name]));
  const vendorAssignByClient = new Map<string, { id: string; vendor: string; scope: string | null }[]>();
  ((vendorAssigns ?? []) as any[]).forEach((a) => {
    const arr = vendorAssignByClient.get(a.client_id) || [];
    arr.push({ id: a.id, vendor: vendorNameById.get(a.vendor_id) || "Vendor", scope: a.scope });
    vendorAssignByClient.set(a.client_id, arr);
  });

  const teamByClient = new Map<string, { id: string; staffId: string; label: string }[]>();
  (assignments ?? []).forEach((a: any) => {
    const arr = teamByClient.get(a.client_id) || [];
    arr.push({ id: a.id, staffId: a.staff_id, label: staffName.get(a.staff_id) || "Staff" });
    teamByClient.set(a.client_id, arr);
  });
  const contactsByClient = new Map<string, any[]>();
  (allContacts ?? []).forEach((c: any) => { const a = contactsByClient.get(c.client_id) || []; a.push(c); contactsByClient.set(c.client_id, a); });
  const bookingsByClient = new Map<string, any[]>();
  (bookings ?? []).forEach((b: any) => { const a = bookingsByClient.get(b.client_id) || []; a.push(b); bookingsByClient.set(b.client_id, a); });
  const logByClient = new Map<string, any[]>();
  (workLog ?? []).forEach((w: any) => { const a = logByClient.get(w.client_id) || []; a.push(w); logByClient.set(w.client_id, a); });
  const reportsByClient = new Map<string, any[]>();
  (reports ?? []).forEach((r: any) => { const a = reportsByClient.get(r.client_id) || []; a.push(r); reportsByClient.set(r.client_id, a); });

  // This month's allotment inputs: approved VA-ish hours from the work log (auto)
  // and manual adjustments per client.
  const vaHoursByClient = new Map<string, number>();
  (workLog ?? []).forEach((w: any) => {
    if (String(w.worked_on || "").slice(0, 7) !== ym) return;
    if (w.approved === false) return;
    vaHoursByClient.set(w.client_id, (vaHoursByClient.get(w.client_id) || 0) + Number(w.hours || 0));
  });
  const adjByClient = new Map<string, any[]>();
  (adjustments ?? []).forEach((a: any) => { const arr = adjByClient.get(a.client_id) || []; arr.push(a); adjByClient.set(a.client_id, arr); });
  const adjLabel = new Map(ALLOTMENT_LINES.map((l) => [l.key, l.label]));

  const H = ({ children }: { children: React.ReactNode }) => <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-forest">{children}</p>;

  return (
    <div className="flex flex-col gap-8">
      <AutoOpenDetails />
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Clients</h1>
        <span className="rule-gold mb-2 mt-2" />
        <p className="max-w-[52em] text-[13px] prose-muted">Everything about a client in one place. Open a client to manage their account, team, contacts, billing, bookings, reports, and recent work — no jumping between tabs.</p>
      </div>

      <section className="border border-line-warm bg-white p-4">
        <p className="mb-2 text-[13px] font-semibold text-forest">Add a client</p>
        <AddClientForm />
      </section>

      <section className="flex flex-col gap-2">
        {clients.length === 0 && <p className="text-[15px] prose-muted">No clients yet.</p>}
        {clients.map((c) => {
          const label = c.business || c.contact || c.email;
          const bk = bookingsByClient.get(c.id) || [];
          const lg = (logByClient.get(c.id) || []).slice(0, 6);
          const rp = (reportsByClient.get(c.id) || []).slice(0, 5);
          const suspended = !!(c as any).suspended;
          const plan = (c as any).plan || null;
          const adjList = adjByClient.get(c.id) || [];
          const usage = computeAllotmentUsage(plan, vaHoursByClient.get(c.id) || 0, adjList.map((a: any) => ({ service_key: a.service_key, delta: Number(a.delta) })));
          return (
            <details key={c.id} id={`c-${c.id}`} className="border border-line-warm bg-white">
              <summary className="min-h-touch cursor-pointer list-none px-4 py-3">
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-[15px] font-medium text-charcoal">{label}</span>
                  <span className="text-[12px] prose-muted">{c.email}</span>
                  <span className="text-[11px] uppercase tracking-wide text-ink-faint">{c.status}</span>
                  {c.assigned_to && <span className="text-[11px] text-forest">· {staffName.get(c.assigned_to) || "Owner"}</span>}
                  {suspended && <span className="text-[11px] font-semibold text-red-700">· Suspended</span>}
                </span>
              </summary>

              <div className="flex flex-col gap-6 border-t border-line-soft p-4">
                {/* Account setup */}
                <div>
                  <H>Account</H>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="flex flex-col gap-1 text-[12px] text-ink-faint">Owner<AssignSelect clientId={c.id} current={c.assigned_to} options={ownerOpts} /></label>
                    <label className="flex flex-col gap-1 text-[12px] text-ink-faint">Team<AccountTeam clientId={c.id} members={teamByClient.get(c.id) || []} options={teamOpts} /></label>
                    <label className="flex flex-col gap-1 text-[12px] text-ink-faint">Status<StatusSelect clientId={c.id} current={c.status} /></label>
                    <label className="flex flex-col gap-1 text-[12px] text-ink-faint">Billing<BillingSelect clientId={c.id} current={(c as any).billing_type || "standard"} /></label>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-2 text-[13px] text-charcoal">30-day roadmap <RoadmapCheck clientId={c.id} done={!!c.roadmap_at} /></span>
                    {c.rep_code && <span className="text-[12px] prose-muted">Rep: {c.rep_code}</span>}
                    <ClientPortalAccessButton email={c.email} />
                    {admin && <DeleteClientButton clientId={c.id} label={label} />}
                  </div>
                </div>

                {/* Plan & allotments */}
                <div>
                  <H>Plan &amp; allotments · {ym}</H>
                  <div className="grid gap-3 md:max-w-[560px] md:grid-cols-2">
                    <label className="flex flex-col gap-1 text-[12px] text-ink-faint">Retainer tier<PlanSelect clientId={c.id} current={plan} /></label>
                    <label className="flex flex-col gap-1 text-[12px] text-ink-faint">Renewal date<RenewalDateInput clientId={c.id} current={(c as any).renewal_date || ""} autoHint={fmtRenewal(renewalDate(c.retained_since, null))} /></label>
                  </div>
                  {plan ? (
                    <div className="mt-3 flex flex-col gap-3">
                      <div className="overflow-x-auto border border-line-soft">
                        <table className="w-full min-w-[520px] border-collapse bg-white text-left text-[13px]">
                          <thead><tr className="border-b border-line-soft text-ink-faint"><th className="p-2 font-medium">Service</th><th className="p-2 font-medium">Allotment</th><th className="p-2 font-medium">Used</th><th className="p-2 font-medium">Remaining</th></tr></thead>
                          <tbody>
                            {usage.map((u) => (
                              <tr key={u.key} className="border-b border-line-soft/60">
                                <td className="p-2 text-charcoal">{u.label} <span className="text-[11px] text-ink-faint">({u.unit})</span></td>
                                <td className="p-2 prose-muted">{u.allot ?? "—"}</td>
                                <td className="p-2 prose-soft">{u.used}{u.key === "va_hours" && u.auto ? <span className="text-[11px] text-ink-faint"> ({u.auto} logged)</span> : null}</td>
                                <td className={`p-2 font-medium ${u.over ? "text-red-700" : "text-forest"}`}>{u.remaining ?? "—"}{u.over ? " · over" : ""}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-[11px] prose-muted">VA hours count approved work-log hours this month automatically. Record other deliverables (a deliverable package, a compliance build, a graphic) as they&rsquo;re completed — a positive number uses allotment, a negative number credits it back. Anything over allotment should be invoiced from Billing &amp; AR.</p>
                      <AllotmentAdjustForm clientId={c.id} month={ym} />
                      {adjList.length > 0 && (
                        <ul className="flex flex-col gap-0.5">
                          {adjList.map((a: any) => (
                            <li key={a.id} className="text-[12px] prose-muted">
                              {Number(a.delta) > 0 ? "+" : ""}{Number(a.delta)} {adjLabel.get(a.service_key) || a.service_key}{a.note ? ` · ${a.note}` : ""} <DeleteAdjustmentButton id={a.id} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-[13px] prose-muted">Off-plan (à-la-carte). Set a retainer tier to track monthly allotments.</p>
                  )}
                </div>

                {/* Contacts & suspension */}
                <div>
                  <H>Contacts &amp; account status</H>
                  <p className="mb-2 text-[12px] prose-muted">Every email here also receives client messages. Suspend to block portal access (e.g. non-payment).</p>
                  <ClientContactsManager clientId={c.id} contacts={contactsByClient.get(c.id) || []} suspended={suspended} reason={(c as any).suspended_reason || ""} />
                  <ClientVendorAssign clientId={c.id} vendors={vendorOpts} assignments={vendorAssignByClient.get(c.id) || []} />
                </div>

                {/* Bookings */}
                <div>
                  <H>Bookings</H>
                  {bk.length === 0 ? <p className="text-[13px] prose-muted">No bookings.</p> : (
                    <ul className="flex flex-col gap-1">
                      {bk.map((b: any) => (
                        <li key={b.id} className="text-[13px] prose-soft">{b.ref} · {money(b.paid_cents)} <span className="text-[11px] text-ink-faint">({b.pay_mode})</span>{b.start_date ? ` · start ${b.start_date}` : ""}{b.class_name ? ` · ${b.class_name}` : ""}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Weekly reports */}
                <div>
                  <H>Weekly reports</H>
                  <GenerateReportForm clients={[{ id: c.id, label }]} />
                  {rp.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-0.5">
                      {rp.map((r: any) => <li key={r.id} className="text-[12px] prose-muted">{r.name} · <LocalTime iso={r.created_at} mode="date" /></li>)}
                    </ul>
                  )}
                </div>

                {/* Recent work log */}
                <div>
                  <H>Recent work log</H>
                  {lg.length === 0 ? <p className="text-[13px] prose-muted">No hours logged yet.</p> : (
                    <ul className="flex flex-col gap-0.5">
                      {lg.map((w: any) => (
                        <li key={w.id} className="text-[13px] prose-soft">{w.worked_on} · {w.service || "—"}{w.task ? ` · ${w.task}` : ""} · {Number(w.hours).toFixed(1)}h{w.approved ? "" : " · pending"}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Quick links into the deeper tabs */}
                <div>
                  <H>Open in</H>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                    <Link href="/staff/messages" className="link-underline">Messages</Link>
                    <Link href="/staff/files" className="link-underline">Files</Link>
                    <Link href="/staff/vault" className="link-underline">Vault</Link>
                    <Link href="/staff/tasks" className="link-underline">Task board</Link>
                    <Link href="/staff/weekly" className="link-underline">Weekly reports</Link>
                    <Link href="/staff/billing" className="link-underline">Billing &amp; AR</Link>
                  </div>
                </div>
              </div>
            </details>
          );
        })}
      </section>
    </div>
  );
}
