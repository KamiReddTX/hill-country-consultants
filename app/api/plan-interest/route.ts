import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { sendPlanInterestBooking, sendPlanInterestAlert } from "@/lib/email";
import { SITE } from "@/content/site";

export const runtime = "nodejs";

const PLANS = ["Foundation", "Momentum", "Enterprise"];

/**
 * A prospect picked a plan. We: (1) drop a tagged lead into the Pipeline so
 * Sales/BM/Admin see the interest and which plan, (2) email the prospect the
 * free 30-min strategy-session booking link, (3) email the team a heads-up.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const email = (typeof body.email === "string" ? body.email : "").trim().slice(0, 200);
  const name = (typeof body.name === "string" ? body.name : "").trim().slice(0, 200);
  const plan = PLANS.includes(String(body.plan)) ? String(body.plan) : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  if (!plan) return NextResponse.json({ ok: false, error: "invalid_plan" }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    try {
      const admin = createClient<Database>(url, key, { auth: { persistSession: false } });
      await admin.from("leads").insert({
        contact: name || null,
        email,
        tier: plan,
        lead_with: "Plan interest",
        stage: "New lead",
        pain: `Interested in the ${plan} plan — emailed the free strategy-session booking link.`,
      });
    } catch (e) { console.error("[plan-interest] lead insert", e); }
  }

  try { await sendPlanInterestBooking({ to: email, plan, bookingUrl: SITE.consultUrl }); } catch (e) { console.error("[plan-interest] booking email", e); }
  try { await sendPlanInterestAlert({ plan, email, name }); } catch (e) { console.error("[plan-interest] team alert", e); }

  return NextResponse.json({ ok: true, bookingUrl: SITE.consultUrl });
}
