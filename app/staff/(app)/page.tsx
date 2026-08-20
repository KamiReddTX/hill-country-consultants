import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

// Always render fresh — new customer requests and queues should appear on reload.
export const dynamic = "force-dynamic";

import { getStaffMember, getClients, getDirectory, getLeads, getBookings, isPrivileged, isSalesOrAdmin, splitClients, getOpenPunch, getMyPunches, periodOf, usd } from "@/lib/staff";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { WorkLogApproveButton } from "@/components/staff/worklog-approve-button";
import { money } from "@/lib/portal";
import { computeRepEarnings } from "@/lib/commission";
import { COMMISSION } from "@/content/commission";

const STAGES = ["New lead", "Contacted", "Qualified", "Proposal", "Closed won", "Closed lost"];

export default async function Dashboard() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");

  const priv = isPrivileged(me);
  const canSeeRequests = isSalesOrAdmin(me);

  const [clients, directory] = await Promise.all([getClients(), getDirectory()]);
  const ownerName = new Map(directory.map((s) => [s.id, s.name || s.email]));
  const { mine, unassigned } = splitClients(clients, me);

  const leads = canSeeRequests ? await getLeads() : [];
  const newRequests = leads.filter((l) => (l.stage || "New lead") === "New lead");
  const stageCounts = STAGES.map((st) => ({ st, n: leads.filter((l) => (l.stage || "New lead") === st).length }));

  // A rep earns commission on the clients attributed to their employee code, so
  // anyone in sales (with a code) gets a personal running tally.
  const salesCredit = isSalesOrAdmin(me) && !!me.employee_code;

  // Manager-only firm-wide queues (bookings are also needed to tally a rep's own).
  const bookings = priv || salesCredit ? await getBookings() : [];
  // Revenue collected = one-time booking payments (Stripe at checkout) + every
  // invoice marked paid in Billing & AR. Both are real money in; summing them
  // keeps the dashboard in step with the invoicing system.
  let revenueCents = bookings.reduce((s, b) => s + Number(b.paid_cents || 0), 0);
  let pendingLog: any[] = [];
  if (priv) {
    const db = createClient();
    const [{ data: pl }, { data: paidInv }] = await Promise.all([
      db.from("client_work_log").select("*").eq("approved", false).order("worked_on", { ascending: false }).limit(50),
      db.from("invoices").select("amount_cents").eq("status", "paid"),
    ]);
    pendingLog = pl ?? [];
    revenueCents += (paidInv ?? []).reduce((s: number, r: any) => s + Number(r.amount_cents || 0), 0);
  }
  const clientName = new Map(clients.map((c) => [c.id, c.business || c.contact || c.email]));

  // A rep's own running income + estimated commission. Invoices are biller-only
  // under RLS, so we read them with the service client and surface only this
  // rep's aggregated totals — never raw rows.
  let repEarnings: ReturnType<typeof computeRepEarnings> | null = null;
  if (salesCredit) {
    const { data: inv } = await createServiceClient()
      .from("invoices").select("client_id, kind, status, amount_cents, period_month");
    repEarnings = computeRepEarnings({ employeeCode: me.employee_code, clients, bookings, invoices: (inv ?? []) as any });
  }

  const period = periodOf(0);
  const punches = me.hourly ? await getMyPunches(me, period.startISO, period.endISO) : [];
  const open = me.hourly ? await getOpenPunch(me) : null;
  const hours = punches.reduce((s, p) => s + Number(p.hours || 0), 0);

  const stat = (label: string, value: React.ReactNode) => (
    <div><p className="kicker">{label}</p><p className="font-fraunces text-[28px] text-charcoal tabular-nums">{value}</p></div>
  );
  const clientCard = (c: (typeof clients)[number]) => (
    <li key={c.id} className="border border-line-warm bg-white p-4">
      <p className="font-medium text-charcoal">{c.business || c.contact || c.email}</p>
      <p className="text-[13px] prose-muted">{c.contact || "—"}{c.phone ? ` · ${c.phone}` : ""}</p>
      <p className="mt-1 text-[12px]"><span className={c.assigned_to ? "text-forest" : "text-ink-faint"}>{ownerName.get(c.assigned_to) || "Unassigned"}</span> · {c.status}</p>
    </li>
  );

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Dashboard</h1>
        <span className="rule-gold mb-3 mt-2" />
        <p className="max-w-[60em] text-[13px] prose-muted">
          {priv
            ? "Your home base — a firm-wide roll-up. New customer requests, work-log approvals, pipeline, revenue, and clients are summarized here; jump into any tab for the detail."
            : "Your home base — the clients assigned to you and your hours this period. Use the tabs above for onboarding, tasks, work log, messages, and the rest of your job surface."}
        </p>
        <div className="mt-4 flex flex-wrap gap-8">
          {priv && stat("New requests", newRequests.length)}
          {priv && stat("Pending approvals", pendingLog.length)}
          {stat("Your clients", mine.length)}
          {stat("Unassigned", unassigned.length)}
          {priv && stat("Total clients", clients.length)}
          {priv && stat("Revenue collected", money(revenueCents))}
          {salesCredit && repEarnings && stat("Income collected", money(repEarnings.incomeCents))}
          {salesCredit && repEarnings && stat("Commission (est.)", money(repEarnings.commissionCents))}
          {me.hourly && stat("Hours this period", hours.toFixed(1))}
          {me.hourly && stat("Gross this period", usd(hours * Number(me.rate || 0)))}
        </div>
        {salesCredit && repEarnings && (
          <p className="mt-3 max-w-[60em] border-l-2 border-gold bg-white px-3 py-2 text-[13px] text-charcoal">
            Your running tally on the {repEarnings.clientCount} account{repEarnings.clientCount === 1 ? "" : "s"} credited to <span className="font-semibold">{me.employee_code}</span>:
            income collected <span className="font-semibold tabular-nums">{money(repEarnings.incomeCents)}</span>, estimated commission
            {" "}<span className="font-semibold tabular-nums text-forest">{money(repEarnings.commissionCents)}</span> at {COMMISSION.initialPct}% initial · {COMMISSION.recurringPct}% recurring · {COMMISSION.aLaCartePct}% à-la-carte.{" "}
            <Link href="/staff/commissions" className="link-underline">See your statement →</Link>
            <span className="block text-[12px] prose-muted">Estimate on money collected to date. Commission is released by an admin after a client is retained three months.</span>
          </p>
        )}
        {me.hourly && open && <p className="mt-3 border-l-2 border-gold bg-white px-3 py-2 text-[13px] text-charcoal">You&apos;re on the clock since {new Date(open.started_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.</p>}
      </div>

      {/* Customer requests — new website leads (sales + admins) */}
      {canSeeRequests && (
        <section>
          <h2 className="mb-1 font-fraunces text-[22px] font-medium text-forest">Customer requests</h2>
          <p className="mb-3 text-[14px] prose-muted">
            New Get Started and quote requests from the website. Work them from the{" "}
            <Link href="/staff/pipeline" className="link-underline">Pipeline</Link> and{" "}
            <Link href="/staff/intake" className="link-underline">Intake</Link> tabs.
          </p>
          {newRequests.length === 0
            ? <p className="text-[15px] prose-muted">No new requests right now.</p>
            : <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {newRequests.slice(0, 12).map((l) => (
                  <li key={l.id} className="border border-line-warm bg-white p-4">
                    <p className="font-medium text-charcoal">{l.business || l.contact || l.email || "New request"}</p>
                    <p className="text-[13px] prose-muted">{l.contact || "—"}{l.email ? ` · ${l.email}` : ""}{l.phone ? ` · ${l.phone}` : ""}</p>
                    {(l.industry || l.timeline) && <p className="mt-1 text-[12px] prose-muted">{[l.industry, l.timeline].filter(Boolean).join(" · ")}</p>}
                    {l.pain && <p className="mt-1 whitespace-pre-line text-[12px] prose-soft">{l.pain}</p>}
                    <p className="mt-1 text-[11px] text-ink-faint">{l.created_at ? new Date(l.created_at).toLocaleString() : ""}</p>
                  </li>
                ))}
              </ul>}
        </section>
      )}

      {/* Pipeline snapshot (managers) */}
      {priv && (
        <section>
          <h2 className="mb-1 font-fraunces text-[22px] font-medium text-forest">Pipeline snapshot</h2>
          <p className="mb-3 text-[14px] prose-muted">Leads by stage. <Link href="/staff/pipeline" className="link-underline">Open the pipeline →</Link></p>
          <div className="flex flex-wrap gap-3">
            {stageCounts.map(({ st, n }) => (
              <div key={st} className="border border-line-warm bg-white px-4 py-2">
                <p className="text-[12px] uppercase tracking-wide text-ink-faint">{st}</p>
                <p className="font-fraunces text-[20px] text-charcoal tabular-nums">{n}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Work-log approvals (managers) */}
      {priv && (
        <section>
          <h2 className="mb-1 font-fraunces text-[22px] font-medium text-forest">Work-log approvals</h2>
          <p className="mb-3 text-[14px] prose-muted">Hours a VA or account manager logged against a client. Approve to publish them to that client&apos;s Work Log and weekly report. Full detail on the <Link href="/staff/delivery" className="link-underline">Delivery</Link> and <Link href="/staff/daily" className="link-underline">Daily tasks</Link> tabs.</p>
          {pendingLog.length === 0 ? <p className="text-[15px] prose-muted">No entries waiting for approval.</p> : (
            <div className="overflow-x-auto border border-line-warm">
              <table className="w-full min-w-[720px] border-collapse bg-white text-left text-[14px]">
                <thead><tr className="border-b border-line-soft text-ink-faint"><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Client</th><th className="p-3 font-medium">Service</th><th className="p-3 font-medium">Task</th><th className="p-3 font-medium">By</th><th className="p-3 font-medium text-right">Hours</th><th className="p-3 font-medium">Approve</th></tr></thead>
                <tbody>
                  {pendingLog.map((w: any) => (
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
      )}

      {/* Recent bookings (managers) */}
      {priv && (
        <section>
          <h2 className="mb-1 font-fraunces text-[22px] font-medium text-forest">Recent bookings</h2>
          <p className="mb-3 text-[14px] prose-muted">Paid bookings across every client. Full history and analytics on the <Link href="/staff/reports" className="link-underline">Reports</Link> tab.</p>
          {bookings.length === 0 ? <p className="text-[15px] prose-muted">No bookings yet.</p> : (
            <ul className="flex flex-col gap-2">
              {bookings.slice(0, 8).map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 border border-line-warm bg-white p-4">
                  <div>
                    <p className="font-medium text-charcoal">{clientName.get((b as any).client_id) || b.ref} · {money(b.paid_cents)} <span className="text-[12px] text-ink-faint">({b.pay_mode})</span></p>
                    <p className="text-[13px] prose-muted">{b.ref} · start {b.start_date || "TBC"}{b.class_name ? ` · ${b.class_name}` : ""} · {(b.items || []).length} item(s)</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Your clients (everyone) */}
      <section>
        <h2 className="mb-3 font-fraunces text-[22px] font-medium text-forest">Your clients</h2>
        {mine.length === 0 ? <p className="text-[15px] prose-muted">No clients assigned to you yet. An admin assigns owners from the Clients tab.</p>
          : <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{mine.map(clientCard)}</ul>}
      </section>

      {/* Unassigned queue (everyone) */}
      <section>
        <h2 className="mb-1 font-fraunces text-[22px] font-medium text-forest">Unassigned queue</h2>
        <p className="mb-3 text-[14px] prose-muted">Visible to everyone until an admin assigns an owner from the Clients tab.</p>
        {unassigned.length === 0 ? <p className="text-[15px] prose-muted">Nothing waiting.</p>
          : <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{unassigned.map(clientCard)}</ul>}
      </section>
    </div>
  );
}
