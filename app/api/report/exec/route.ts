import { NextResponse } from "next/server";
import { getStaffMember, isAdmin } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase/server";
import { PLAN_FEE_CENTS, type PlanTier } from "@/content/pricing";
import { monthKey } from "@/lib/allotments";
import { buildExecReportPdf, type ExecSnapshot } from "@/lib/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const monthBack = (n: number) => { const d = new Date(); d.setMonth(d.getMonth() - n); return monthKey(d); };
const monthLabel = (ym: string) => { const [y, m] = ym.split("-").map(Number); return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "short", year: "2-digit" }); };

/** Administrator-only executive snapshot PDF. */
export async function GET() {
  const me = await getStaffMember();
  if (!isAdmin(me)) return NextResponse.json({ error: "Administrators only." }, { status: 403 });

  const admin = createServiceClient();
  const sel = monthKey();
  const [{ data: clients }, { data: invoices }, { data: bookings }, { data: expenses }] = await Promise.all([
    admin.from("clients").select("*"),
    admin.from("invoices").select("client_id, kind, status, amount_cents, period_month, paid_at"),
    admin.from("bookings").select("paid_cents, created_at"),
    admin.from("expenses").select("amount_cents, incurred_on"),
  ]);

  const cl = (clients ?? []) as any[];
  const billable = cl.filter((c) => c.plan && !c.suspended && c.billing_type !== "comp" && c.billing_type !== "barter" && (c.status === "Active" || c.status === "In review"));
  const byTierMap: Record<PlanTier, number> = { Foundation: 0, Momentum: 0, Enterprise: 0 };
  let mrr = 0;
  for (const c of billable) { const fee = PLAN_FEE_CENTS[c.plan as PlanTier] ?? 0; if (fee) { mrr += fee; byTierMap[c.plan as PlanTier] += 1; } }
  const arr = mrr * 12;
  const avg = billable.length ? Math.round(mrr / billable.length) : 0;
  const activeClients = cl.filter((c) => c.status === "Active").length;

  const inv = (invoices ?? []) as any[];
  const arOutstanding = inv.filter((i) => ["sent", "overdue"].includes(i.status)).reduce((s, i) => s + Number(i.amount_cents || 0), 0);
  const inMonth = (d?: string | null) => String(d || "").slice(0, 7) === sel;
  const revenueMonth =
    inv.filter((i) => i.status === "paid" && inMonth(i.paid_at)).reduce((s, i) => s + Number(i.amount_cents || 0), 0) +
    ((bookings ?? []) as any[]).filter((b) => inMonth(b.created_at)).reduce((s, b) => s + Number(b.paid_cents || 0), 0);
  const expensesMonth = ((expenses ?? []) as any[]).filter((e) => inMonth(e.incurred_on)).reduce((s, e) => s + Number(e.amount_cents || 0), 0);

  const months = Array.from({ length: 6 }, (_, i) => monthBack(5 - i));
  const planInv = inv.filter((i) => i.kind === "plan");
  const trend = months.map((m) => ({
    month: monthLabel(m),
    billed: planInv.filter((i) => String(i.period_month || "").slice(0, 7) === m).reduce((s, i) => s + Number(i.amount_cents || 0), 0),
    collected: planInv.filter((i) => i.status === "paid" && String(i.period_month || "").slice(0, 7) === m).reduce((s, i) => s + Number(i.amount_cents || 0), 0),
  }));

  const snap: ExecSnapshot = {
    generatedOn: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    monthLabel: monthLabel(sel),
    mrr, arr, avgPerClient: avg, activeClients, totalClients: cl.length, arOutstanding,
    revenueMonth, expenses: expensesMonth, net: revenueMonth - expensesMonth,
    byTier: (["Foundation", "Momentum", "Enterprise"] as PlanTier[]).map((t) => ({ tier: t, clients: byTierMap[t], mrr: PLAN_FEE_CENTS[t] * byTierMap[t] })),
    trend,
  };

  const pdf = await buildExecReportPdf(snap);
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="hcc-exec-report-${sel}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
