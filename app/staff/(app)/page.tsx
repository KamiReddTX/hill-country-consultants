import Link from "next/link";
import { redirect } from "next/navigation";

// Always render fresh — new customer requests should appear on reload.
export const dynamic = "force-dynamic";

import { getStaffMember, getClients, getDirectory, getLeads, isSalesOrAdmin, splitClients, getOpenPunch, getMyPunches, periodOf, usd } from "@/lib/staff";

export default async function Dashboard() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  const [clients, directory] = await Promise.all([getClients(), getDirectory()]);
  const ownerName = new Map(directory.map((s) => [s.id, s.name || s.email]));
  const { mine, unassigned } = splitClients(clients, me);
  // New website requests (Get Started + quote) — shown to sales & admins.
  const canSeeRequests = isSalesOrAdmin(me);
  const leads = canSeeRequests ? await getLeads() : [];
  const newRequests = leads.filter((l) => (l.stage || "New lead") === "New lead");
  const period = periodOf(0);
  const punches = me.hourly ? await getMyPunches(me, period.startISO, period.endISO) : [];
  const open = me.hourly ? await getOpenPunch(me) : null;
  const hours = punches.reduce((s, p) => s + Number(p.hours || 0), 0);

  const card = (c: (typeof clients)[number]) => (
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
        <span className="rule-gold mb-4 mt-2" />
        <div className="flex flex-wrap gap-8">
          <div><p className="kicker">Your clients</p><p className="font-fraunces text-[28px] text-charcoal">{mine.length}</p></div>
          <div><p className="kicker">Unassigned</p><p className="font-fraunces text-[28px] text-charcoal">{unassigned.length}</p></div>
          {me.hourly && <div><p className="kicker">Hours this period</p><p className="font-fraunces text-[28px] text-charcoal tabular-nums">{hours.toFixed(1)}</p></div>}
          {me.hourly && <div><p className="kicker">Gross this period</p><p className="font-fraunces text-[28px] text-charcoal tabular-nums">{usd(hours * Number(me.rate || 0))}</p></div>}
        </div>
        {me.hourly && open && <p className="mt-3 border-l-2 border-gold bg-white px-3 py-2 text-[13px] text-charcoal">You're on the clock since {new Date(open.started_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.</p>}
      </div>

      {canSeeRequests && (
        <section>
          <h2 className="mb-1 font-fraunces text-[22px] font-medium text-forest">Customer requests</h2>
          <p className="mb-3 text-[14px] prose-muted">
            New Get Started and quote requests from the website.{" "}
            <Link href="/staff/pipeline" className="link-underline">Open the pipeline →</Link>
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

      <section>
        <h2 className="mb-3 font-fraunces text-[22px] font-medium text-forest">Your clients</h2>
        {mine.length === 0 ? <p className="text-[15px] prose-muted">No clients assigned to you yet. An admin assigns owners from the Admin tab.</p>
          : <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{mine.map(card)}</ul>}
      </section>

      <section>
        <h2 className="mb-1 font-fraunces text-[22px] font-medium text-forest">Unassigned queue</h2>
        <p className="mb-3 text-[14px] prose-muted">Visible to everyone until an admin assigns an owner.</p>
        {unassigned.length === 0 ? <p className="text-[15px] prose-muted">Nothing waiting.</p>
          : <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{unassigned.map(card)}</ul>}
      </section>
    </div>
  );
}
