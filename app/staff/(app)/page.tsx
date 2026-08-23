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
import { renewalDate, daysUntil } from "@/lib/health";
import { ACK_KIND, ACK_VERSION } from "@/content/acknowledgments";
import { KickoffHandledButton } from "@/components/staff/kickoff-handled-button";
import { SyncCalendarButton } from "@/components/staff/sync-calendar-button";
import { UpgradeRequestActions } from "@/components/staff/upgrade-request-actions";
import { gcalConfigured } from "@/lib/google-calendar";

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

  // Kickoff calls a client scheduled that still need staff added to the invite.
  // Shown to the account owner and to managers.
  const kickoffCutoff = Date.now() - 30 * 86400000;
  const pendingKickoffs = clients.filter((c) => {
    const k = (c as any).kickoff_at;
    if (!k || (c as any).kickoff_confirmed_at) return false;
    if (new Date(k).getTime() < kickoffCutoff) return false; // ignore old ones from before this flag existed
    return priv || c.assigned_to === me.id;
  });

  // "Needs attention" roll-up for managers: renewals due soon, unpaid AR,
  // pending time off, and employees who haven't signed the current IT/security ack.
  const attention = { renewalsSoon: 0, unpaidCount: 0, unpaidCents: 0, ptoPending: 0, missingAck: 0, lowRatings: 0 };
  let recentFeedback: any[] = [];
  let upgradeReqs: any[] = [];
  if (priv) {
    const admin = createServiceClient();
    const [{ data: unpaid }, { data: pto }, { data: acks }, { data: fb }, { data: upg }] = await Promise.all([
      admin.from("invoices").select("amount_cents,status").in("status", ["sent", "overdue"]),
      admin.from("time_off_requests").select("id").eq("status", "pending"),
      admin.from("staff_acknowledgments").select("staff_id").eq("kind", ACK_KIND).eq("version", ACK_VERSION),
      admin.from("client_feedback").select("client_id,rating,comment,created_at").order("created_at", { ascending: false }).limit(12),
      admin.from("service_upgrade_requests").select("id,client_id,label,note,created_at").eq("status", "new").order("created_at", { ascending: false }).limit(20),
    ]);
    recentFeedback = fb ?? [];
    upgradeReqs = upg ?? [];
    const cutoff30 = Date.now() - 30 * 86400000;
    attention.lowRatings = recentFeedback.filter((f: any) => f.rating <= 2 && new Date(f.created_at).getTime() >= cutoff30).length;
    attention.unpaidCount = (unpaid ?? []).length;
    attention.unpaidCents = (unpaid ?? []).reduce((s: number, i: any) => s + Number(i.amount_cents || 0), 0);
    attention.ptoPending = (pto ?? []).length;
    const acked = new Set((acks ?? []).map((a: any) => a.staff_id));
    attention.missingAck = directory.filter((s) => s.active !== false && !acked.has(s.id)).length;
    attention.renewalsSoon = clients.filter((c) => {
      const d = daysUntil(renewalDate((c as any).retained_since, (c as any).renewal_date));
      return d !== null && d <= 30;
    }).length;
  }
  const attentionItems = [
    { n: attention.renewalsSoon, label: "renewals due ≤30d", href: "/staff/renewals" },
    { n: attention.unpaidCount, label: `unpaid invoices${attention.unpaidCents ? ` · ${money(attention.unpaidCents)}` : ""}`, href: "/staff/billing" },
    { n: attention.ptoPending, label: "time-off requests to review", href: "/staff/capacity" },
    { n: attention.missingAck, label: "staff missing security ack", href: "/staff/directory" },
    { n: attention.lowRatings, label: "low satisfaction ratings (≤2, 30d)", href: "#recent-feedback" },
    { n: upgradeReqs.length, label: "service upgrade requests", href: "#upgrade-requests" },
  ].filter((i) => i.n > 0);
  const upgradeClientName = new Map(clients.map((c) => [c.id, c.business || c.contact || c.email]));

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

      {priv && gcalConfigured() && (
        <div className="flex items-center gap-2 text-[13px] prose-muted">Google Calendar: <SyncCalendarButton /></div>
      )}

      {/* Kickoff calls to set up (owner + managers) */}
      {pendingKickoffs.length > 0 && (
        <section className="border-2 border-gold bg-cream/40 p-4">
          <h2 className="mb-1 font-fraunces text-[20px] font-medium text-forest">Kickoff calls to set up</h2>
          <p className="mb-3 text-[13px] prose-muted">These clients scheduled their kickoff. Find it on the calendar, add the account owner and any service specialists to the invite, then mark it handled.</p>
          <ul className="flex flex-col gap-2">
            {pendingKickoffs.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-2 text-[14px]">
                <span className="text-charcoal">
                  <span className="font-medium">{c.business || c.contact || c.email}</span>
                  {(c as any).kickoff_at && <span className="prose-muted"> · marked scheduled {new Date((c as any).kickoff_at).toLocaleDateString()}</span>}
                  <span className="prose-muted"> · owner {ownerName.get(c.assigned_to) || "unassigned"}</span>
                </span>
                <KickoffHandledButton clientId={c.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Needs attention (managers) */}
      {priv && attentionItems.length > 0 && (
        <section className="border-2 border-gold bg-cream/40 p-4">
          <h2 className="mb-2 font-fraunces text-[20px] font-medium text-forest">Needs attention</h2>
          <ul className="flex flex-wrap gap-3">
            {attentionItems.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="flex items-baseline gap-2 border border-line-warm bg-white px-4 py-2 hover:border-forest">
                  <span className="font-fraunces text-[22px] text-forest tabular-nums">{i.n}</span>
                  <span className="text-[13px] prose-soft">{i.label} →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recent client feedback (managers) */}
      {priv && recentFeedback.length > 0 && (
        <section id="recent-feedback">
          <h2 className="mb-1 font-fraunces text-[22px] font-medium text-forest">Recent client feedback</h2>
          <p className="mb-3 text-[14px] prose-muted">Satisfaction check-ins from the client portal. Low scores (≤2) get an alert to the account owner too.</p>
          <ul className="flex flex-col gap-2">
            {recentFeedback.slice(0, 8).map((f: any, i: number) => (
              <li key={i} className={`flex flex-wrap items-center justify-between gap-2 border bg-white p-3 ${f.rating <= 2 ? "border-red-300" : "border-line-warm"}`}>
                <span className="text-[14px]">
                  <span className={`mr-2 tabular-nums ${f.rating <= 2 ? "text-red-700" : "text-gold"}`}>{"★".repeat(f.rating)}<span className="text-line-warm">{"★".repeat(5 - f.rating)}</span></span>
                  <span className="font-medium text-charcoal">{clientName.get(f.client_id) || "Client"}</span>
                  {f.comment && <span className="prose-muted"> — {f.comment}</span>}
                </span>
                <span className="text-[12px] text-ink-faint">{f.created_at ? new Date(f.created_at).toLocaleDateString() : ""}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Service upgrade requests (managers) */}
      {priv && upgradeReqs.length > 0 && (
        <section id="upgrade-requests">
          <h2 className="mb-1 font-fraunces text-[22px] font-medium text-forest">Service upgrade requests</h2>
          <p className="mb-3 text-[14px] prose-muted">Clients who asked about an upgrade or add-on from their task board. Follow up to scope it.</p>
          <ul className="flex flex-col gap-2">
            {upgradeReqs.map((r: any) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 border border-gold/50 bg-white p-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-charcoal">{upgradeClientName.get(r.client_id) || "Client"} — {r.label}</p>
                  {r.note && <p className="mt-0.5 text-[13px] prose-soft">{r.note}</p>}
                  <p className="mt-0.5 text-[12px] text-ink-faint">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}</p>
                </div>
                <UpgradeRequestActions id={r.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

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
