import { redirect } from "next/navigation";
import { getPortalClient } from "@/lib/portal";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PortalVendorsPage() {
  const client = await getPortalClient();
  if (!client) redirect("/portal/login");

  // Read via service role after confirming the signed-in client; assignments are
  // filtered to this client only.
  const admin = createServiceClient();
  const [{ data: directory }, { data: assigns }] = await Promise.all([
    admin.from("preferred_vendors").select("*").eq("is_public", true).eq("active", true).order("sort").order("name"),
    admin.from("client_preferred_vendors").select("id,vendor_id,scope,note").eq("client_id", client.id),
  ]);
  const dir = (directory ?? []) as any[];
  const assignRows = (assigns ?? []) as any[];

  // Fetch vendor details for assigned partners (may include non-public vendors).
  const assignedVendorIds = [...new Set(assignRows.map((a) => a.vendor_id))];
  let assignedVendors: any[] = [];
  if (assignedVendorIds.length) {
    const { data } = await admin.from("preferred_vendors").select("*").in("id", assignedVendorIds);
    assignedVendors = (data ?? []) as any[];
  }
  const vById = new Map(assignedVendors.map((v) => [v.id, v]));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Preferred vendors</h1>
        <span className="rule-gold mb-4 mt-2" />
        <p className="max-w-[48em] prose-soft">Trusted partners we work with to make your life easier. When part of your work is handled by one of them, you&apos;ll see it here.</p>
      </div>

      {assignRows.length > 0 && (
        <div>
          <p className="kicker mb-3">Working on your account</p>
          <ul className="flex flex-col gap-2">
            {assignRows.map((a) => {
              const v = vById.get(a.vendor_id);
              return (
                <li key={a.id} className="border border-gold/50 bg-white p-4">
                  <p className="text-[15px] font-medium text-charcoal">{v?.name || "Partner"}{a.scope ? <span className="ml-2 text-[13px] prose-muted">{a.scope}</span> : null}</p>
                  {v?.blurb && <p className="mt-1 text-[13px] prose-soft">{v.blurb}</p>}
                  {a.note && <p className="mt-1 text-[13px] prose-soft">{a.note}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-[13px]">
                    {v?.website && <a href={v.website} target="_blank" rel="noopener noreferrer" className="link-underline text-forest">Website</a>}
                    {v?.contact_email && <a href={`mailto:${v.contact_email}`} className="link-underline text-forest">Email</a>}
                    {v?.phone && <span className="prose-muted">{v.phone}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div>
        <p className="kicker mb-3">Our preferred vendors</p>
        {dir.length === 0 ? (
          <p className="border border-dashed border-line-warm bg-white p-6 text-[15px] prose-muted">Our partner directory is being updated.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {dir.map((v) => (
              <div key={v.id} className="flex flex-col border border-line-warm bg-white p-4">
                <p className="text-[15px] font-medium text-charcoal">{v.name}{v.category ? <span className="ml-2 text-[12px] prose-muted">{v.category}</span> : null}</p>
                {v.blurb && <p className="mt-1 flex-1 text-[13px] prose-soft">{v.blurb}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-4 text-[13px]">
                  {v.website && <a href={v.website} target="_blank" rel="noopener noreferrer" className="link-underline text-forest">Website</a>}
                  {v.contact_email && <a href={`mailto:${v.contact_email}`} className="link-underline text-forest">Email</a>}
                  {v.phone && <span className="prose-muted">{v.phone}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
