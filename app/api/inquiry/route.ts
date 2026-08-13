import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export const runtime = "nodejs";

/**
 * Public strategy-session inquiry → a lead row.
 * Uses the service-role key (server only) so the public form can write a lead
 * past RLS. `referral` is stored as rep_code — the field the commission and
 * follow-up screens filter on, so a rep who enrols someone here is credited.
 * If the server isn't fully configured yet (no service-role key), the request
 * is accepted without persisting so the form still confirms for the visitor.
 */
export async function POST(req: Request) {
  let body: Record<string, string> = {};
  try {
    body = await req.json();
  } catch {
    /* ignore malformed body */
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ ok: true, persisted: false });

  const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const heard = clean(body.howHeard);
  const message = clean(body.message);
  const pain = [message, heard ? `Heard about us: ${heard}` : ""].filter(Boolean).join("\n\n");

  try {
    const admin = createClient<Database>(url, key, { auth: { persistSession: false } });
    const { error } = await admin.from("leads").insert({
      business: clean(body.business) || null,
      contact: clean(body.name) || null,
      email: clean(body.email) || null,
      phone: clean(body.phone) || null,
      industry: clean(body.industry) || null,
      timeline: clean(body.timeline) || null,
      pain: pain || null,
      rep_code: clean(body.referral) || null,
      stage: "New lead",
    });
    return NextResponse.json({ ok: true, persisted: !error });
  } catch {
    return NextResponse.json({ ok: true, persisted: false });
  }
}
