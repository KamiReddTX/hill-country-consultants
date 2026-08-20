import { COMMISSION } from "@/content/commission";

/** A rep's running income + commission, computed from the money actually
 *  collected on the clients attributed to their employee code.
 *
 *  Income sources:
 *   - Paid bookings (à-la-carte, one-time Stripe checkouts)   → 10%
 *   - Paid project / overage invoices (à-la-carte)            → 10%
 *   - First paid plan invoice per client (the initial sale)   → 15%
 *   - Later paid plan invoices per client (recurring)         → 10%
 */
export type RepEarnings = {
  incomeCents: number;
  aLaCarteCents: number;
  initialCents: number;
  recurringCents: number;
  commissionCents: number;
  clientCount: number;
};

const norm = (s?: string | null) => (s ?? "").trim().toUpperCase();

export function computeRepEarnings(opts: {
  employeeCode?: string | null;
  clients: { id: string; rep_code?: string | null }[];
  bookings: { client_id?: string | null; paid_cents?: number | null }[];
  invoices: { client_id: string; kind: string; status: string; amount_cents: number; period_month?: string | null }[];
}): RepEarnings {
  const my = norm(opts.employeeCode);
  const myClientIds = new Set(
    my ? opts.clients.filter((c) => norm(c.rep_code) === my).map((c) => c.id) : [],
  );

  // À-la-carte: attributed bookings + attributed project/overage invoices.
  let aLaCarteCents = opts.bookings
    .filter((b) => b.client_id && myClientIds.has(b.client_id))
    .reduce((s, b) => s + Number(b.paid_cents || 0), 0);

  const myPaid = opts.invoices.filter((i) => i.status === "paid" && myClientIds.has(i.client_id));
  aLaCarteCents += myPaid
    .filter((i) => i.kind !== "plan")
    .reduce((s, i) => s + Number(i.amount_cents || 0), 0);

  // Plan invoices: earliest paid plan per client is the initial sale (15%),
  // every later paid plan is recurring (10%).
  const planByClient = new Map<string, { period: string; cents: number }[]>();
  for (const i of myPaid.filter((i) => i.kind === "plan")) {
    const arr = planByClient.get(i.client_id) || [];
    arr.push({ period: i.period_month || "", cents: Number(i.amount_cents || 0) });
    planByClient.set(i.client_id, arr);
  }
  let initialCents = 0, recurringCents = 0;
  for (const arr of planByClient.values()) {
    arr.sort((a, b) => a.period.localeCompare(b.period));
    arr.forEach((r, idx) => { if (idx === 0) initialCents += r.cents; else recurringCents += r.cents; });
  }

  const commissionCents =
    Math.round(initialCents * (COMMISSION.initialPct / 100)) +
    Math.round(recurringCents * (COMMISSION.recurringPct / 100)) +
    Math.round(aLaCarteCents * (COMMISSION.aLaCartePct / 100));

  return {
    incomeCents: aLaCarteCents + initialCents + recurringCents,
    aLaCarteCents, initialCents, recurringCents, commissionCents,
    clientCount: myClientIds.size,
  };
}
