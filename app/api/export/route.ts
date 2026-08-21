import { NextResponse, type NextRequest } from "next/server";
import { getStaffMember, isAdmin } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** CSV export of firm-wide datasets for reporting. Administrator only.
 *  GET /api/export?kind=clients|invoices|expenses */
function csv(rows: (string | number | null | undefined)[][]): string {
  const esc = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(esc).join(",")).join("\r\n");
}
const dollars = (cents: number | null | undefined) => (Number(cents || 0) / 100).toFixed(2);

export async function GET(req: NextRequest) {
  const me = await getStaffMember();
  if (!isAdmin(me)) return NextResponse.json({ error: "Administrators only." }, { status: 403 });
  const kind = req.nextUrl.searchParams.get("kind") || "clients";
  const admin = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);
  let filename = `${kind}-${today}.csv`;
  let out = "";

  if (kind === "clients") {
    const { data } = await admin.from("clients").select("business, contact, email, phone, status, plan, billing_type, retained_since, created_at").order("created_at", { ascending: false });
    out = csv([
      ["Business", "Contact", "Email", "Phone", "Status", "Plan", "Billing", "Retained since", "Created"],
      ...((data ?? []) as any[]).map((c) => [c.business, c.contact, c.email, c.phone, c.status, c.plan, c.billing_type, c.retained_since, String(c.created_at || "").slice(0, 10)]),
    ]);
  } else if (kind === "invoices") {
    const [{ data: inv }, { data: clients }] = await Promise.all([
      admin.from("invoices").select("client_id, kind, status, amount_cents, period_month, paid_at, created_at").order("created_at", { ascending: false }),
      admin.from("clients").select("id, business, contact, email"),
    ]);
    const name = new Map(((clients ?? []) as any[]).map((c) => [c.id, c.business || c.contact || c.email]));
    out = csv([
      ["Client", "Kind", "Status", "Amount (USD)", "Period", "Paid at", "Created"],
      ...((inv ?? []) as any[]).map((i) => [name.get(i.client_id) || i.client_id, i.kind, i.status, dollars(i.amount_cents), i.period_month, String(i.paid_at || "").slice(0, 10), String(i.created_at || "").slice(0, 10)]),
    ]);
  } else if (kind === "expenses") {
    const { data } = await admin.from("expenses").select("incurred_on, category, vendor, description, amount_cents").order("incurred_on", { ascending: false });
    out = csv([
      ["Date", "Category", "Vendor", "Description", "Amount (USD)"],
      ...((data ?? []) as any[]).map((e) => [String(e.incurred_on || "").slice(0, 10), e.category, e.vendor, e.description, dollars(e.amount_cents)]),
    ]);
  } else {
    return NextResponse.json({ error: "Unknown export kind." }, { status: 400 });
  }

  return new NextResponse(out, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
