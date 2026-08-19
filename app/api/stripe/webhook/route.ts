import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { BOOK_ITEMS, QUOTE_ITEMS, bookItemById, quoteItemById, usd } from "@/content/pricing";
import { sendBookingConfirmation, sendPurchaseAdminAlert } from "@/lib/email";

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

    // Per-task charge (Phase 2): mark the task paid and move it into progress.
    if (m.kind === "task_charge" && m.taskId) {
      const tdb = createServiceClient();
      await tdb.from("client_tasks").update({ charge_status: "paid", paid: true, column_name: "In progress", needs_clarification: false }).eq("id", m.taskId);
      return NextResponse.json({ received: true });
    }

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

    // Idempotency: Stripe delivers at-least-once and retries on any non-2xx, so a
    // retry or duplicate event must not create a second client/booking/task set.
    const paymentIntent = (s.payment_intent as string) || null;
    if (paymentIntent) {
      const { data: existing } = await db.from("bookings").select("id").eq("stripe_payment_intent", paymentIntent).maybeSingle();
      if (existing) return NextResponse.json({ received: true, duplicate: true });
    }

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

    // Classes drop onto every admin & business-manager staff calendar (their
    // calendar of events + prep task) on the class date.
    if (m.className && m.startDate) {
      try {
        const { data: allStaff } = await db.from("staff").select("id,roles,role").eq("active", true);
        const mgrs = (allStaff || []).filter((st: any) => {
          const roles = Array.isArray(st.roles) ? st.roles : [];
          return roles.includes("Administrator") || roles.includes("Business Manager") || st.role === "Administrator" || st.role === "Business Manager";
        });
        const title = `Class: ${m.className}${m.attendees ? ` — ${m.attendees} attendees` : ""}`;
        const note = `Booked class (${ref}). Contact ${m.contact || ""} · ${m.phone || ""} · ${m.email || ""}.`.trim();
        const rows = mgrs.map((st: any) => ({ staff_id: st.id, created_by: null, title, event_date: m.startDate, event_time: m.classSlot || null, note }));
        if (rows.length) await db.from("staff_events").insert(rows);
      } catch (e) { console.warn("[webhook] class staff events", e); }
    }

    // Invite the client to set a password and sign in; /auth/callback binds their
    // user_id to their client row on first login.
    const site = process.env.NEXT_PUBLIC_SITE_URL || "";
    try {
      await db.auth.admin.inviteUserByEmail(
        m.email,
        site ? { redirectTo: `${site}/auth/callback?next=/portal` } : undefined,
      );
    } catch (e) { console.warn("[webhook] invite", e); }
    const itemsHtml =
      items.map((i: any) => `• ${i.name}${i.qty > 1 ? ` × ${i.qty}` : ""} — ${usd(i.price * i.qty)}`).join("<br>") +
      (quotes.length ? `<br><em>Quote requests:</em><br>` + quotes.map((q: any) => `• ${q.name} (${q.from})`).join("<br>") : "");
    try {
      await sendBookingConfirmation({ to: m.email, ref, itemsHtml, startDate: m.startDate || "", portalUrl: `${site}/portal/login` });
    } catch (e) { console.error("[webhook] email", e); }

    // Internal heads-up to the team that a purchase came in.
    const paid = "$" + ((s.amount_total ?? 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 });
    try {
      await sendPurchaseAdminAlert({
        ref, business: m.business || "", contact: m.contact || "", email: m.email || "", phone: m.phone || "",
        itemsHtml, amount: paid, startDate: m.startDate || "",
      });
    } catch (e) { console.error("[webhook] admin alert", e); }
  }

  return NextResponse.json({ received: true });
}
