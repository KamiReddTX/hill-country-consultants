import { redirect } from "next/navigation";
import { getStaffMember, isSalesLead, getLeads, getClients, getBookings, getDirectory, rolesOf, usd } from "@/lib/staff";
import { LeadRepAssign } from "@/components/staff/lead-rep-assign";

const code = (s: string | null | undefined) => (s ?? "").trim().toUpperCase();

function periodStartISO(p: string): string {
  const now = new Date();
  if (p === "daily") return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  if (p === "weekly") return new Date(Date.now() - 7 * 86400000).toISOString();
  if (p === "annual") return new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString(); // monthly
}
const PERIOD_LABEL: Record<string, string> = { daily: "Today", weekly: "Last 7 days", monthly: "This month", annual: "This year" };

export default async function SalesPage({ searchParams }: { searchParams: { period?: string; rep?: string } }) {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isSalesLead(me)) return <p className="text-[15px] prose-muted">The Sales console is for sales managers, business managers, and admins.</p>;

  const period = ["daily", "weekly", "monthly", "annual"].includes(searchParams.period || "") ? searchParams.period! : "monthly";
  const repParam = searchParams.rep || "all";

  const [leads, clients, bookings, directory] = await Promise.all([getLeads(), getClients(), getBookings(), getDirectory()]);

  const agents = directory.filter((s) => s.active !== false && s.employee_code)
    .map((s) => ({ id: s.id, code: code(s.employee_code), label: `${s.name || s.email}${s.employee_code ? ` (${s.employee_code})` : ""}` }));
  const staffByCode = new Map(directory.filter((s) => s.employee_code).map((s) => [code(s.employee_code), s]));
  const houseStaff = directory.find((s) => rolesOf(s).includes("Administrator")); // Kami — house/website commission
  const clientById = new Map(clients.map((c) => [c.id, c]));

  // ---- Commission / sales report ----
  const startISO = periodStartISO(period);
  const sales = bookings.filter((b) => b.created_at >= startISO && (b.paid_cents || 0) > 0);
  type Row = { key: string; label: string; source: string; count: number; cents: number; pct: number };
  const groups = new Map<string, Row>();
  for (const b of sales) {
    const c = clientById.get(b.client_id);
    const rc = code(c?.rep_code);
    let key: string, label: string, source: string, pct: number;
    if (rc && staffByCode.has(rc)) {
      const s = staffByCode.get(rc)!;
      key = `rep:${rc}`; label = s.name || s.email; source = "Rep-attributed"; pct = Number(s.commission_pct || 0);
    } else {
      key = "house"; label = "House / website — Kami"; source = "Website (no rep)"; pct = Number(houseStaff?.commission_pct || 0);
    }
    const g = groups.get(key) || { key, label, source, count: 0, cents: 0, pct };
    g.count++; g.cents += b.paid_cents || 0;
    groups.set(key, g);
  }
  let rows = [...groups.values()];
  if (repParam !== "all") rows = rows.filter((r) => r.key === `rep:${code(repParam)}` || (repParam === "house" && r.key === "house"));
  rows.sort((a, b) => b.cents - a.cents);
  const totalCents = rows.reduce((s, r) => s + r.cents, 0);
  const totalPayout = rows.reduce((s, r) => s + (r.cents / 100) * (r.pct / 100), 0);

  // ---- Incoming / website leads ----
  const active = leads.filter((l) => ["New lead", "Contacted"].includes(l.stage || "New lead"));

  return (
    <div className="flex flex-col gap-10">
      <div><h1 className="font-fraunces text-[32px] font-normal text-forest">Sales</h1><span className="rule-gold mb-2 mt-2" /><p className="text-[13px] prose-muted">Sales managers, business managers &amp; admins.</p></div>

      {/* Commission / sales report */}
      <section>
        <h2 className="mb-1 font-fraunces text-[22px] font-medium text-forest">Commission &amp; sales report</h2>
        <p className="mb-3 text-[13px] prose-muted">Booked sales by rep for the period, with each rep&apos;s commission %. Website sales with no rep code are credited to the house (Kami).</p>
        <form method="get" className="mb-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-[12px] text-ink-faint">Period
            <select name="period" defaultValue={period} className="min-h-touch border border-line-warm bg-white px-3 text-[14px]">
              <option value="daily">Daily (today)</option>
              <option value="weekly">Weekly (last 7 days)</option>
              <option value="monthly">Monthly (this month)</option>
              <option value="annual">Annual (this year)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-ink-faint">Sales rep
            <select name="rep" defaultValue={repParam} className="min-h-touch border border-line-warm bg-white px-3 text-[14px]">
              <option value="all">All reps</option>
              <option value="house">House / website (Kami)</option>
              {agents.map((a) => <option key={a.id} value={a.code}>{a.label}</option>)}
            </select>
          </label>
          <button className="btn-gold text-[14px]">Run report</button>
        </form>
        <div className="overflow-x-auto border border-line-warm">
          <table className="w-full min-w-[720px] border-collapse bg-white text-left text-[14px]">
            <thead><tr className="border-b border-line-soft text-ink-faint"><th className="p-3 font-medium">Rep</th><th className="p-3 font-medium">Source</th><th className="p-3 font-medium text-right"># Sales</th><th className="p-3 font-medium text-right">Total sold</th><th className="p-3 font-medium text-right">Commission %</th><th className="p-3 font-medium text-right">Payout</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={6} className="p-3 prose-muted">No booked sales in {PERIOD_LABEL[period]}.</td></tr>}
              {rows.map((r) => (
                <tr key={r.key} className="border-b border-line-soft/60">
                  <td className="p-3 font-medium text-charcoal">{r.label}</td>
                  <td className="p-3 prose-muted">{r.source}</td>
                  <td className="p-3 text-right tabular-nums">{r.count}</td>
                  <td className="p-3 text-right tabular-nums">{usd(r.cents / 100)}</td>
                  <td className="p-3 text-right tabular-nums">{r.pct.toFixed(1)}%</td>
                  <td className="p-3 text-right tabular-nums font-semibold text-forest">{usd((r.cents / 100) * (r.pct / 100))}</td>
                </tr>
              ))}
              {rows.length > 0 && (
                <tr className="border-t-2 border-line-soft bg-cream/40">
                  <td className="p-3 font-semibold text-charcoal" colSpan={2}>Total · {PERIOD_LABEL[period]}</td>
                  <td className="p-3 text-right tabular-nums font-semibold">{rows.reduce((s, r) => s + r.count, 0)}</td>
                  <td className="p-3 text-right tabular-nums font-semibold">{usd(totalCents / 100)}</td>
                  <td className="p-3" />
                  <td className="p-3 text-right tabular-nums font-semibold text-forest">{usd(totalPayout)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Incoming / website potential clients */}
      <section>
        <h2 className="mb-1 font-fraunces text-[22px] font-medium text-forest">Potential clients</h2>
        <p className="mb-3 text-[13px] prose-muted">New and in-progress leads, including everyone who came through the website. Assign each to a sales agent — unassigned website leads stay with the house (Kami).</p>
        {active.length === 0 ? <p className="text-[15px] prose-muted">No incoming leads right now.</p> : (
          <div className="overflow-x-auto border border-line-warm">
            <table className="w-full min-w-[820px] border-collapse bg-white text-left text-[14px]">
              <thead><tr className="border-b border-line-soft text-ink-faint"><th className="p-3 font-medium">Prospect</th><th className="p-3 font-medium">Interest</th><th className="p-3 font-medium">Stage</th><th className="p-3 font-medium w-64">Assigned agent</th></tr></thead>
              <tbody>
                {active.map((l) => (
                  <tr key={l.id} className="border-b border-line-soft/60 align-top">
                    <td className="p-3"><p className="font-medium text-charcoal">{l.business || l.contact || l.email || "—"}</p>
                      <p className="text-[12px] prose-muted">{l.contact || ""}{l.email ? ` · ${l.email}` : ""}{l.phone ? ` · ${l.phone}` : ""}</p></td>
                    <td className="p-3 prose-soft">{l.tier || l.industry || "—"}{l.pain ? <span className="block text-[12px] text-ink-faint">{l.pain}</span> : null}</td>
                    <td className="p-3 prose-muted">{l.stage || "New lead"}</td>
                    <td className="p-3"><LeadRepAssign leadId={l.id} currentCode={code(l.rep_code)} agents={agents} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
