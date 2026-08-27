import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStaff } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Promote prospect companies into the existing `leads` pipeline. Maps company
 * firmographics into a lead, stamps the rep's name + code, and skips duplicates
 * (same business already promoted by the same rep). Contact fields stay empty
 * until a reveal happens — promotion is company-level. The prospect row is
 * marked 'promoted' so it can be flagged in search later.
 */
export async function POST(req: Request) {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = createClient();
  const titles = [staff.role, ...((staff.roles as string[] | null) || [])].filter(Boolean);
  const { data: perms } = await db.from("role_permissions").select("can_search").in("role_title", titles);
  if (!(perms || []).some((p: any) => p.can_search)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body: any = {};
  try { body = await req.json(); } catch {}
  const ids: string[] = Array.isArray(body.account_ids)
    ? body.account_ids.filter((x: unknown) => typeof x === "string").slice(0, 200)
    : [];
  if (ids.length === 0) return NextResponse.json({ error: "no_accounts" }, { status: 400 });

  // Read the companies the rep is allowed to see (RLS-scoped authed client).
  const { data: accounts } = await db
    .from("prospect_accounts")
    .select("id,legal_name,industry,city,state")
    .in("id", ids);
  if (!accounts || accounts.length === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const admin = createServiceClient();
  const repName = staff.name || staff.email;
  const repCode = staff.employee_code || null;

  // Duplicate guard: a lead with the same business already promoted by this rep.
  const names = accounts.map((a: any) => a.legal_name);
  const { data: existing } = await admin.from("leads").select("business").in("business", names).eq("rep_name", repName);
  const already = new Set((existing || []).map((e: any) => (e.business || "").toLowerCase()));

  const toInsert = accounts
    .filter((a: any) => !already.has((a.legal_name || "").toLowerCase()))
    .map((a: any) => ({
      business: a.legal_name,
      industry: a.industry || null,
      lead_with: "Prospecting",
      stage: "New lead",
      next_step: "Initial outreach",
      rep_name: repName,
      rep_code: repCode,
    }));

  let inserted = 0;
  if (toInsert.length) {
    const { error, count } = await admin.from("leads").insert(toInsert as any, { count: "exact" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    inserted = count ?? toInsert.length;
    // Mark the promoted prospects (service role; write is admin/service only).
    await admin.from("prospect_accounts").update({ status: "promoted" }).in("id", accounts.filter((a: any) => !already.has((a.legal_name || "").toLowerCase())).map((a: any) => a.id));
  }
  return NextResponse.json({ ok: true, inserted, skipped: accounts.length - inserted });
}
