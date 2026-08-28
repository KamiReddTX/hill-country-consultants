import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { sendLeadAlert } from "@/lib/email";

export const runtime = "nodejs";

const NOTIFY_ROLES = ["Administrator", "Business Manager", "Accounts Manager", "Sales Manager"];
async function notifyRecipients(admin: ReturnType<typeof createClient<Database>>): Promise<string[]> {
  const { data } = await admin.from("staff").select("email, role, roles").eq("active", true);
  const list = (data ?? [])
    .filter((s: any) => NOTIFY_ROLES.includes(s.role) || (Array.isArray(s.roles) && s.roles.some((r: string) => NOTIFY_ROLES.includes(r))))
    .map((s: any) => s.email).filter(Boolean) as string[];
  // Always copy the firm's shared notification inbox, in addition to matched staff.
  const always = process.env.ADMIN_NOTIFY_EMAIL || "info@hillcountryconsultants.com";
  return Array.from(new Set([...list, always]));
}

/**
 * Quote-only booking → a lead row.
 * A booking with no payable (fixed-rate) items is a written-quote request, not a
 * charge, so there's no Stripe session and the webhook never runs. It writes a
 * lead with the service-role key (server only) so the public /book form can
 * persist past RLS — mirroring app/api/inquiry/route.ts. The selected quote
 * items, any fixed items, requested start date and notes are folded into `pain`
 * so staff read the full scope on the lead. `referral` rides in as rep_code so a
 * rep who scopes someone here is credited. If the server isn't configured yet
 * (no service-role key) it reports persisted:false so the client shows the
 * email/phone fallback instead of a false confirmation.
 */
export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    /* ignore malformed body */
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ ok: true, persisted: false });

  const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const contact = body.contact || {};
  const quotes: { id?: string; name?: string }[] = Array.isArray(body.quotes) ? body.quotes : [];
  const items: { id?: string; name?: string; qty?: number }[] = Array.isArray(body.items) ? body.items : [];

  // Everything the visitor selected, in plain text, so staff read the scope on the lead.
  const pain = [
    quotes.length ? `Quote requests: ${quotes.map((q) => `${clean(q.name) || clean(q.id)} (${clean(q.id)})`).join("; ")}` : "",
    items.length
      ? `Fixed-rate items: ${items
          .map((i) => `${clean(i.name) || clean(i.id)}${i.qty && i.qty > 1 ? ` × ${i.qty}` : ""} (${clean(i.id)})`)
          .join("; ")}`
      : "",
    clean(body.className)
      ? `Class: ${clean(body.className)}${clean(body.classDate) ? ` — ${clean(body.classDate)}` : ""}${clean(body.classSlot) ? ` ${clean(body.classSlot)}` : ""}`
      : "",
    clean(body.startDate) ? `Requested start: ${clean(body.startDate)}` : "",
    clean(contact.notes) ? `Notes: ${clean(contact.notes)}` : "",
    clean(body.consentAt) ? `Acknowledged: ${clean(body.consentAt)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const admin = createClient<Database>(url, key, { auth: { persistSession: false } });
    const { error } = await admin.from("leads").insert({
      business: clean(contact.business) || null,
      contact: clean(contact.name) || null,
      email: clean(contact.email) || null,
      phone: clean(contact.phone) || null,
      timeline: clean(body.startDate) || null,
      pain: pain || null,
      rep_code: clean(body.repCode) || null,
      stage: "New lead",
    });
    if (!error) {
      try {
        const to = await notifyRecipients(admin);
        const site = process.env.NEXT_PUBLIC_SITE_URL || "";
        await sendLeadAlert({ to, kind: "Quote request", business: clean(contact.business), contact: clean(contact.name), email: clean(contact.email), phone: clean(contact.phone), timeline: clean(body.startDate), message: pain, portalUrl: site ? `${site}/staff` : undefined });
      } catch { /* email failure never blocks the lead */ }
    }
    return NextResponse.json({ ok: true, persisted: !error });
  } catch {
    return NextResponse.json({ ok: true, persisted: false });
  }
}
