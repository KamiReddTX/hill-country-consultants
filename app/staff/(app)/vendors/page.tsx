import { redirect } from "next/navigation";
import { getStaffMember, isAdmin } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase/server";
import { money } from "@/lib/portal";
import { VendorForm } from "@/components/staff/vendor-form";
import { VendorControls } from "@/components/staff/vendor-controls";

export const dynamic = "force-dynamic";

/** Vendors & 1099 tracking — vendors/contractors you pay, YTD totals, and the
 *  1099 flag for tax season. Administrator only. */
export default async function VendorsPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  if (!isAdmin(me)) redirect("/staff");

  const year = new Date().getFullYear();
  const admin = createServiceClient();
  const [{ data: vendors }, { data: expenses }] = await Promise.all([
    admin.from("vendors").select("*").order("name"),
    admin.from("expenses").select("vendor_id, amount_cents, incurred_on"),
  ]);

  // YTD paid per vendor (current calendar year, linked expenses).
  const ytd = new Map<string, number>();
  for (const e of expenses ?? []) {
    const vid = (e as any).vendor_id;
    if (!vid) continue;
    if (String((e as any).incurred_on || "").slice(0, 4) !== String(year)) continue;
    ytd.set(vid, (ytd.get(vid) || 0) + Number((e as any).amount_cents || 0));
  }

  const rows = vendors ?? [];
  const contractors = rows.filter((v: any) => v.is_1099);
  // 1099 threshold is $600/yr — flag contractors at or over it.
  const needing1099 = contractors.filter((v: any) => (ytd.get(v.id) || 0) >= 60000);
  const totalPaid = [...ytd.values()].reduce((s, n) => s + n, 0);

  const Stat = ({ label, value }: { label: string; value: string }) => (
    <div className="border border-line-warm bg-white p-3"><p className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</p><p className="mt-1 font-fraunces text-[24px] text-forest">{value}</p></div>
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Vendors &amp; 1099s</h1>
        <span className="rule-gold mb-2 mt-2" />
        <p className="max-w-[56em] text-[13px] prose-muted">
          Track the vendors and contractors you pay. Link an expense to a vendor on the Finance tab and their year-to-date total builds
          here. Mark contractors as 1099 — anyone paid $600 or more in a calendar year is flagged for a 1099-NEC. This is a record-keeping
          aid, not tax advice. Administrator only.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={`Paid to vendors · ${year}`} value={money(totalPaid)} />
        <Stat label="Vendors" value={String(rows.length)} />
        <Stat label="1099 contractors" value={String(contractors.length)} />
        <Stat label="Need a 1099 (≥ $600)" value={String(needing1099.length)} />
      </div>

      <section className="border border-line-warm bg-white p-4">
        <p className="mb-1 text-[13px] font-semibold text-forest">Add a vendor</p>
        <VendorForm />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold text-forest">All vendors</p>
        <div className="overflow-x-auto border border-line-warm">
          <table className="w-full min-w-[760px] border-collapse bg-white text-left text-[14px]">
            <thead>
              <tr className="border-b border-line-soft text-ink-faint">
                <th className="p-3 font-medium">Vendor</th><th className="p-3 font-medium">Email</th><th className="p-3 font-medium">EIN/SSN</th>
                <th className="p-3 font-medium text-right">Paid {year}</th><th className="p-3 font-medium">1099</th><th className="p-3 font-medium">Notes</th><th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v: any) => {
                const paid = ytd.get(v.id) || 0;
                const flag = v.is_1099 && paid >= 60000;
                return (
                  <tr key={v.id} className="border-b border-line-soft/60">
                    <td className="p-3 font-medium text-charcoal">{v.name}{flag && <span className="ml-2 text-[11px] font-semibold text-amber-700">1099 due</span>}</td>
                    <td className="p-3 prose-muted">{v.email || "—"}</td>
                    <td className="p-3 prose-muted">{v.ein_last4 ? `••• ${v.ein_last4}` : "—"}</td>
                    <td className="p-3 text-right tabular-nums">{paid ? money(paid) : "—"}</td>
                    <td className="p-3"><VendorControls id={v.id} is1099={v.is_1099} /></td>
                    <td className="p-3 prose-muted">{v.notes || "—"}</td>
                    <td className="p-3"></td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={7} className="p-3 prose-muted">No vendors yet. Add one above, then link expenses to them on Finance.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
