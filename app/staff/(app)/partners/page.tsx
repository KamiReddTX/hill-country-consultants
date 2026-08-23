import { redirect } from "next/navigation";
import { getStaffMember, isPrivileged, getClients, getDirectory } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { PreferredVendorForm } from "@/components/staff/preferred-vendor-form";
import { PreferredVendorControls } from "@/components/staff/preferred-vendor-controls";
import { VendorReferForm } from "@/components/staff/vendor-refer-form";
import { VendorReferralActions } from "@/components/staff/vendor-referral-actions";

export const dynamic = "force-dynamic";

/** Preferred Vendors (partners we recommend and delegate client work to).
 *  Managers curate the directory + assign; any employee can refer a vendor. */
export default async function PartnersPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  const priv = isPrivileged(me);

  const db = createClient();
  const [{ data: vendors }, { data: referrals }, clients, directory] = await Promise.all([
    db.from("preferred_vendors").select("*").order("sort").order("name"),
    db.from("vendor_referrals").select("*").order("created_at", { ascending: false }),
    getClients().catch(() => [] as any[]),
    getDirectory().catch(() => [] as any[]),
  ]);
  const vlist = (vendors ?? []) as any[];
  const staffName = new Map((directory as any[]).map((s) => [s.id, s.name || s.email]));
  const vendorName = new Map(vlist.map((v) => [v.id, v.name]));
  const clientName = new Map((clients as any[]).map((c) => [c.id, c.business || c.contact || c.email]));
  const vendorOpts = vlist.filter((v) => v.active).map((v) => ({ id: v.id, label: v.name }));
  const clientOpts = (clients as any[]).map((c) => ({ id: c.id, label: c.business || c.contact || c.email }));
  const pending = (referrals ?? []).filter((r: any) => r.status === "pending");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Preferred vendors</h1>
        <span className="rule-gold mb-2 mt-2" />
        <p className="max-w-[56em] text-[14px] prose-muted">Partner businesses we recommend to clients and delegate parts of client work to. Public vendors appear on the website and in the client portal, and every active vendor is available in the assignment dropdown on the Clients tab.</p>
      </div>

      {priv && (
        <section className="border border-line-warm bg-white p-4">
          <p className="mb-2 text-[13px] font-semibold text-forest">Add a vendor</p>
          <PreferredVendorForm />
        </section>
      )}

      <section className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold text-forest">Directory ({vlist.length})</p>
        {vlist.length === 0 ? (
          <p className="border border-dashed border-line-warm bg-white p-6 text-[15px] prose-muted">No preferred vendors yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {vlist.map((v) => (
              <li key={v.id} className="border border-line-warm bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    {v.logo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.logo_url} alt="" className="h-12 w-12 shrink-0 object-contain" />
                    )}
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium text-charcoal">{v.name}</p>
                      {Array.isArray(v.services) && v.services.length > 0 && (
                        <p className="mt-0.5 text-[12px] prose-muted">{v.services.join(" · ")}</p>
                      )}
                      {v.blurb && <p className="mt-1 max-w-[52em] text-[13px] prose-soft">{v.blurb}</p>}
                      <p className="mt-1 text-[12px] prose-muted">{[v.website, v.contact_email, v.phone].filter(Boolean).join(" · ") || "—"}</p>
                    </div>
                  </div>
                  {priv && <PreferredVendorControls id={v.id} isPublic={v.is_public} active={v.active} />}
                </div>
                {priv && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-[12px] text-forest">Edit details</summary>
                    <div className="mt-2"><PreferredVendorForm vendor={v} /></div>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border border-line-warm bg-white p-4">
        <p className="mb-1 text-[13px] font-semibold text-forest">Refer a vendor</p>
        <p className="mb-3 text-[12px] prose-muted">Recommend a vendor for the team to consider — a manager reviews and, if it&apos;s a fit, adds or assigns them. Anyone can refer; only managers assign.</p>
        <VendorReferForm vendors={vendorOpts} clients={clientOpts} />
      </section>

      {priv && (
        <section className="flex flex-col gap-2">
          <p className="text-[13px] font-semibold text-forest">Vendor referrals ({pending.length} pending)</p>
          {pending.length === 0 ? (
            <p className="text-[14px] prose-muted">No referrals waiting.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {pending.map((r: any) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 border border-line-warm bg-white p-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-charcoal">{r.proposed_name || vendorName.get(r.vendor_id) || "Vendor"}</p>
                    <p className="text-[12px] prose-muted">
                      by {staffName.get(r.referred_by) || "—"}{r.client_id ? ` · for ${clientName.get(r.client_id) || "a client"}` : ""}
                      {[r.proposed_website, r.proposed_contact].filter(Boolean).length ? ` · ${[r.proposed_website, r.proposed_contact].filter(Boolean).join(" · ")}` : ""}
                    </p>
                    {r.note && <p className="mt-1 max-w-[52em] text-[13px] prose-soft">{r.note}</p>}
                  </div>
                  <VendorReferralActions id={r.id} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
