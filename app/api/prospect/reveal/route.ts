import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStaff } from "@/lib/auth";
import { getContactVendor } from "@/lib/prospecting/vendors";

export const runtime = "nodejs";

/**
 * Reveal one contact field (email / phone_direct / phone_mobile). All gating —
 * capability, suppression scrub, do-not-contact, cache (0 credits), and the
 * credit debit — happens atomically inside the prospect_reveal() DB function.
 * This route only supplies a candidate value from the active vendor for a fresh
 * reveal; which vendor runs is chosen by env (see lib/prospecting/vendors.ts).
 * Default is the stub; set PROSPECT_CONTACT_VENDOR=hunter + HUNTER_API_KEY to
 * return real verified emails. A vendor miss returns no value → no credit spent.
 */
const FIELDS = ["email", "phone_direct", "phone_mobile"] as const;

export async function POST(req: Request) {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: any = {};
  try { body = await req.json(); } catch {}
  const contactId = typeof body.contact_id === "string" ? body.contact_id : "";
  const field = String(body.field || "");
  if (!contactId || !FIELDS.includes(field as any)) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const db = createClient();
  // Fetch the contact + its account domain to synthesize a candidate value.
  const { data: c } = await db.from("prospect_contacts").select("id,first_name,last_name,account_id").eq("id", contactId).maybeSingle();
  if (!c) return NextResponse.json({ error: "not_found" }, { status: 404 });
  let domain: string | null = null; let company: string | null = null;
  if ((c as any).account_id) {
    const { data: a } = await db.from("prospect_accounts").select("domain,legal_name").eq("id", (c as any).account_id).maybeSingle();
    domain = (a as any)?.domain || null; company = (a as any)?.legal_name || null;
  }
  const vend = getContactVendor();
  const { value: candidate, vendor } = await vend.lookup(field as any, {
    contact_id: contactId, first_name: (c as any).first_name, last_name: (c as any).last_name, domain, company,
  });

  // Atomic meter: capability + suppression + cache + credit debit + store.
  const { data, error } = await db.rpc("prospect_reveal", { p_contact: contactId, p_field: field, p_value: candidate ?? "", p_vendor: vendor });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const res = (data || {}) as any;

  const map: Record<string, { code: number; message: string }> = {
    forbidden: { code: 403, message: "Your role does not have reveal access." },
    do_not_contact: { code: 409, message: "This contact is marked do-not-contact." },
    suppressed: { code: 409, message: "That number/email is on a suppression list and cannot be revealed." },
    no_credits: { code: 402, message: "You’re out of reveal credits for this month." },
    not_found: { code: 404, message: "Contact not found." },
    bad_field: { code: 400, message: "Unknown field." },
    no_value: { code: 422, message: "No value available to reveal." },
  };
  if (res.status === "revealed" || res.status === "cache") {
    return NextResponse.json({ ok: true, value: res.value, cache: res.status === "cache", remaining: res.remaining ?? null });
  }
  const m = map[res.status] || { code: 400, message: "Reveal failed." };
  return NextResponse.json({ ok: false, status: res.status, message: m.message }, { status: m.code });
}
