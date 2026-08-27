import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStaff } from "@/lib/auth";

export const runtime = "nodejs";

/** Save the current filter set as a named search (own row; RLS enforces
 *  staff_id = current_staff_id on insert). */
export async function POST(req: Request) {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: any = {};
  try { body = await req.json(); } catch {}
  const name = (typeof body.name === "string" ? body.name : "").trim().slice(0, 120) || "Untitled search";
  const filters = body.filters && typeof body.filters === "object" ? body.filters : {};
  const result_count = Number.isFinite(body.result_count) ? Math.max(0, Math.floor(body.result_count)) : null;
  const shared_team = body.shared_team === true;

  const db = createClient();
  const { data, error } = await db
    .from("saved_searches")
    .insert({ staff_id: staff.id, name, filters, result_count, shared_team, last_run_at: new Date().toISOString() } as any)
    .select("id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, id: (data as any)?.id });
}
