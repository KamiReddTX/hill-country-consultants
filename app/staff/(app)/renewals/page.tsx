import { redirect } from "next/navigation";
import { getStaffMember, isPrivileged, getClients } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase/server";
import { money } from "@/lib/portal";
import { PLAN_FEE_CENTS, type PlanTier } from "@/content/pricing";
import { renewalDate, daysUntil, computeHealth, type HealthRating } from "@/lib/health";
import { RenewalDateInput } from "@/components/staff/renewal-date-input";

export const dynamic = "force-dynamic";

const fmtDate = (iso: string | null) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

/** Client health & renewals — upcoming renewal dates and at-risk accounts.
 *  Admin / Business Manager (client operations). */
export default async function RenewalsPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isPrivileged(me)) redirect("/staff");

  const admin = createServiceClient();
  const [clients, { data: invoices }, { data: workLog }] = await Promise.all([
    getClients(),
    admin.from("invoices").select("client_id, status, due_date"),
    admin.from("client_work_log").select("client_id, worked_on").order("worked_on", { ascending: false }).limit(2000),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  // Payment signals per client.
  const overdueClients = new Set<string>();
  const openClients = new Set<string>();
  for (const i of invoices ?? []) {
    if ((i as any).status === "sent" || (i as any).status === "draft") {
      const due = (i as any).due_date as string | null;
      if (due && due < today) overdueClients.add((i as any).client_id);
      else if ((i as any).status === "sent") openClients.add((i as any).client_id);
    }
  }
  // Last activity per client (work log is ordered newest-first).
  const lastActivity = new Map<string, string>();
  for (const w of workLog ?? []) {
    if (!lastActivity.has((w as any).client_id)) lastActivity.set((w as any).client_id, (w as any).worked_on);
  }

  const rows = clients.map((c) => {
    const auto = renewalDate(c.retained_since, null);
    const rd = renewalDate(c.retained_since, (c as any).renewal_date);
    const days = daysUntil(rd);
    const la = lastActivity.get(c.id);
    const lastDays = la ? (daysUntil(la) as number) * -1 : null; // days since
    const health = computeHealth({
      suspended: !!(c as any).suspended,
      overdue: overdueClients.has(c.id),
      open: openClients.has(c.id),
      status: c.status,
      lastActivityDays: lastDays,
    });
    const plan = (c as any).plan as PlanTier | null;
    return { c, auto, rd, days, health, plan, mrr: plan ? PLAN_FEE_CENTS[plan] || 0 : 0 };
  });

  const upcoming = rows
    .filter((r) => r.days != null && (r.days as number) <= 90 && (r.days as number) >= -30)
    .sort((a, b) => (a.days as number) - (b.days as number));
  const rank: Record<HealthRating, number> = { "At risk": 0, Watch: 1, Healthy: 2 };
  const atRisk = rows.filter((r) => r.health.rating !== "Healthy").sort((a, b) => rank[a.health.rating] - rank[b.health.rating]);

  const chip = (r: HealthRating) => {
    const cls = r === "At risk" ? "bg-red-50 text-red-700 border-red-200" : r === "Watch" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-forest/5 text-forest border-forest/20";
    return <span className={`inline-block border px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{r}</span>;
  };
  const dueClass = (d: number | null) => (d == null ? "text-ink-faint" : d < 0 ? "text-red-700" : d <= 30 ? "text-amber-700" : "text-charcoal");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Client health &amp; renewals</h1>
        <span className="rule-gold mb-2 mt-2" />
        <p className="max-w-[58em] text-[13px] prose-muted">
          Renewal dates default to each client&rsquo;s <span className="font-medium">retained-since + 12 months</span>; set a date to override
          (e.g. a quarterly term). Health flags accounts with overdue or open invoices, no recent work-log activity, or a suspension so
          nothing lapses quietly. This is a client-operations view — the financial figures live on the Finance tab.
        </p>
      </div>

      <section>
        <h2 className="mb-1 font-fraunces text-[20px] font-medium text-forest">Upcoming renewals — next 90 days</h2>
        <p className="mb-3 text-[13px] prose-muted">Includes anything up to 30 days overdue so a missed renewal still shows.</p>
        {upcoming.length === 0 ? <p className="text-[15px] prose-muted">No renewals in the window.</p> : (
          <div className="overflow-x-auto border border-line-warm">
            <table className="w-full min-w-[720px] border-collapse bg-white text-left text-[14px]">
              <thead><tr className="border-b border-line-soft text-ink-faint"><th className="p-3 font-medium">Client</th><th className="p-3 font-medium">Plan</th><th className="p-3 font-medium text-right">MRR</th><th className="p-3 font-medium">Renewal date</th><th className="p-3 font-medium">In</th><th className="p-3 font-medium">Health</th><th className="p-3 font-medium">Override</th></tr></thead>
              <tbody>
                {upcoming.map((r) => (
                  <tr key={r.c.id} className="border-b border-line-soft/60">
                    <td className="p-3 font-medium text-charcoal">{r.c.business || r.c.contact || r.c.email}</td>
                    <td className="p-3 prose-muted">{r.plan || "—"}</td>
                    <td className="p-3 text-right tabular-nums">{r.mrr ? money(r.mrr) : "—"}</td>
                    <td className="p-3 prose-soft">{fmtDate(r.rd)}</td>
                    <td className={`p-3 tabular-nums ${dueClass(r.days)}`}>{r.days == null ? "—" : r.days < 0 ? `${-r.days}d ago` : `${r.days}d`}</td>
                    <td className="p-3">{chip(r.health.rating)}</td>
                    <td className="p-3"><RenewalDateInput clientId={r.c.id} current={(r.c as any).renewal_date || ""} autoHint={r.auto ? fmtDate(r.auto) : null} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-1 font-fraunces text-[20px] font-medium text-forest">Needs attention</h2>
        <p className="mb-3 text-[13px] prose-muted">Accounts rated Watch or At risk, most urgent first.</p>
        {atRisk.length === 0 ? <p className="text-[15px] prose-muted">Every client is healthy right now.</p> : (
          <div className="overflow-x-auto border border-line-warm">
            <table className="w-full min-w-[620px] border-collapse bg-white text-left text-[14px]">
              <thead><tr className="border-b border-line-soft text-ink-faint"><th className="p-3 font-medium">Client</th><th className="p-3 font-medium">Health</th><th className="p-3 font-medium">Why</th><th className="p-3 font-medium">Status</th><th className="p-3 font-medium">Renewal</th></tr></thead>
              <tbody>
                {atRisk.map((r) => (
                  <tr key={r.c.id} className="border-b border-line-soft/60">
                    <td className="p-3 font-medium text-charcoal">{r.c.business || r.c.contact || r.c.email}</td>
                    <td className="p-3">{chip(r.health.rating)}</td>
                    <td className="p-3 prose-muted">{r.health.reasons.join(" · ")}</td>
                    <td className="p-3 prose-muted">{r.c.status}</td>
                    <td className="p-3 prose-soft">{fmtDate(r.rd)}</td>
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
