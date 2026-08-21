import Link from "next/link";
import { redirect } from "next/navigation";
import { getStaffMember, isAdmin, getClients, getBookings } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase/server";
import { money } from "@/lib/portal";
import { PLAN_FEE_CENTS, type PlanTier } from "@/content/pricing";
import { monthKey } from "@/lib/allotments";
import { EXPENSE_CATEGORIES } from "@/content/expenses";
import { ExpenseForm } from "@/components/staff/expense-form";
import { DeleteExpenseButton } from "@/components/staff/delete-expense-button";
import { BudgetEditor } from "@/components/staff/budget-editor";

export const dynamic = "force-dynamic";

/** Format a date-only value as a local day (avoids the UTC-midnight off-by-one). */
const fmtDay = (iso: string) =>
  new Date(`${String(iso).slice(0, 10)}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const addMonth = (ym: string, delta: number) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKey(d);
};

/** A YYYY-MM key N months before now (0 = current). */
function monthBack(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return monthKey(d);
}
function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "short", year: "2-digit" });
}

/** Finance — recurring revenue (MRR/ARR), the billed-recurring trend, and
 *  month-over-month movement. Administrator only. */
export default async function FinancePage({ searchParams }: { searchParams: { m?: string } }) {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isAdmin(me)) redirect("/staff");

  const selMonth = /^\d{4}-\d{2}$/.test(searchParams?.m || "") ? (searchParams!.m as string) : monthKey();

  const admin = createServiceClient();
  const [clients, bookings, { data: invoices }, { data: allInvoices }, { data: expenseRows }, { data: budgetRows }] = await Promise.all([
    getClients(),
    getBookings(),
    admin.from("invoices").select("client_id, kind, status, amount_cents, period_month"),
    admin.from("invoices").select("amount_cents, status, paid_at"),
    admin.from("expenses").select("*").order("incurred_on", { ascending: false }),
    admin.from("expense_budgets").select("*"),
  ]);
  const { data: vendorList } = await admin.from("vendors").select("id, name").order("name");

  // Contracted run-rate MRR: active plan clients that are actually billed.
  const billable = clients.filter((c) => {
    const plan = (c as any).plan as string | null;
    if (!plan) return false;
    if ((c as any).suspended) return false;
    const bt = (c as any).billing_type;
    if (bt === "comp" || bt === "barter") return false;
    return c.status === "Active" || c.status === "In review";
  });
  const byTier: Record<PlanTier, number> = { Foundation: 0, Momentum: 0, Enterprise: 0 };
  let mrrCents = 0;
  for (const c of billable) {
    const plan = (c as any).plan as PlanTier;
    const fee = PLAN_FEE_CENTS[plan] ?? 0;
    if (fee) { mrrCents += fee; byTier[plan] += 1; }
  }
  const arrCents = mrrCents * 12;
  const avgCents = billable.length ? Math.round(mrrCents / billable.length) : 0;
  const arOutstandingCents = (allInvoices ?? []).filter((i: any) => ["sent", "overdue"].includes(i.status)).reduce((s: number, i: any) => s + Number(i.amount_cents || 0), 0);
  const activeClients = clients.filter((c) => c.status === "Active").length;

  // Billed-recurring trend from plan invoices, last 6 months.
  const planInv = (invoices ?? []).filter((i: any) => i.kind === "plan");
  const months = Array.from({ length: 6 }, (_, i) => monthBack(5 - i)); // oldest → newest
  const billedByMonth = new Map<string, number>();
  const paidByMonth = new Map<string, number>();
  const clientsByMonth = new Map<string, Set<string>>();
  for (const i of planInv) {
    const ym = String(i.period_month || "").slice(0, 7);
    if (!ym) continue;
    billedByMonth.set(ym, (billedByMonth.get(ym) || 0) + Number(i.amount_cents || 0));
    if (i.status === "paid") paidByMonth.set(ym, (paidByMonth.get(ym) || 0) + Number(i.amount_cents || 0));
    const set = clientsByMonth.get(ym) || new Set<string>();
    set.add(i.client_id); clientsByMonth.set(ym, set);
  }
  const maxBilled = Math.max(1, ...months.map((m) => billedByMonth.get(m) || 0));

  // Month-over-month movement (latest vs prior month with data).
  const latest = months[months.length - 1];
  const prior = months[months.length - 2];
  const latestSet = clientsByMonth.get(latest) || new Set<string>();
  const priorSet = clientsByMonth.get(prior) || new Set<string>();
  const newLogos = [...latestSet].filter((id) => !priorSet.has(id)).length;
  const churned = [...priorSet].filter((id) => !latestSet.has(id)).length;
  const retained = [...latestSet].filter((id) => priorSet.has(id)).length;

  const clientName = new Map(clients.map((c) => [c.id, c.business || c.contact || c.email]));
  const churnedClients = [...priorSet].filter((id) => !latestSet.has(id)).map((id) => clientName.get(id) || "Client");

  // Revenue vs expenses, last 6 months (for the visual chart).
  const revByMonth = new Map<string, number>();
  for (const i of (allInvoices ?? []) as any[]) if (i.status === "paid" && i.paid_at) { const ym = String(i.paid_at).slice(0, 7); revByMonth.set(ym, (revByMonth.get(ym) || 0) + Number(i.amount_cents || 0)); }
  for (const b of (bookings ?? []) as any[]) { const ym = String(b.created_at).slice(0, 7); revByMonth.set(ym, (revByMonth.get(ym) || 0) + Number(b.paid_cents || 0)); }
  const expByMonth = new Map<string, number>();
  for (const e of (expenseRows ?? []) as any[]) { const ym = String(e.incurred_on).slice(0, 7); expByMonth.set(ym, (expByMonth.get(ym) || 0) + Number(e.amount_cents || 0)); }
  const chart = months.map((m) => ({ label: monthLabel(m), rev: revByMonth.get(m) || 0, exp: expByMonth.get(m) || 0 }));
  const chartMax = Math.max(1, ...chart.flatMap((c) => [c.rev, c.exp]));

  // ── Expenses, budget vs actual, and net profit for the selected month ──
  const inMonth = (d?: string | null) => String(d || "").slice(0, 7) === selMonth;
  const monthExpenses = (expenseRows ?? []).filter((e: any) => inMonth(e.incurred_on));
  const expensesTotal = monthExpenses.reduce((s: number, e: any) => s + Number(e.amount_cents || 0), 0);
  const budgetByCat = new Map<string, number>((budgetRows ?? []).map((b: any) => [b.category, Number(b.monthly_cents || 0)]));
  const actualByCat = new Map<string, number>();
  for (const e of monthExpenses) actualByCat.set(e.category, (actualByCat.get(e.category) || 0) + Number(e.amount_cents || 0));
  const budgetTotal = EXPENSE_CATEGORIES.reduce((s, c) => s + (budgetByCat.get(c) || 0), 0);

  // Revenue collected in the month = invoices marked paid this month + bookings taken this month.
  const invoiceCollected = (allInvoices ?? []).filter((i: any) => i.status === "paid" && inMonth(i.paid_at)).reduce((s: number, i: any) => s + Number(i.amount_cents || 0), 0);
  const bookingCollected = (bookings ?? []).filter((b: any) => inMonth(b.created_at)).reduce((s: number, b: any) => s + Number(b.paid_cents || 0), 0);
  const revenueMonth = invoiceCollected + bookingCollected;
  const netProfit = revenueMonth - expensesTotal;
  const monthLabelSel = monthLabel(selMonth);

  const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <div className="border border-line-warm bg-white p-4">
      <p className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-1 font-fraunces text-[26px] text-forest tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-[12px] prose-muted">{sub}</p>}
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Finance</h1>
        <span className="rule-gold mb-2 mt-2" />
        <p className="max-w-[56em] text-[13px] prose-muted">
          Recurring-revenue overview for the firm. <span className="font-medium">Contracted MRR</span> is the monthly run rate from
          active, billable plan clients (excludes paused, offboarded, suspended, comp and barter accounts). The trend and movement
          below are drawn from the plan invoices raised in Billing &amp; AR, so they fill in as you bill each month. Administrator-only.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Contracted MRR" value={money(mrrCents)} sub={`${billable.length} billable plan client${billable.length === 1 ? "" : "s"}`} />
        <Stat label="ARR (run rate)" value={money(arrCents)} sub="MRR × 12" />
        <Stat label="Avg revenue / client" value={money(avgCents)} sub="Monthly, per plan client" />
        <Stat label={`Movement · ${monthLabel(latest)}`} value={`+${newLogos} / −${churned}`} sub={`${retained} retained`} />
        <Stat label="AR outstanding" value={money(arOutstandingCents)} sub="Sent + overdue invoices" />
        <Stat label="Active clients" value={String(activeClients)} sub="Status = Active" />
      </div>

      <section>
        <h2 className="mb-1 font-fraunces text-[20px] font-medium text-forest">Exports</h2>
        <p className="mb-3 text-[13px] prose-muted">Download firm-wide data as CSV (opens in Excel or Google Sheets). Administrator-only.</p>
        <div className="flex flex-wrap gap-3">
          <a href="/api/export?kind=clients" className="btn-gold text-[14px]">Clients CSV</a>
          <a href="/api/export?kind=invoices" className="border border-line-warm bg-white px-4 py-2 text-[14px] font-medium text-forest">Invoices &amp; AR CSV</a>
          <a href="/api/export?kind=expenses" className="border border-line-warm bg-white px-4 py-2 text-[14px] font-medium text-forest">Expenses CSV</a>
          <a href="/api/report/exec" className="btn-gold text-[14px]">Executive report (PDF)</a>
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-fraunces text-[20px] font-medium text-forest">MRR by tier</h2>
        <div className="overflow-x-auto border border-line-warm">
          <table className="w-full min-w-[520px] border-collapse bg-white text-left text-[14px]">
            <thead><tr className="border-b border-line-soft text-ink-faint"><th className="p-3 font-medium">Tier</th><th className="p-3 font-medium">Monthly fee</th><th className="p-3 font-medium">Clients</th><th className="p-3 font-medium text-right">MRR</th></tr></thead>
            <tbody>
              {(["Foundation", "Momentum", "Enterprise"] as PlanTier[]).map((t) => (
                <tr key={t} className="border-b border-line-soft/60">
                  <td className="p-3 font-medium text-charcoal">{t}</td>
                  <td className="p-3 prose-muted tabular-nums">{money(PLAN_FEE_CENTS[t])}</td>
                  <td className="p-3 prose-soft tabular-nums">{byTier[t]}</td>
                  <td className="p-3 text-right tabular-nums text-forest">{money(PLAN_FEE_CENTS[t] * byTier[t])}</td>
                </tr>
              ))}
              <tr className="bg-cream/40 font-medium"><td className="p-3" colSpan={2}>Total</td><td className="p-3 tabular-nums">{billable.length}</td><td className="p-3 text-right tabular-nums text-forest">{money(mrrCents)}</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-1 font-fraunces text-[20px] font-medium text-forest">Billed recurring — last 6 months</h2>
        <p className="mb-3 text-[13px] prose-muted">Plan invoices raised each month (bar) and how much has been collected (in forest). Sparse months mean plan invoices weren&rsquo;t generated — draft them from Billing &amp; AR.</p>
        <div className="flex flex-col gap-2 border border-line-warm bg-white p-4">
          {months.map((m) => {
            const billed = billedByMonth.get(m) || 0;
            const paid = paidByMonth.get(m) || 0;
            const pct = Math.round((billed / maxBilled) * 100);
            const paidPct = billed ? Math.round((paid / billed) * 100) : 0;
            return (
              <div key={m} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-[12px] prose-muted">{monthLabel(m)}</span>
                <div className="relative h-5 flex-1 bg-cream">
                  <div className="absolute inset-y-0 left-0 bg-gold/40" style={{ width: `${pct}%` }} />
                  <div className="absolute inset-y-0 left-0 bg-forest" style={{ width: `${Math.round((paid / maxBilled) * 100)}%` }} />
                </div>
                <span className="w-40 shrink-0 text-right text-[12px] tabular-nums text-charcoal">{money(billed)} <span className="text-ink-faint">· {paidPct}% collected</span></span>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-1 font-fraunces text-[20px] font-medium text-forest">Revenue vs expenses — last 6 months</h2>
        <p className="mb-3 text-[13px] prose-muted">Revenue collected (paid invoices + bookings) against expenses each month. <span className="text-forest">Forest</span> = revenue, <span className="text-gold-hover">gold</span> = expenses.</p>
        <div className="border border-line-warm bg-white p-4">
          <svg viewBox="0 0 600 210" className="w-full" role="img" aria-label="Revenue versus expenses, last six months">
            <line x1="40" y1="170" x2="590" y2="170" stroke="#e4ddcd" />
            {chart.map((c, idx) => {
              const groupW = 550 / chart.length;
              const gx = 40 + idx * groupW + groupW / 2;
              const bw = Math.min(26, groupW / 3);
              const revH = Math.round((c.rev / chartMax) * 150);
              const expH = Math.round((c.exp / chartMax) * 150);
              return (
                <g key={c.label}>
                  <rect x={gx - bw - 2} y={170 - revH} width={bw} height={revH} fill="#23482f" />
                  <rect x={gx + 2} y={170 - expH} width={bw} height={expH} fill="#c2a24a" />
                  <text x={gx} y={186} textAnchor="middle" fontSize="11" fill="#6b6552">{c.label}</text>
                </g>
              );
            })}
            <text x="40" y="14" fontSize="10" fill="#6b6552">Top of scale: {money(chartMax)}</text>
          </svg>
        </div>
      </section>

      {churned > 0 && (
        <section>
          <h2 className="mb-1 font-fraunces text-[20px] font-medium text-forest">Churned this month</h2>
          <p className="mb-2 text-[13px] prose-muted">Had a plan invoice in {monthLabel(prior)} but not {monthLabel(latest)}. Confirm whether they paused, offboarded, or simply weren&rsquo;t billed yet.</p>
          <ul className="flex flex-col gap-0.5">
            {churnedClients.map((n, i) => <li key={i} className="text-[13px] text-red-700">{n}</li>)}
          </ul>
        </section>
      )}

      {/* Expenses, budget vs actual, and net profit */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-fraunces text-[20px] font-medium text-forest">Expenses &amp; net profit</h2>
          <div className="flex items-center gap-3 text-[13px]">
            <Link href={`/staff/finance?m=${addMonth(selMonth, -1)}`} className="link-underline">← {monthLabel(addMonth(selMonth, -1))}</Link>
            <span className="font-semibold text-charcoal">{monthLabelSel}</span>
            <Link href={`/staff/finance?m=${addMonth(selMonth, 1)}`} className="link-underline">{monthLabel(addMonth(selMonth, 1))} →</Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label={`Revenue collected · ${monthLabelSel}`} value={money(revenueMonth)} sub="Paid invoices + bookings" />
          <Stat label="Expenses" value={money(expensesTotal)} sub={`Budget ${money(budgetTotal)}`} />
          <div className="border border-line-warm bg-white p-4">
            <p className="text-[11px] uppercase tracking-wide text-ink-faint">Net profit</p>
            <p className={`mt-1 font-fraunces text-[26px] tabular-nums ${netProfit >= 0 ? "text-forest" : "text-red-700"}`}>{money(netProfit)}</p>
            <p className="mt-0.5 text-[12px] prose-muted">Revenue − expenses</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[13px] font-semibold text-forest">Budget vs actual — {monthLabelSel}</p>
          <div className="overflow-x-auto border border-line-warm">
            <table className="w-full min-w-[620px] border-collapse bg-white text-left text-[14px]">
              <thead><tr className="border-b border-line-soft text-ink-faint"><th className="p-3 font-medium">Category</th><th className="p-3 font-medium text-right">Actual</th><th className="p-3 font-medium">Monthly budget</th><th className="p-3 font-medium text-right">Variance</th></tr></thead>
              <tbody>
                {EXPENSE_CATEGORIES.map((c) => {
                  const actual = actualByCat.get(c) || 0;
                  const budget = budgetByCat.get(c) || 0;
                  const variance = budget - actual; // + = under budget
                  const over = budget > 0 && variance < 0;
                  return (
                    <tr key={c} className="border-b border-line-soft/60">
                      <td className="p-3 text-charcoal">{c}</td>
                      <td className="p-3 text-right tabular-nums">{money(actual)}</td>
                      <td className="p-3"><BudgetEditor category={c} current={Math.round(budget / 100)} /></td>
                      <td className={`p-3 text-right tabular-nums ${budget === 0 ? "text-ink-faint" : over ? "text-red-700" : "text-forest"}`}>{budget === 0 ? "—" : `${variance >= 0 ? "" : "−"}${money(Math.abs(variance))}${over ? " over" : " left"}`}</td>
                    </tr>
                  );
                })}
                <tr className="bg-cream/40 font-medium"><td className="p-3">Total</td><td className="p-3 text-right tabular-nums">{money(expensesTotal)}</td><td className="p-3 tabular-nums">{money(budgetTotal)}</td><td className={`p-3 text-right tabular-nums ${budgetTotal - expensesTotal < 0 ? "text-red-700" : "text-forest"}`}>{money(budgetTotal - expensesTotal)}</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[12px] prose-muted">Edit a category&rsquo;s monthly budget inline — it applies every month. Variance shows what&rsquo;s left (forest) or over (red) for {monthLabelSel}.</p>
        </div>

        <div className="border border-line-warm bg-white p-4">
          <p className="mb-1 text-[13px] font-semibold text-forest">Log an expense</p>
          <p className="mb-3 text-[12px] prose-muted">Recorded against the date you choose, so it lands in that month&rsquo;s totals.</p>
          <ExpenseForm defaultDate={`${selMonth}-15`.slice(0, 10)} vendors={(vendorList ?? []) as any} />
        </div>

        <div>
          <p className="mb-2 text-[13px] font-semibold text-forest">Expenses in {monthLabelSel}</p>
          {monthExpenses.length === 0 ? <p className="text-[13px] prose-muted">No expenses logged for this month.</p> : (
            <div className="overflow-x-auto border border-line-warm">
              <table className="w-full min-w-[620px] border-collapse bg-white text-left text-[13px]">
                <thead><tr className="border-b border-line-soft text-ink-faint"><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Category</th><th className="p-3 font-medium">Vendor</th><th className="p-3 font-medium">Note</th><th className="p-3 font-medium text-right">Amount</th><th className="p-3 font-medium"></th></tr></thead>
                <tbody>
                  {monthExpenses.map((e: any) => (
                    <tr key={e.id} className="border-b border-line-soft/60">
                      <td className="p-3 prose-muted">{fmtDay(e.incurred_on)}</td>
                      <td className="p-3 text-charcoal">{e.category}</td>
                      <td className="p-3 prose-soft">{e.vendor || "—"}</td>
                      <td className="p-3 prose-muted">{e.description || "—"}</td>
                      <td className="p-3 text-right tabular-nums">{money(e.amount_cents)}</td>
                      <td className="p-3"><DeleteExpenseButton id={e.id} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
