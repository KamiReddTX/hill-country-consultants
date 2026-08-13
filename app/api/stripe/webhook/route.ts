import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { BOOK_ITEMS, QUOTE_ITEMS, bookItemById, quoteItemById, usd } from "@/content/pricing";
import { sendBookingConfirmation } from "@/lib/email";

export const runtime = "nodejs";

/**
 * On checkout.session.completed:
 *   1. create_client_after_payment(...) — client + booking + seeded tasks
 *   2. persist consent (timestamp + IP), scope snapshot, class + pay details
 *   3. email the confirmation with portal access + the 48-hour review notice
 * The client is then invited to sign in (Supabase Auth invite) so RLS binds
 * their user_id to their own row.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  const sig = req.headers.get("stripe-signature") || "";
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err: any) {
    return NextResponse.json({ error: `Signature verification failed: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    const m = s.metadata || {};
    const ref = "HCC-" + Math.floor(100000 + Math.random() * 899999);

    const items = (m.items || "")
      .split(",").filter(Boolean)
      .map((pair) => { const [id, qty] = pair.split(":"); const it = bookItemById(id); return it ? { id: it.id, name: it.name, qty: Number(qty) || 1, svc: it.svc, price: it.price } : null; })
      .filter(Boolean);
    const quotes = (m.quotes || "")
      .split(",").filter(Boolean)
      .map((id) => { const q = quoteItemById(id); return q ? { id: q.id, name: q.name, from: q.from } : null; })
      .filter(Boolean);

    const db = createServiceClient();
    const { data: clientId, error } = await db.rpc("create_client_after_payment", {
      p_email: m.email, p_business: m.business, p_contact: m.contact, p_phone: m.phone,
      p_ref: ref, p_items: items as any, p_quotes: quotes as any,
      p_paid_cents: s.amount_total ?? 0, p_start: m.startDate || null, p_rep_code: m.repCode || "",
    });
    if (error) { console.error("[webhook] create_client_after_payment", error); return NextResponse.json({ error: error.message }, { status: 500 }); }

    // Persist the dispute evidence + class/pay details on the booking row.
    await db.from("bookings").update({
      pay_mode: m.payMode || "full",
      class_name: m.className || null, class_date: m.classDate || null, class_slot: m.classSlot || null,
      notes: m.notes || null, stripe_payment_intent: (s.payment_intent as string) || null,
      consent_at: m.consentAt || null, consent_ip: m.consentIp || null, consent_terms: true,
      scope_snapshot: { items, quotes, payMode: m.payMode, amount_total: s.amount_total } as any,
    }).eq("ref", ref);

    // Invite the client so they can sign in; RLS binds their user_id on first login.
    try { await db.auth.admin.inviteUserByEmail(m.email); } catch (e) { console.warn("[webhook] invite", e); }

    const site = process.env.NEXT_PUBLIC_SITE_URL || "";
    const itemsHtml =
      items.map((i: any) => `• ${i.name}${i.qty > 1 ? ` × ${i.qty}` : ""} — ${usd(i.price * i.qty)}`).join("<br>") +
      (quotes.length ? `<br><em>Quote requests:</em><br>` + quotes.map((q: any) => `• ${q.name} (${q.from})`).join("<br>") : "");
    try {
      await sendBookingConfirmation({ to: m.email, ref, itemsHtml, startDate: m.startDate || "", portalUrl: `${site}/portal/login` });
    } catch (e) { console.error("[webhook] email", e); }
  }

  return NextResponse.json({ received: true });
}
