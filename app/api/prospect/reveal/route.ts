import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStaff } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Reveal one contact field (email / phone_direct / phone_mobile). All gating —
 * capability, suppression scrub, do-not-contact, cache (0 credits), and the
 * credit debit — happens atomically inside the prospect_reveal() DB function.
 * This route only supplies a candidate value from the vendor for a fresh reveal.
 *
 * ⚠ VENDOR IS STUBBED. `vendorLookup` returns a synthesized placeholder (emails
 * from name+domain; phones in the reserved fictional 555-01xx range so nothing
 * real is ever dialed). To go live, replace vendorLookup with the licensed
 * vendor's API call (PDL / Coresignal / Apollo / waterfall) and set VENDOR.
 */
const VENDOR = "stub";
const FIELDS = ["email", "phone_direct", "phone_mobile"] as const;

function vendorLookup(field: string, c: { id: string; first_name?: string | null; last_name?: string | null }, domain?: string | null): string {
  const fn = (c.first_name || "").toLowerCase().replace(/[^a-z]/g, "");
  const ln = (c.last_name || "").toLowerCase().replace(/[^a-z]/g, "");
  if (field === "email") return `${fn || "contact"}.${ln || "x"}@${(domain || "example.com").toLowerCase()}`;
  const h = [...c.id].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return `+1 (555) 01${h % 10}-${String(1000 + (h % 9000))}`; // 555-01xx: reserved/fictional
}

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
  let domain: string | null = null;
  if ((c as any).account_id) {
    const { data: a } = await db.from("prospect_accounts").select("domain").eq("id", (c as any).account_id).maybeSingle();
    domain = (a as any)?.domain || null;
  }
  const candidate = vendorLookup(field, c as any, domain);

  // Atomic meter: capability + suppression + cache + credit debit + store.
  const { data, error } = await db.rpc("prospect_reveal", { p_contact: contactId, p_field: field, p_value: candidate, p_vendor: VENDOR });
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
