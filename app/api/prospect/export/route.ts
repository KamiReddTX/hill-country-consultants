import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStaff } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Export a lead list to CSV. Company-level firmographics only — contact fields
 * are never exported here (reveal is the sole path, and suppressed numbers can
 * never leave). Every export writes an `exports` audit row (row count, fields,
 * IP). Requires can_export.
 */
const FIELDS = [
  "legal_name", "dba_name", "domain", "industry", "naics_code",
  "street", "city", "state", "county", "zip",
  "employee_est", "revenue_est", "years_in_business", "location_type", "formation_date", "status",
];

const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function POST(req: Request) {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = createClient();
  const titles = [staff.role, ...((staff.roles as string[] | null) || [])].filter(Boolean);
  const { data: perms } = await db.from("role_permissions").select("can_export").in("role_title", titles);
  if (!(perms || []).some((p: any) => p.can_export)) {
    return NextResponse.json({ error: "forbidden", message: "Your role does not have export access." }, { status: 403 });
  }

  let body: any = {};
  try { body = await req.json(); } catch {}
  const listId = typeof body.list_id === "string" ? body.list_id : "";
  if (!listId) return NextResponse.json({ error: "no_list" }, { status: 400 });

  // Members -> accounts (RLS ensures the caller may see this list + the base layer).
  const { data: members } = await db.from("lead_list_members").select("account_id").eq("list_id", listId);
  const ids = [...new Set((members || []).map((m: any) => m.account_id).filter(Boolean))];
  if (ids.length === 0) return NextResponse.json({ error: "empty_list" }, { status: 400 });

  const rows: any[] = [];
  for (let i = 0; i < ids.length; i += 500) {
    const { data } = await db.from("prospect_accounts").select(FIELDS.join(",")).in("id", ids.slice(i, i + 500));
    (data || []).forEach((r) => rows.push(r));
  }

  const header = FIELDS.join(",");
  const lines = rows.map((r) => FIELDS.map((f) => csvCell(r[f])).join(","));
  const csv = [header, ...lines].join("\r\n");

  // Audit row (service role — exports insert is server-side).
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null;
  await createServiceClient().from("exports").insert({
    staff_id: staff.id, list_id: listId, row_count: rows.length, fields: FIELDS, file_format: "csv", ip_address: ip,
  } as any);

  const safe = `prospects-${listId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}`;
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safe}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
