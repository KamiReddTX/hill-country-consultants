import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getStaff } from "@/lib/auth";

export const runtime = "nodejs";

const bool = (v: unknown) => v === true || v === "true";
const int = (v: unknown, d = 0) => (Number.isFinite(Number(v)) ? Math.max(0, Math.floor(Number(v))) : d);

/** Admin actions for the prospecting module. Admin-gated; all writes service-role. */
export async function POST(req: Request) {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = createServiceClient();
  const titles = [staff.role, ...((staff.roles as string[] | null) || [])].filter(Boolean);
  const { data: perms } = await db.from("role_permissions").select("can_admin").in("role_title", titles);
  if (!(perms || []).some((p: any) => p.can_admin)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body: any = {};
  try { body = await req.json(); } catch {}
  const action = String(body.action || "");

  if (action === "role_perm") {
    const title = String(body.role_title || "").trim().slice(0, 80);
    if (!title) return NextResponse.json({ error: "no_role" }, { status: 400 });
    const { error } = await db.from("role_permissions").upsert({
      role_title: title, can_search: bool(body.can_search), can_reveal: bool(body.can_reveal),
      can_export: bool(body.can_export), can_admin: bool(body.can_admin), monthly_credit_default: int(body.monthly_credit_default),
    } as any, { onConflict: "role_title" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (action === "set_credits") {
    const staff_id = String(body.staff_id || "");
    const period_month = String(body.period_month || "").slice(0, 10);
    if (!staff_id || !period_month) return NextResponse.json({ error: "bad_args" }, { status: 400 });
    const { error } = await db.from("credit_allowance").upsert({ staff_id, period_month, credits: int(body.credits) } as any, { onConflict: "staff_id,period_month" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (action === "suppress_phone") {
    const reason = ["national_dnc", "internal_dnc", "state_dnc", "wireless", "litigator"].includes(body.reason) ? body.reason : "internal_dnc";
    const phones = String(body.text || "").split(/[\s,;]+/).map((p: string) => p.replace(/[^0-9+]/g, "")).filter((p: string) => p.length >= 7).slice(0, 5000);
    if (phones.length === 0) return NextResponse.json({ error: "no_phones" }, { status: 400 });
    const rows = [...new Set(phones)].map((phone) => ({ phone, reason }));
    const { error } = await db.from("phone_suppression").upsert(rows as any, { onConflict: "phone" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, added: rows.length });
  }

  if (action === "suppress_email") {
    const reason = ["unsubscribed", "complained", "bounced", "client", "competitor"].includes(body.reason) ? body.reason : "unsubscribed";
    const tokens = String(body.text || "").split(/[\s,;]+/).map((t: string) => t.trim().toLowerCase()).filter(Boolean).slice(0, 5000);
    const rows = [...new Set(tokens)].map((t) => (t.includes("@") ? { email: t, reason } : { domain: t, reason }));
    if (rows.length === 0) return NextResponse.json({ error: "no_emails" }, { status: 400 });
    const { error } = await db.from("email_suppression").insert(rows as any);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, added: rows.length });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
