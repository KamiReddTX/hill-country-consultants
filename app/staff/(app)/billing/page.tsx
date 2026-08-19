import { redirect } from "next/navigation";
import { getStaffMember, isPrivileged, getClients } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase/server";
import { money } from "@/lib/portal";
import { monthKey } from "@/lib/allotments";
import { LocalTime } from "@/components/local-time";
import { GenerateInvoicesForm } from "@/components/staff/generate-invoices-form";
import { CreateInvoiceForm } from "@/components/staff/create-invoice-form";
import { InvoiceControls } from "@/components/staff/invoice-controls";

export const dynamic = "force-dynamic";

/** Billing & accounts receivable — plan invoicing and one-off charges.
 *  Admin / Business Manager only (mirrors the is_biller() SQL policy). */
export default async function BillingPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isPrivileged(me)) redirect("/staff");

  const admin = createServiceClient();
  const [clients, { data: invoices }] = await Promise.all([
    getClients(),
    admin.from("invoices").select("*").order("created_at", { ascending: false }).limit(500),
  ]);
  const label = new Map(clients.map((c) => [c.id, c.business || c.contact || c.email]));
  const clientOpts = clients.map((c) => ({ id: c.id, label: c.business || c.contact || c.email }));
  const rows = invoices ?? [];

  const outstanding = rows.filter((r: any) => r.status === "draft" || r.status === "sent");
  const outstandingCents = outstanding.reduce((s: number, r: any) => s + Number(r.amount_cents || 0), 0);
  const thisMonth = monthKey();
  const paidThisMonthCents = rows
    .filter((r: any) => r.status === "paid" && String(r.paid_at || "").slice(0, 7) === thisMonth)
    .reduce((s: number, r: any) => s + Number(r.amount_cents || 0), 0);
  const planClients = clients.filter((c) => (c as any).plan).length;

  const Stat = ({ label, value }: { label: string; value: string }) => (
    <div className="border border-line-warm bg-white p-3">
      <p className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-1 font-fraunces text-[24px] text-forest">{value}</p>
    </div>
  );
  const statusChip = (s: string) => {
    const map: Record<string, string> = { draft: "text-ink-faint", sent: "text-amber-700", paid: "text-forest", void: "text-ink-faint line-through" };
    return <span className={`text-[11px] font-semibold uppercase tracking-wide ${map[s] || ""}`}>{s}</span>;
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Billing &amp; AR</h1>
        <span className="rule-gold mb-2 mt-2" />
        <p className="max-w-[54em] text-[13px] prose-muted">
          Raise and track invoices here. Each client gets one invoice per billing month — they can pay it in full or split it into
          part-payments on their end. Draft this month&rsquo;s plan invoices in one click, add one-off overage or project charges,
          then attach a Stripe payment link and mark each invoice paid as it clears. Everything is billed through the Stripe secure
          payment system; use &ldquo;Paid (manual)&rdquo; only for payments taken outside Stripe.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Outstanding" value={money(outstandingCents)} />
        <Stat label="Open invoices" value={String(outstanding.length)} />
        <Stat label="Collected this month" value={money(paidThisMonthCents)} />
        <Stat label="Clients on a plan" value={String(planClients)} />
      </div>

      <section className="border border-line-warm bg-white p-4">
        <p className="mb-1 text-[13px] font-semibold text-forest">Monthly plan invoices</p>
        <p className="mb-3 text-[12px] prose-muted">Drafts one invoice per plan client for the chosen month at their tier&rsquo;s fee. Skips comp/barter clients and any client already invoiced for that month.</p>
        <GenerateInvoicesForm defaultMonth={thisMonth} />
      </section>

      <section className="border border-line-warm bg-white p-4">
        <p className="mb-1 text-[13px] font-semibold text-forest">One-off invoice</p>
        <p className="mb-3 text-[12px] prose-muted">For overage (beyond-allotment work) or a standalone project.</p>
        <CreateInvoiceForm clients={clientOpts} />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold text-forest">All invoices</p>
        <div className="overflow-x-auto border border-line-warm">
          <table className="w-full min-w-[820px] border-collapse bg-white text-left text-[13px]">
            <thead>
              <tr className="border-b border-line-soft text-ink-faint">
                <th className="p-3 font-medium">Invoice</th>
                <th className="p-3 font-medium">Client</th>
                <th className="p-3 font-medium">For</th>
                <th className="p-3 font-medium">Amount</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-b border-line-soft/60 align-top">
                  <td className="p-3">
                    <span className="font-medium text-charcoal">{r.number}</span>
                    <span className="block text-[11px] text-ink-faint capitalize">{r.kind}{r.due_date ? ` · due ${r.due_date}` : ""}</span>
                  </td>
                  <td className="p-3 prose-soft">{label.get(r.client_id) || "—"}</td>
                  <td className="p-3 prose-muted">{r.description || (r.period_month ? String(r.period_month).slice(0, 7) : "—")}</td>
                  <td className="p-3 font-medium text-charcoal">{money(r.amount_cents)}</td>
                  <td className="p-3">{statusChip(r.status)}{r.paid_at && <span className="block text-[11px] text-ink-faint">{r.paid_method} · <LocalTime iso={r.paid_at} mode="date" /></span>}</td>
                  <td className="p-3"><InvoiceControls id={r.id} status={r.status} payUrl={r.pay_url} /></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="p-3 prose-muted">No invoices yet. Draft this month&rsquo;s plan invoices to begin.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
