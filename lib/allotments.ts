import { ALLOTMENT_LINES, allotmentFor, type AllotKey } from "@/content/pricing";

/** One service line's monthly picture for a client. `allot` is null when the
 *  client is off-plan. `auto` is data-derived (VA hours from the work log),
 *  `manual` is the sum of staff adjustments. */
export type AllotUsage = {
  key: AllotKey; label: string; unit: string;
  allot: number | null; auto: number; manual: number; used: number;
  remaining: number | null; over: boolean;
};

/** Current month as 'YYYY-MM' (server-local, which the app treats as its ops time). */
export const monthKey = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/** First day of a 'YYYY-MM' month as an ISO date, for period_month columns. */
export const monthStart = (ym: string) => `${ym}-01`;

/** Build the per-line usage table for a client in a given month. */
export function computeAllotmentUsage(
  plan: string | null | undefined,
  vaHoursThisMonth: number,
  adjustments: { service_key: string; delta: number }[],
): AllotUsage[] {
  return ALLOTMENT_LINES.map((line) => {
    const allot = allotmentFor(plan, line.key);
    const auto = line.key === "va_hours" ? Number(vaHoursThisMonth || 0) : 0;
    const manual = adjustments
      .filter((a) => a.service_key === line.key)
      .reduce((s, a) => s + Number(a.delta || 0), 0);
    const used = auto + manual;
    const remaining = allot == null ? null : allot - used;
    return { key: line.key, label: line.label, unit: line.unit, allot, auto, manual, used, remaining, over: remaining != null && remaining < 0 };
  });
}
