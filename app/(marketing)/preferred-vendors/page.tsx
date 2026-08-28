import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { createServiceClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Preferred Vendors",
  description:
    "Trusted partners Hill Country Consultants works with to make our clients' lives easier — publishing and production, events, financial analysis, and more.",
  alternates: { canonical: "/preferred-vendors" },
  openGraph: {
    title: "Preferred Vendors · Hill Country Consultants",
    description: "Trusted partners we work with to make our clients' lives easier.",
    url: "/preferred-vendors",
  },
};

export default async function PreferredVendorsPage() {
  noStore();
  const admin = createServiceClient();
  const { data } = await admin
    .from("preferred_vendors")
    .select("*")
    .eq("is_public", true)
    .eq("active", true)
    .order("sort")
    .order("name");
  const vendors = (data ?? []) as any[];

  // Group by category so related partners sit together.
  const groups = new Map<string, any[]>();
  for (const v of vendors) {
    const k = v.category || "Partners";
    const arr = groups.get(k) || [];
    arr.push(v);
    groups.set(k, arr);
  }

  return (
    <>
      <section className="bg-white border-b border-line">
        <div className="shell py-16">
          <SectionHeading
            as="h1"
            kicker="Preferred Vendors"
            title="Our division and the partners we work with."
            intro="Publishing runs through Redd Ladys Chronicles, our own in-house division — not an outside vendor. Alongside it, these are the vetted outside businesses and professionals we bring in for specialized work, from events to financial analysis. When a project calls for their expertise, we coordinate the hand-off so the work stays seamless."
          />
        </div>
      </section>

      <section className="section-cream">
        <div className="shell py-16">
          {vendors.length === 0 ? (
            <p className="border border-dashed border-line-warm bg-white p-8 text-center text-[15px] prose-muted">
              Our partner directory is being updated. Check back soon.
            </p>
          ) : (
            <div className="flex flex-col gap-12">
              {[...groups.entries()].map(([cat, list]) => (
                <div key={cat}>
                  <h2 className="mb-6 font-fraunces text-[24px] font-medium text-forest">{cat}</h2>
                  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {list.map((v) => (
                      <div key={v.id} className="flex flex-col border border-line-warm bg-white p-6">
                        {v.logo_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={v.logo_url} alt={`${v.name} logo`} className="mb-3 h-16 w-auto max-w-[180px] object-contain" />
                        )}
                        <h3 className="font-fraunces text-[20px] font-medium text-forest">{v.name}</h3>
                        {Array.isArray(v.services) && v.services.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {v.services.map((s: string) => <span key={s} className="border border-line-warm px-2 py-0.5 text-[11px] text-ink-muted">{s}</span>)}
                          </div>
                        )}
                        {v.blurb && <p className="mt-2 flex-1 text-[15px] prose-soft">{v.blurb}</p>}
                        <div className="mt-4 flex flex-wrap items-center gap-4 text-[13.5px]">
                          {v.website && (
                            <a href={v.website} target="_blank" rel="noopener noreferrer" className="link-underline text-forest">Visit website</a>
                          )}
                          {v.contact_email && (
                            <a href={`mailto:${v.contact_email}`} className="link-underline text-forest">Email</a>
                          )}
                          {v.phone && <span className="prose-muted">{v.phone}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section-white">
        <div className="shell py-16 text-center">
          <h2 className="font-fraunces text-[26px] font-medium text-forest">Want us to bring the right partner to your project?</h2>
          <p className="mx-auto mt-3 max-w-[46em] text-[15.5px] prose-soft">Become a client and we&apos;ll coordinate the specialists your work needs — you stay with one point of contact.</p>
          <Link href="/get-started" className="btn-gold mt-6 inline-block px-6 text-[14px]">Get Started</Link>
        </div>
      </section>
    </>
  );
}
