import { redirect } from "next/navigation";
import { getStaffMember, isSalesOrAdmin, getClients, getBookings } from "@/lib/staff";
import { COMMISSION, COMMISSION_LINES } from "@/content/commission";
import { money } from "@/lib/portal";

export const dynamic = "force-dynamic";

function monthsSince(dateISO: string | null): number {
  if (!dateISO) return 0;
  const d = new Date(dateISO), now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
}

export default async function CommissionsPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isSalesOrAdmin(me)) return <p className="text-[15px] prose-muted">Commissions is for sales and admins.</p>;

  const code = (s: string | null | undefined) => (s ?? "").trim().toUpperCase();
  const [clients, bookings] = await Promise.all([getClients(), getBookings()]);
  const mine = me.employee_code ? clients.filter((c) => code(c.rep_code) === code(me.employee_code)) : [];
  const myClientIds = new Set(mine.map((c) => c.id));
  const clientName = new Map(clients.map((c) => [c.id, c.business || c.contact || c.email]));

  // À-la-carte commission estimate: standalone bookings attributed to this rep's clients.
  const myBookings = bookings.filter((b) => myClientIds.has((b as any).client_id));
  const aLaCarteCents = myBookings.reduce((s, b) => s + Number(b.paid_cents || 0), 0);
  const aLaCarteCommission = Math.round(aLaCarteCents * (COMMISSION.aLaCartePct / 100));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Commission tracking</h1>
        <span className="rule-gold mb-3 mt-2" />
        <p className="max-w-[56em] text-[13px] prose-muted">
          Use this page to see the commission you&apos;re building on the accounts and sales attributed to your employee code.
          This statement is read-only — an administrator releases commission after a client has been retained three months.
        </p>
      </div>

      {/* The structure */}
      <section>
        <h2 className="mb-3 font-fraunces text-[20px] font-medium text-forest">How commission works</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {COMMISSION_LINES.map((c) => (
            <div key={c.t} className="border border-line-warm bg-white p-5">
              <p className="font-fraunces text-[30px] leading-none text-forest">{c.pct}%</p>
              <p className="mt-2 font-medium text-charcoal">{c.t}</p>
              <p className="mt-1 text-[13px] prose-muted">{c.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[13px] prose-muted">
          Commission is credited to the employee code on the account, and paid only after the client has been retained three months.
          Initial and recurring plan commission is calculated and released by an administrator from the Sales report.
        </p>
      </section>

      {/* À-la-carte commission from attributed bookings */}
      <section>
        <h2 className="mb-1 font-fraunces text-[20px] font-medium text-forest">À-la-carte sales ({COMMISSION.aLaCartePct}%)</h2>
        <p className="mb-3 text-[13px] prose-muted">Standalone bookings on your attributed clients. Commission shown is an estimate at {COMMISSION.aLaCartePct}%, released after the retention period.</p>
        {myBookings.length === 0 ? <p className="text-[15px] prose-muted">No attributed à-la-carte bookings yet.</p> : (
          <div className="overflow-x-auto border border-line-warm">
            <table className="w-full min-w-[560px] border-collapse bg-white text-left text-[14px]">
              <thead><tr className="border-b border-line-soft text-ink-faint"><th className="p-3 font-medium">Client</th><th className="p-3 font-medium">Ref</th><th className="p-3 font-medium text-right">Sale</th><th className="p-3 font-medium text-right">Commission ({COMMISSION.aLaCartePct}%)</th></tr></thead>
              <tbody>
                {myBookings.map((b) => (
                  <tr key={b.id} className="border-b border-line-soft/60">
                    <td className="p-3 text-charcoal">{clientName.get((b as any).client_id) || b.ref}</td>
                    <td className="p-3 prose-muted">{b.ref}</td>
                    <td className="p-3 text-right tabular-nums">{money(b.paid_cents)}</td>
                    <td className="p-3 text-right tabular-nums text-forest">{money(Math.round(Number(b.paid_cents || 0) * (COMMISSION.aLaCartePct / 100)))}</td>
                  </tr>
                ))}
                <tr className="bg-cream/40 font-medium"><td className="p-3" colSpan={2}>Total</td><td className="p-3 text-right tabular-nums">{money(aLaCarteCents)}</td><td className="p-3 text-right tabular-nums text-forest">{money(aLaCarteCommission)}</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Retention (drives eligibility) */}
      <section>
        <h2 className="mb-1 font-fraunces text-[20px] font-medium text-forest">Retention &amp; eligibility</h2>
        <p className="mb-3 text-[13px] prose-muted">Commission releases once a client has been retained three months. An administrator releases it.</p>
        {mine.length === 0 ? <p className="text-[15px] prose-muted">No attributed clients yet.</p> : (
          <div className="overflow-x-auto border border-line-warm">
            <table className="w-full min-w-[560px] border-collapse bg-white text-left text-[14px]">
              <thead><tr className="border-b border-line-soft text-ink-faint"><th className="p-3 font-medium">Client</th><th className="p-3 font-medium">Retained since</th><th className="p-3 font-medium">Tenure</th><th className="p-3 font-medium">Commission status</th></tr></thead>
              <tbody>
                {mine.map((c) => {
                  const m = monthsSince(c.retained_since);
                  const eligible = m >= 3;
                  return (
                    <tr key={c.id} className="border-b border-line-soft/60">
                      <td className="p-3 font-medium text-charcoal">{c.business || c.contact || c.email}</td>
                      <td className="p-3 prose-muted">{c.retained_since || "—"}</td>
                      <td className="p-3 prose-muted">{m} mo</td>
                      <td className="p-3">{eligible ? <span className="font-semibold text-forest">Eligible — awaiting admin release</span> : <span className="text-ink-faint">Building tenure ({Math.min(m, 3)}/3 months)</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
