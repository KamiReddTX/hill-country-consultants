import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { BOOK_ITEMS, QUOTE_ITEMS, bookItemById, quoteItemById, usd } from "@/content/pricing";
import { sendBookingConfirmation, sendPurchaseAdminAlert, sendClientWelcome } from "@/lib/email";
import { seedClientOnboarding } from "@/lib/onboarding";

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

  // Atomic, race-safe idempotency: Stripe delivers at-least-once and retries on
  // any non-2xx. claim_stripe_event does an INSERT ... the FIRST caller for a
  // given event.id wins (returns true); every concurrent/late retry returns
  // false and we ack without reprocessing. This closes the window between the
  // old SELECT-then-INSERT booking check (payment_intent is set only AFTER the
  // RPC insert, so that check could not stop a duplicate client/booking/tasks).
  try {
    const guard = createServiceClient();
    const { data: claimed, error: claimErr } = await guard.rpc("claim_stripe_event", { p_id: event.id });
    if (claimErr) { console.error("[webhook] claim_stripe_event", claimErr); return NextResponse.json({ error: "idempotency check failed" }, { status: 500 }); }
    if (claimed === false) return NextResponse.json({ received: true, duplicate: true });
  } catch (e) {
    console.error("[webhook] idempotency", e);
    return NextResponse.json({ error: "idempotency check failed" }, { status: 500 });
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
      p_payment_intent: paymentIntent,
    });
    if (error) { console.error("[webhook] create_client_after_payment", error); return NextResponse.json({ error: error.message }, { status: 500 }); }

    // Seed the standard onboarding checklist (once) so the client's portal and
    // the staff Checklists tab are populated from the moment they sign up.
    if (clientId) { try { await seedClientOnboarding(db, clientId as string); } catch (e) { console.warn("[webhook] onboarding seed", e); } }

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

    // Welcome the client and get them into the portal. We send our OWN branded
    // welcome via Resend (reliable) using a generated invite link, and only fall
    // back to Supabase's invite email if the link can't be generated. Either way,
    // /auth/callback binds their user_id to their client row on first login.
    const site = process.env.NEXT_PUBLIC_SITE_URL || "";
    try {
      // New buyer -> invite link. Repeat buyer already has an account (invite
      // fails), so fall back to a magic-link so they still get one-click portal
      // access rather than nothing.
      let hashed: string | null = null;
      let linkType: "invite" | "magiclink" = "invite";
      const { data: inviteLink } = await db.auth.admin.generateLink({
        type: "invite", email: m.email,
        options: site ? { redirectTo: `${site}/auth/callback?next=/portal` } : undefined,
      } as any);
      hashed = (inviteLink as any)?.properties?.hashed_token || null;
      if (!hashed) {
        const { data: magic } = await db.auth.admin.generateLink({
          type: "magiclink", email: m.email,
          options: site ? { redirectTo: `${site}/auth/callback?next=/portal` } : undefined,
        } as any);
        hashed = (magic as any)?.properties?.hashed_token || null;
        linkType = "magiclink";
      }
      if (site && hashed) {
        const actionUrl = `${site}/auth/callback?token_hash=${hashed}&type=${linkType}&next=/portal`;
        await sendClientWelcome({ to: m.email, name: m.contact || null, actionUrl });
      } else {
        await db.auth.admin.inviteUserByEmail(m.email, site ? { redirectTo: `${site}/auth/callback?next=/portal` } : undefined);
      }
    } catch (e) {
      console.warn("[webhook] welcome/invite", e);
      // Last resort: the plain Supabase invite so the client can still get in.
      try { await db.auth.admin.inviteUserByEmail(m.email, site ? { redirectTo: `${site}/auth/callback?next=/portal` } : undefined); } catch {}
    }
    // A booked class carries its name in metadata (not the cart), so surface it
    // at the top of "what you booked" — otherwise the confirmation shows no class.
    const attendeeN = Number(m.attendees) || 0;
    const classLine = m.className
      ? `• <strong>${m.className}</strong>${m.classSlot ? ` · ${m.classSlot}` : ""}${attendeeN ? ` · ${attendeeN} attendee${attendeeN === 1 ? "" : "s"}` : ""}`
      : "";
    const itemsHtml =
      [
        classLine,
        ...items.map((i: any) => `• ${i.name}${i.qty > 1 ? ` × ${i.qty}` : ""} — ${usd(i.price * i.qty)}`),
      ].filter(Boolean).join("<br>") +
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
        assignUrl: site ? `${site}/staff/clients` : "",
      });
    } catch (e) { console.error("[webhook] admin alert", e); }
  }

  return NextResponse.json({ received: true });
}
