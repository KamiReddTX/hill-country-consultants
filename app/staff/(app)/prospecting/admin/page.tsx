import { redirect } from "next/navigation";
import { getStaffMember, isAdmin } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { ProspectSubnav } from "@/components/staff/prospecting/subnav";
import { ProspectAdmin } from "@/components/staff/prospecting/admin-panel";
import { LocalTime } from "@/components/local-time";

export const dynamic = "force-dynamic";

export default async function ProspectingAdminPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isAdmin(me)) return <p className="text-[15px] prose-muted">The prospecting admin is for administrators.</p>;

  const period = (() => { const d = new Date(); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`; })();
  const db = createClient();
  const [{ data: roles }, { data: staff }, { data: allow }, { data: reveals }, { data: exps }, phoneCount, emailCount] = await Promise.all([
    db.from("role_permissions").select("*").order("role_title"),
    db.from("staff").select("id,name,email,role,active").eq("active", true).order("name"),
    db.from("credit_allowance").select("staff_id,credits").eq("period_month", period),
    db.from("reveals").select("staff_id,field,credits_used,cache_hit,revealed_at").order("revealed_at", { ascending: false }).limit(40),
    db.from("exports").select("staff_id,row_count,file_format,exported_at").order("exported_at", { ascending: false }).limit(40),
    db.from("phone_suppression").select("phone", { count: "exact", head: true }),
    db.from("email_suppression").select("id", { count: "exact", head: true }),
  ]);

  const creditMap = new Map((allow || []).map((a: any) => [a.staff_id, a.credits]));
  const staffRows = (staff || []).map((s: any) => ({ id: s.id, name: s.name || s.email, role: s.role, credits: creditMap.get(s.id) ?? null }));
  const nameById = new Map((staff || []).map((s: any) => [s.id, s.name || s.email]));

  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="font-fraunces text-[32px] font-normal text-forest">Prospecting</h1><span className="rule-gold mt-2 block" /></div>
      <ProspectSubnav isAdmin />

      <ProspectAdmin
        roles={(roles || []) as any}
        staff={staffRows}
        period={period}
        suppression={{ phones: phoneCount.count ?? 0, emails: emailCount.count ?? 0 }}
      />

      <section>
        <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-forest">Recent reveals (org-wide)</h2>
        {(reveals || []).length === 0 ? <p className="text-[14px] prose-muted">No reveals yet.</p> : (
          <div className="overflow-x-auto border border-line-warm">
            <table className="w-full min-w-[560px] border-collapse bg-white text-left text-[13px]">
              <thead><tr className="border-b border-line-soft bg-cream text-ink-faint"><th className="p-2 font-medium">When</th><th className="p-2 font-medium">Staff</th><th className="p-2 font-medium">Field</th><th className="p-2 font-medium">Credits</th></tr></thead>
              <tbody>{(reveals || []).map((r: any, i: number) => (
                <tr key={i} className="border-b border-line-soft/60"><td className="p-2"><LocalTime iso={r.revealed_at} mode="datetime" /></td><td className="p-2">{nameById.get(r.staff_id) || "—"}</td><td className="p-2">{r.field}</td><td className="p-2">{r.cache_hit ? 0 : r.credits_used}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-forest">Recent exports (org-wide)</h2>
        {(exps || []).length === 0 ? <p className="text-[14px] prose-muted">No exports yet.</p> : (
          <div className="overflow-x-auto border border-line-warm">
            <table className="w-full min-w-[480px] border-collapse bg-white text-left text-[13px]">
              <thead><tr className="border-b border-line-soft bg-cream text-ink-faint"><th className="p-2 font-medium">When</th><th className="p-2 font-medium">Staff</th><th className="p-2 font-medium">Rows</th><th className="p-2 font-medium">Format</th></tr></thead>
              <tbody>{(exps || []).map((e: any, i: number) => (
                <tr key={i} className="border-b border-line-soft/60"><td className="p-2"><LocalTime iso={e.exported_at} mode="datetime" /></td><td className="p-2">{nameById.get(e.staff_id) || "—"}</td><td className="p-2">{e.row_count}</td><td className="p-2 prose-muted">{e.file_format}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
