import { NextResponse, type NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Client-facing pay link for a per-task charge (emailed by the AM/VA). Creates a
 * fresh Stripe Checkout Session on click — so the link never expires — and
 * redirects to it. The webhook marks the task paid + moves it to "In progress".
 */
export async function GET(req: NextRequest, { params }: { params: { taskId: string } }) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const stripe = getStripe();
  if (!stripe) return NextResponse.redirect(`${site}/portal/tasks`);

  const admin = createServiceClient();
  const { data: task } = await admin
    .from("client_tasks")
    .select("id,title,client_id,charge_cents,charge_status")
    .eq("id", params.taskId)
    .maybeSingle();
  const t = task as any;
  if (!t) return NextResponse.redirect(`${site}/portal/tasks`);
  if (t.charge_status === "paid") return NextResponse.redirect(`${site}/portal/tasks?paid=1`);
  // Only honor links for a charge that was actually issued (matches the Pay button state).
  if (t.charge_status !== "sent") return NextResponse.redirect(`${site}/portal/tasks`);
  const cents = t.charge_cents || 0;
  if (cents < 100) return NextResponse.redirect(`${site}/portal/tasks`);

  const { data: client } = await admin.from("clients").select("email").eq("id", t.client_id).maybeSingle();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: (client as any)?.email || undefined,
    line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: cents, product_data: { name: t.title || "Task charge — Hill Country Consultants" } } }],
    success_url: `${site}/portal/tasks?paid=1`,
    cancel_url: `${site}/portal/tasks`,
    metadata: { kind: "task_charge", taskId: t.id, clientId: t.client_id },
  });
  return NextResponse.redirect(session.url || `${site}/portal/tasks`);
}
