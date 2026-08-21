import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendClientCheckin } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily onboarding check-in drip. Vercel Cron hits this once a day (see
 * vercel.json) with `Authorization: Bearer $CRON_SECRET`. Sends the day-3 and
 * day-14 check-in to active clients, each phase once. Safe-by-default: if
 * CRON_SECRET is not set, it refuses and sends nothing. Only clients created
 * after the drip shipped fall inside the age windows, so existing clients are
 * never emailed.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ ok: false, reason: "CRON_SECRET not configured — drip disabled." }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient();
  const now = Date.now();
  const { data: clients } = await (admin.from("clients") as any)
    .select("id, contact, email, created_at, welcome_d3_at, welcome_d14_at, status")
    .eq("status", "Active");

  let d3 = 0, d14 = 0;
  for (const c of (clients ?? []) as any[]) {
    if (!c.email) continue;
    const ageDays = (now - new Date(c.created_at).getTime()) / 86400000;
    try {
      if (!c.welcome_d3_at && ageDays >= 3 && ageDays < 30) {
        await sendClientCheckin({ to: c.email, name: c.contact || null, phase: 3 });
        await (admin.from("clients") as any).update({ welcome_d3_at: new Date().toISOString() }).eq("id", c.id);
        d3++;
      } else if (!c.welcome_d14_at && ageDays >= 14 && ageDays < 45) {
        await sendClientCheckin({ to: c.email, name: c.contact || null, phase: 14 });
        await (admin.from("clients") as any).update({ welcome_d14_at: new Date().toISOString() }).eq("id", c.id);
        d14++;
      }
    } catch (e) { console.warn("[cron/onboarding]", c.id, e); }
  }
  return NextResponse.json({ ok: true, sent: { d3, d14 } });
}
