import { redirect } from "next/navigation";
import { getPortalClient } from "@/lib/portal";
import { LocalTime } from "@/components/local-time";
import { createClient } from "@/lib/supabase/server";

export default async function WeeklyPage() {
  const client = await getPortalClient();
  if (!client) redirect("/portal/login");

  const db = createClient();
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data } = await db
    .from("client_reports")
    .select("id,name,period_start,period_end,created_at")
    .eq("client_id", client.id)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false });
  const reports = data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Weekly report</h1>
        <span className="rule-gold mb-4 mt-2" />
        <p className="max-w-[48em] prose-soft">
          Each week we publish a report of the hours and work delivered on your account. Reports stay here for 30 days —
          open or download any of them for your files.
        </p>
      </div>

      {reports.length === 0 ? (
        <p className="border border-dashed border-line-warm bg-white p-6 text-[15px] prose-muted">
          No weekly reports yet. Your first appears once your team has logged work and it's published.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {reports.map((r: any) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 border border-line-warm bg-white p-4">
              <div>
                <p className="font-medium text-charcoal">{r.name}</p>
                <p className="text-[12px] prose-muted">Published <LocalTime iso={r.created_at} mode="date" /></p>
              </div>
              <a href={`/api/client-report/${r.id}`} className="btn-gold text-[13px]">Open / Download</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
