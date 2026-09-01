import { NextResponse, type NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { bookItemById } from "@/content/pricing";
import { createServiceClient } from "@/lib/supabase/server";

/** "10:00 AM" → minutes since midnight (null if unparseable). */
function slotToMin(s: string): number | null {
  const m = String(s || "").match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return h * 60 + Number(m[2]);
}

/**
 * Creates a Stripe Checkout Session from the cart.
 * Only fixed-rate items are charged, in full (deposits removed).
 * Consent (timestamp + payer IP) and a compact scope snapshot ride in metadata
 * so the webhook can persist the dispute evidence with the booking.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Payments aren't configured yet. Add STRIPE_SECRET_KEY to enable checkout." },
      { status: 503 },
    );
  }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const items: { id: string; qty: number }[] = (body.items || []).filter((i: any) => bookItemById(i.id));
  const payMode = "full"; // deposits removed — full payment only
  if (!items.length) return NextResponse.json({ error: "No payable items in the cart." }, { status: 400 });
  if (!body.contact?.email) return NextResponse.json({ error: "Email is required." }, { status: 400 });
  // Affirmative acceptance is required for a charge (card-network / no-refund
  // defensibility). Enforced here on the server, not just in the UI.
  if (body.consent !== true) {
    return NextResponse.json({ error: "You must accept the Terms of Service and Refund & Cancellation Policy to check out." }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

  const line_items = items.map((i) => {
    const it = bookItemById(i.id)!;
    return {
      quantity: i.qty || 1,
      price_data: {
        currency: "usd",
        unit_amount: it.price * 100,
        product_data: { name: it.name, description: it.unit },
      },
    };
  });

  // Class booking guards. A class can enter the cart two ways — the guided class
  // flow (sets className/slot/date) or a raw class line item (class-half /
  // class-full). Either way the SAME server-side guards apply, so a tampered
  // /book?add=class-half URL can't slip a class through without them.
  const className = String(body.className || "");
  const classSlot = String(body.classSlot || "");
  const startDate = String(body.startDate || "");
  const attendees = Math.max(0, Math.floor(Number(body.attendees) || 0));
  const hasClassItem = items.some((i) => { const it = bookItemById(i.id); return !!it && it.svc === "trainingSvc"; });
  const isClass = !!className || hasClassItem;
  if (isClass) {
    if (!className || !classSlot || !startDate) {
      return NextResponse.json({ error: "A class booking needs a class, a date, and a time slot." }, { status: 400 });
    }
    // Minimum enrollment of 20 (base covers up to 20; extras billed per head).
    if (attendees < 20) {
      return NextResponse.json({ error: "Corporate classes require a minimum enrollment of 20 attendees." }, { status: 400 });
    }
    // Must be booked 30–90 days out (matches the published booking window).
    const day = Date.parse(startDate);
    if (!Number.isNaN(day)) {
      const days = Math.round((day - Date.now()) / 86400000);
      if (days < 30 || days > 90) {
        return NextResponse.json({ error: "Classes must be booked between 30 and 90 days out." }, { status: 400 });
      }
    }
    // Charge for attendees over the included 20.
    const extra = Math.max(0, attendees - 20);
    if (extra > 0) {
      line_items.push({
        quantity: extra,
        price_data: { currency: "usd", unit_amount: 25000, product_data: { name: "Additional class attendee", description: "Over the 20 included in the class" } },
      });
    }
    // 4-hour buffer. Fail CLOSED: if availability can't be verified, do NOT take
    // a payment we might have to refund. The database also enforces this buffer
    // at booking-write time (bookings_class_buffer_guard trigger), so a race
    // between two in-flight checkouts still cannot double-book a slot.
    const newMin = slotToMin(classSlot);
    if (newMin === null) return NextResponse.json({ error: "Unrecognized class time." }, { status: 400 });
    try {
      const admin = createServiceClient();
      const { data: sameDay, error: qErr } = await admin.from("bookings").select("class_slot").eq("start_date", startDate).not("class_name", "is", null);
      if (qErr) throw qErr;
      const clash = (sameDay || []).some((b: any) => { const mm = slotToMin(b.class_slot); return mm !== null && Math.abs(mm - newMin) < 240; });
      if (clash) return NextResponse.json({ error: "That time is within 4 hours of another booked class. Please choose a different time or date." }, { status: 409 });
    } catch (e) {
      console.error("[checkout] buffer check", e);
      return NextResponse.json({ error: "We couldn't verify class availability just now. Please try again in a moment." }, { status: 503 });
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: body.contact.email,
    line_items,
    success_url: `${site}/portal/login?welcome=1&ref={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/book`,
    metadata: {
      email: String(body.contact.email).toLowerCase(),
      contact: body.contact.name || "",
      business: body.contact.business || "",
      phone: body.contact.phone || "",
      startDate: body.startDate || "",
      payMode,
      items: items.map((i) => `${i.id}:${i.qty || 1}`).join(","),
      quotes: (body.quotes || []).map((q: any) => q.id).join(","),
      className: body.className || "",
      classDate: body.classDate || "",
      classSlot: body.classSlot || "",
      attendees: String(attendees),
      notes: (body.contact.notes || "").slice(0, 400),
      repCode: body.repCode || "",
      consentAt: body.consentAt || new Date().toISOString(),
      consentIp: ip,
    },
  });

  return NextResponse.json({ url: session.url });
}
