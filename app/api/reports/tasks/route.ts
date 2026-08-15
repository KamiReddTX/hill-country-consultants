import { NextResponse, type NextRequest } from "next/server";
import { getStaffMember, getClients, isAdmin } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const PERIOD_DAYS: Record<string, number> = { week: 7, biweek: 14, month: 30 };

function cell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Task activity CSV for staff. VA/AM get their own/assigned clients; an admin can
 * pull one client or all clients. Filtered to tasks created in the chosen window.
 */
export async function GET(req: NextRequest) {
  const me = await getStaffMember();
  if (!me) return NextResponse.json({ error: "Staff only" }, { status: 403 });

  const url = new URL(req.url);
  const period = url.searchParams.get("period") || "week";
  const days = PERIOD_DAYS[period] || 7;
  const clientParam = url.searchParams.get("client") || "all";
  const admin = isAdmin(me);

  const clients = await getClients();
  const byId = new Map(clients.map((c) => [c.id, c]));
  const mineOrOpen = (cid: string) => { const c = byId.get(cid); return !!c && (!c.assigned_to || c.assigned_to === me.id); };

  const cutoff = new Date(Date.now() - days * 86400000).toISOString();
  const db = createClient();
  let q = db.from("client_tasks").select("*").gte("created_at", cutoff).order("created_at", { ascending: false });
  if (clientParam && clientParam !== "all") q = q.eq("client_id", clientParam);
  const { data } = await q;

  let rows = data ?? [];
  // Non-admins only ever see their assigned/open clients, regardless of the filter.
  if (!admin) rows = rows.filter((t) => mineOrOpen(t.client_id));

  const name = (cid: string) => byId.get(cid)?.business || byId.get(cid)?.contact || byId.get(cid)?.email || "Client";
  const header = ["Client", "Task", "Status", "Details", "Needed by", "Charge", "Charge status", "Created", "Approved"];
  const lines = [header.map(cell).join(",")];
  for (const t of rows as any[]) {
    lines.push([
      name(t.client_id),
      t.title,
      t.column_name,
      t.details || "",
      t.due_date || "",
      t.charge_cents ? "$" + (t.charge_cents / 100).toFixed(2) : "",
      t.charge_status || "none",
      (t.created_at || "").slice(0, 10),
      t.approved_at ? String(t.approved_at).slice(0, 10) : "",
    ].map(cell).join(","));
  }

  const label = clientParam !== "all" ? (byId.get(clientParam)?.business || "client") : "all-clients";
  const fname = `tasks-${label}-${period}-${new Date().toISOString().slice(0, 10)}.csv`.replace(/[^\w.\-]+/g, "_");
  return new NextResponse(lines.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${fname}"` },
  });
}
