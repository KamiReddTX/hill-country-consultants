import Link from "next/link";
import { redirect } from "next/navigation";
import { getStaffMember, isAdmin } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase/server";
import { LocalTime } from "@/components/local-time";

export const dynamic = "force-dynamic";

const ENTITIES = ["all", "invoice", "contract", "client", "expense", "vendor", "staff"];

/** Audit log — a who-changed-what trail across the portal. Administrator only. */
export default async function AuditPage({ searchParams }: { searchParams: { entity?: string } }) {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isAdmin(me)) redirect("/staff");

  const entity = ENTITIES.includes(searchParams?.entity || "") ? (searchParams!.entity as string) : "all";
  const admin = createServiceClient();
  let q = admin.from("audit_log").select("*").order("created_at", { ascending: false }).limit(500);
  if (entity !== "all") q = q.eq("entity", entity);
  const { data: rows } = await q;

  const actionClass = (a: string) => (a === "delete" ? "text-red-700" : a === "create" ? "text-forest" : a === "sign" ? "text-forest" : "text-charcoal");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Audit log</h1>
        <span className="rule-gold mb-2 mt-2" />
        <p className="max-w-[56em] text-[13px] prose-muted">
          A record of who changed what across the portal — invoices and payments, contracts, client records, expenses, vendors, and staff
          changes. Newest first, most recent 500 entries. Administrator only.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ENTITIES.map((e) => (
          <Link key={e} href={e === "all" ? "/staff/audit" : `/staff/audit?entity=${e}`}
            className={`border px-3 py-1 text-[13px] capitalize ${entity === e ? "border-forest bg-forest/5 text-forest" : "border-line-warm text-ink-faint"}`}>
            {e}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto border border-line-warm">
        <table className="w-full min-w-[760px] border-collapse bg-white text-left text-[13px]">
          <thead>
            <tr className="border-b border-line-soft text-ink-faint">
              <th className="p-3 font-medium">When</th><th className="p-3 font-medium">Who</th><th className="p-3 font-medium">Action</th>
              <th className="p-3 font-medium">Entity</th><th className="p-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((r: any) => (
              <tr key={r.id} className="border-b border-line-soft/60">
                <td className="p-3 prose-muted whitespace-nowrap"><LocalTime iso={r.created_at} mode="datetime" /></td>
                <td className="p-3 prose-soft">{r.actor_email || "—"}</td>
                <td className={`p-3 font-medium capitalize ${actionClass(r.action)}`}>{r.action}</td>
                <td className="p-3 capitalize text-charcoal">{r.entity}</td>
                <td className="p-3 prose-muted">{r.summary || (r.entity_id ? `#${String(r.entity_id).slice(0, 8)}` : "—")}</td>
              </tr>
            ))}
            {(rows ?? []).length === 0 && <tr><td colSpan={5} className="p-3 prose-muted">No audit entries{entity !== "all" ? ` for ${entity}` : ""} yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
