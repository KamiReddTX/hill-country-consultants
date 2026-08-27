import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStaff } from "@/lib/auth";

export const runtime = "nodejs";

/** Add companies to a lead list. Creates a new named list (or appends to an
 *  existing one the caller owns) and inserts members. RLS enforces ownership. */
export async function POST(req: Request) {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: any = {};
  try { body = await req.json(); } catch {}
  const accountIds: string[] = Array.isArray(body.account_ids)
    ? body.account_ids.filter((x: unknown) => typeof x === "string").slice(0, 500)
    : [];
  if (accountIds.length === 0) return NextResponse.json({ error: "no_accounts" }, { status: 400 });

  const db = createClient();
  let listId: string | undefined = typeof body.list_id === "string" ? body.list_id : undefined;

  if (!listId) {
    const name = (typeof body.name === "string" ? body.name : "").trim().slice(0, 120) || "New list";
    const { data, error } = await db
      .from("lead_lists")
      .insert({ staff_id: staff.id, name } as any)
      .select("id")
      .maybeSingle();
    if (error || !data) return NextResponse.json({ error: error?.message || "list_create_failed" }, { status: 400 });
    listId = (data as any).id;
  }

  const members = accountIds.map((account_id) => ({ list_id: listId, account_id }));
  const { error: mErr } = await db.from("lead_list_members").insert(members as any);
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 400 });
  return NextResponse.json({ ok: true, list_id: listId, added: accountIds.length });
}
