import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStaff } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Prospect search. Server-side only — the browser never queries prospect_contacts
 * directly. Filters + counting run here against the RLS-scoped authed client
 * (prospect_accounts is readable only by staff whose role maps to can_search).
 * Contact fields are NEVER returned here; each row carries a masked summary only.
 * The reveal endpoint is the sole path that returns an email or phone.
 */
type Filters = {
  q?: string;
  state?: string[]; county?: string[]; city?: string; zip?: string[];
  yearsMin?: number; yearsMax?: number; locationType?: "HQ" | "branch";
  industry?: string; naics?: string;
  employeeMin?: number; employeeMax?: number; revenueMin?: number; revenueMax?: number;
  formedAfter?: string; formedBefore?: string;
  hasEmail?: boolean; hasPhone?: boolean;
};

const num = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : undefined);
const str = (v: unknown, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);
const strArr = (v: unknown, max = 40) => Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean).slice(0, max) as string[] : undefined;

export async function POST(req: Request) {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = createClient();
  // Capability gate: role (or any of roles[]) must map to can_search in role_permissions.
  const titles = [staff.role, ...((staff.roles as string[] | null) || [])].filter(Boolean);
  const { data: perms } = await db.from("role_permissions").select("can_search,role_title").in("role_title", titles);
  if (!(perms || []).some((p: any) => p.can_search)) {
    return NextResponse.json({ error: "forbidden", message: "Your role does not have prospecting search access." }, { status: 403 });
  }

  let body: any = {};
  try { body = await req.json(); } catch { /* empty search = all */ }
  const f: Filters = body.filters || {};
  const page = Math.max(1, Math.floor(num(body.page) || 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(num(body.pageSize) || 25)));

  let q = db
    .from("prospect_accounts")
    .select(
      "id,legal_name,dba_name,domain,industry,naics_code,city,state,county,zip,employee_est,revenue_est,years_in_business,location_type,formation_date,icp_score,status",
      { count: "exact" },
    );

  const qStr = str(f.q, 120); if (qStr) q = q.ilike("legal_name", `%${qStr}%`);
  const states = strArr(f.state); if (states?.length) q = q.in("state", states.map((s) => s.toUpperCase()));
  const counties = strArr(f.county); if (counties?.length) q = q.in("county", counties);
  const city = str(f.city); if (city) q = q.ilike("city", city);
  const zips = strArr(f.zip); if (zips?.length) q = q.in("zip", zips);
  if (f.locationType === "HQ" || f.locationType === "branch") q = q.eq("location_type", f.locationType);
  const industry = str(f.industry); if (industry) q = q.ilike("industry", `%${industry}%`);
  const naics = str(f.naics, 10); if (naics) q = q.ilike("naics_code", `${naics}%`);
  if (num(f.yearsMin) !== undefined) q = q.gte("years_in_business", f.yearsMin!);
  if (num(f.yearsMax) !== undefined) q = q.lte("years_in_business", f.yearsMax!);
  if (num(f.employeeMin) !== undefined) q = q.gte("employee_est", f.employeeMin!);
  if (num(f.employeeMax) !== undefined) q = q.lte("employee_est", f.employeeMax!);
  if (num(f.revenueMin) !== undefined) q = q.gte("revenue_est", f.revenueMin!);
  if (num(f.revenueMax) !== undefined) q = q.lte("revenue_est", f.revenueMax!);
  const after = str(f.formedAfter, 10); if (after) q = q.gte("formation_date", after);
  const before = str(f.formedBefore, 10); if (before) q = q.lte("formation_date", before);

  q = q
    .order("formation_date", { ascending: false, nullsFirst: false })
    .range((page - 1) * pageSize, (page - 1) * pageSize + pageSize - 1);

  const { data, count, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Contact rows arrive with Track B (licensed vendor). Until then the masked
  // summary is empty. When contacts exist this is where has_email/has_phone/
  // contact_count get aggregated — still never returning the raw values.
  const rows = (data || []).map((a: any) => ({ ...a, contact_count: 0, has_email: false, has_phone: false }));
  return NextResponse.json({ rows, total: count ?? 0, page, pageSize });
}
