import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendClientCheckin, sendOpsDigest } from "@/lib/email";
import { renewalDate, daysUntil } from "@/lib/health";
import { ACK_KIND, ACK_VERSION } from "@/content/acknowledgments";
import { money } from "@/lib/portal";

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
    .select("id, contact, email, created_at, welcome_d3_at, welcome_d14_at, status, retained_since, renewal_date")
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

  // Daily ops digest to the team inbox — only when there are open items.
  let digestSent = false;
  try {
    const [{ data: unpaid }, { data: pto }, { data: acks }, { data: staff }] = await Promise.all([
      admin.from("invoices").select("amount_cents,status").in("status", ["sent", "overdue"]),
      admin.from("time_off_requests").select("id").eq("status", "pending"),
      admin.from("staff_acknowledgments").select("staff_id").eq("kind", ACK_KIND).eq("version", ACK_VERSION),
      admin.from("staff").select("id, active"),
    ]);
    const acked = new Set(((acks ?? []) as any[]).map((a) => a.staff_id));
    const activeStaff = ((staff ?? []) as any[]).filter((s) => s.active !== false);
    const renewalsSoon = ((clients ?? []) as any[]).filter((c) => {
      const dd = daysUntil(renewalDate(c.retained_since, c.renewal_date));
      return dd !== null && dd <= 30;
    }).length;
    const unpaidCount = (unpaid ?? []).length;
    const unpaidCents = ((unpaid ?? []) as any[]).reduce((s, i) => s + Number(i.amount_cents || 0), 0);
    const items = [
      { n: renewalsSoon, label: "renewals due within 30 days" },
      { n: unpaidCount, label: `unpaid invoices${unpaidCents ? ` (${money(unpaidCents)})` : ""}` },
      { n: (pto ?? []).length, label: "time-off requests awaiting your decision" },
      { n: activeStaff.filter((s) => !acked.has(s.id)).length, label: "staff who haven't signed the IT/security acknowledgment" },
    ].filter((i) => i.n > 0);
    if (items.length) { await sendOpsDigest({ items }); digestSent = true; }
  } catch (e) { console.warn("[cron/onboarding] digest", e); }

  return NextResponse.json({ ok: true, sent: { d3, d14, digest: digestSent } });
}
