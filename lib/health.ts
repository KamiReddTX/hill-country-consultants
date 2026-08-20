/** Client renewal date + a simple health rating from payment and activity
 *  signals. Kept dependency-free so pages can compute it inline. */

/** The renewal date: a manual override if set, else retained_since + 12 months. */
export function renewalDate(retainedSince: string | null | undefined, override: string | null | undefined): string | null {
  if (override) return override;
  if (!retainedSince) return null;
  const d = new Date(`${String(retainedSince).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

/** Whole days from today until an ISO date (negative = past). */
export function daysUntil(dateISO: string | null): number | null {
  if (!dateISO) return null;
  const target = new Date(`${dateISO}T00:00:00`).getTime();
  const today = new Date(new Date().toDateString()).getTime();
  if (Number.isNaN(target)) return null;
  return Math.round((target - today) / 86_400_000);
}

export type HealthRating = "Healthy" | "Watch" | "At risk";
export type Health = { rating: HealthRating; reasons: string[] };

export function computeHealth(opts: {
  suspended: boolean;
  overdue: boolean;       // an invoice past its due date, unpaid
  open: boolean;          // an unpaid invoice not yet overdue
  status: string;         // client status
  lastActivityDays: number | null; // days since last work-log entry
}): Health {
  const reasons: string[] = [];
  let rating: HealthRating = "Healthy";
  const bump = (r: HealthRating) => { if (r === "At risk" || (r === "Watch" && rating === "Healthy")) rating = r; };

  if (opts.suspended) { reasons.push("Suspended"); bump("At risk"); }
  if (opts.overdue) { reasons.push("Overdue invoice"); bump("At risk"); }
  if (opts.open && !opts.overdue) { reasons.push("Open invoice"); bump("Watch"); }
  if (opts.status === "Active" && opts.lastActivityDays != null && opts.lastActivityDays >= 30) {
    reasons.push(`No activity ${opts.lastActivityDays}d`); bump("Watch");
  }
  if (reasons.length === 0) reasons.push("On track");
  return { rating, reasons };
}
