/**
 * Sales commission structure (firm policy).
 * Commission is paid only after a client has been retained three months, and is
 * released by an administrator.
 */
export const COMMISSION = {
  initialPct: 15, // % of the initial sale (first plan/engagement)
  recurringPct: 10, // % of recurring (renewal) plan revenue
  aLaCartePct: 10, // % of standalone à-la-carte sales
} as const;

export const COMMISSION_LINES: { t: string; pct: number; d: string }[] = [
  { t: "Initial sale", pct: COMMISSION.initialPct, d: "The first plan or engagement a client signs." },
  { t: "Recurring sales", pct: COMMISSION.recurringPct, d: "Renewal / ongoing monthly plan revenue." },
  { t: "À-la-carte sales", pct: COMMISSION.aLaCartePct, d: "Standalone bookings and one-off projects." },
];
