import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export const runtime = "nodejs";

/**
 * Public strategy-session inquiry → a lead row.
 * Uses the service-role key (server only) so the public form can write a lead
 * past RLS. `referral` is stored as rep_code — the field the commission and
 * follow-up screens filter on, so a rep who enrols someone here is credited.
 *
 * Before the write we do lightweight, dependency-free abuse protection: a hidden
 * honeypot (`company_website`) silently drops bots, a basic email check rejects
 * clearly invalid input, and field lengths are capped. `persisted` is true only
 * when the row was actually saved — the form shows its email/phone fallback on
 * anything else rather than a false confirmation.
 */
export async function POST(req: Request) {
  let body: Record<string, string> = {};
  try {
    body = await req.json();
  } catch {
    /* ignore malformed body */
  }

  const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  // Honeypot: a hidden field real visitors never fill. If it's set, accept the
  // request so the bot moves on, but never write the row.
  if (clean(body.hp_field_x)) return NextResponse.json({ ok: true, persisted: false });

  // Cap field lengths so a bad actor can't bloat the row (no external deps).
  const cap = (v: unknown, max: number) => clean(v).slice(0, max);
  const name = cap(body.name, 200);
  const business = cap(body.business, 200);
  const email = cap(body.email, 200);
  const phone = cap(body.phone, 200);
  const industry = cap(body.industry, 200);
  const timeline = cap(body.timeline, 200);
  const heard = cap(body.howHeard, 200);
  const referral = cap(body.referral, 200);
  const message = cap(body.message, 4000);

  // Reject a clearly invalid email so we don't store an uncontactable lead.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, persisted: false, error: "invalid_email" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ ok: true, persisted: false });

  const pain = [message, heard ? `Heard about us: ${heard}` : ""].filter(Boolean).join("\n\n");

  try {
    const admin = createClient<Database>(url, key, { auth: { persistSession: false } });
    const { error } = await admin.from("leads").insert({
      business: business || null,
      contact: name || null,
      email: email || null,
      phone: phone || null,
      industry: industry || null,
      timeline: timeline || null,
      pain: pain || null,
      rep_code: referral || null,
      stage: "New lead",
    });
    return NextResponse.json({ ok: true, persisted: !error });
  } catch {
    return NextResponse.json({ ok: true, persisted: false });
  }
}
