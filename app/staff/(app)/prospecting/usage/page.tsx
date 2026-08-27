import { redirect } from "next/navigation";
import { getStaffMember, isSalesOrAdmin, isAdmin } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { ProspectSubnav } from "@/components/staff/prospecting/subnav";
import { LocalTime } from "@/components/local-time";

export const dynamic = "force-dynamic";

export default async function ProspectingUsagePage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isSalesOrAdmin(me)) return <p className="text-[15px] prose-muted">Prospecting is for sales and admins.</p>;

  const titles = [me.role, ...((me.roles as string[] | null) || [])].filter(Boolean);
  const period = (() => { const d = new Date(); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`; })();
  const db = createClient();
  const [{ data: allow }, { data: perms }, { data: reveals }, { data: exps }] = await Promise.all([
    db.from("credit_allowance").select("credits,period_month").eq("staff_id", me.id).eq("period_month", period).maybeSingle(),
    db.from("role_permissions").select("monthly_credit_default").in("role_title", titles),
    db.from("reveals").select("field,vendor,credits_used,cache_hit,revealed_at").eq("staff_id", me.id).order("revealed_at", { ascending: false }).limit(50),
    db.from("exports").select("row_count,file_format,exported_at,list_id").eq("staff_id", me.id).order("exported_at", { ascending: false }).limit(50),
  ]);

  const credits = (allow as any)?.credits ?? Math.max(0, ...((perms || []).map((p: any) => p.monthly_credit_default || 0)), 0);
  const thisMonth = (reveals || []).filter((r: any) => (r.revealed_at || "").slice(0, 7) === period.slice(0, 7));
  const used = thisMonth.reduce((s: number, r: any) => s + (r.cache_hit ? 0 : (r.credits_used || 0)), 0);
  const remaining = Math.max(0, credits - used);

  const card = "border border-line-warm bg-white p-4";
  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="font-fraunces text-[32px] font-normal text-forest">Prospecting</h1><span className="rule-gold mt-2 block" /></div>
      <ProspectSubnav isAdmin={isAdmin(me)} />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className={card}><p className="text-[12px] uppercase tracking-wide text-ink-faint">Monthly credits</p><p className="font-fraunces text-[28px] text-forest">{credits}</p></div>
        <div className={card}><p className="text-[12px] uppercase tracking-wide text-ink-faint">Used this month</p><p className="font-fraunces text-[28px] text-forest">{used}</p></div>
        <div className={card}><p className="text-[12px] uppercase tracking-wide text-ink-faint">Remaining</p><p className={`font-fraunces text-[28px] ${remaining === 0 ? "text-red-700" : "text-forest"}`}>{remaining}</p></div>
      </div>

      <section>
        <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-forest">Reveal history</h2>
        {(reveals || []).length === 0 ? <p className="text-[14px] prose-muted">No reveals yet.</p> : (
          <div className="overflow-x-auto border border-line-warm">
            <table className="w-full min-w-[520px] border-collapse bg-white text-left text-[13px]">
              <thead><tr className="border-b border-line-soft bg-cream text-ink-faint"><th className="p-2 font-medium">When</th><th className="p-2 font-medium">Field</th><th className="p-2 font-medium">Vendor</th><th className="p-2 font-medium">Credits</th><th className="p-2 font-medium">Source</th></tr></thead>
              <tbody>{(reveals || []).map((r: any, i: number) => (
                <tr key={i} className="border-b border-line-soft/60"><td className="p-2"><LocalTime iso={r.revealed_at} mode="datetime" /></td><td className="p-2">{r.field}</td><td className="p-2 prose-muted">{r.vendor || "—"}</td><td className="p-2">{r.cache_hit ? 0 : r.credits_used}</td><td className="p-2 prose-muted">{r.cache_hit ? "cache" : "vendor"}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-forest">Export history</h2>
        {(exps || []).length === 0 ? <p className="text-[14px] prose-muted">No exports yet.</p> : (
          <div className="overflow-x-auto border border-line-warm">
            <table className="w-full min-w-[420px] border-collapse bg-white text-left text-[13px]">
              <thead><tr className="border-b border-line-soft bg-cream text-ink-faint"><th className="p-2 font-medium">When</th><th className="p-2 font-medium">Rows</th><th className="p-2 font-medium">Format</th></tr></thead>
              <tbody>{(exps || []).map((e: any, i: number) => (
                <tr key={i} className="border-b border-line-soft/60"><td className="p-2"><LocalTime iso={e.exported_at} mode="datetime" /></td><td className="p-2">{e.row_count}</td><td className="p-2 prose-muted">{e.file_format}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
