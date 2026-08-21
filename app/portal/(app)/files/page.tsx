import { redirect } from "next/navigation";
import { getPortalClient, getPortalData } from "@/lib/portal";
import { LocalTime } from "@/components/local-time";
import { createClient } from "@/lib/supabase/server";
import { DeliverableReview } from "@/components/portal/deliverable-review";

function kb(n: number | null) {
  if (!n) return "";
  return n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(1)} MB`;
}

export default async function FilesPage() {
  const client = await getPortalClient();
  if (!client) redirect("/portal/login");

  const db = createClient();
  const { data: files } = await db
    .from("client_files")
    .select("*")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });
  const { deliverables } = await getPortalData(client);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Files</h1>
        <span className="rule-gold mb-4 mt-2" />
        <p className="max-w-[48em] prose-soft">Your private shared space with your account team. Every document your VA/AM delivers or shares lives here for you to open and download. Only you, your account team, and administrators can see it.</p>
      </div>

      <div>
        <p className="kicker mb-3">Shared files</p>
        {(files ?? []).length === 0 ? (
          <p className="border border-dashed border-line-warm bg-white p-6 text-[15px] prose-muted">No files yet. Documents your team shares will appear here.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {(files ?? []).map((f: any) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 border border-line-warm bg-white p-4">
                <div><p className="text-[15px] text-charcoal">{f.name}</p>
                  <p className="text-[12px] prose-muted">{kb(f.size)}{f.uploaded_by ? ` · shared by ${f.uploaded_by}` : ""} · <LocalTime iso={f.created_at} mode="date" /></p></div>
                <a href={`/api/client-file/${f.id}`} className="btn-gold text-[13px]">Open / Download</a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {deliverables.length > 0 && (
        <div>
          <p className="kicker mb-3">Delivered through your task board</p>
          <ul className="flex flex-col gap-2">
            {deliverables.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-3">
                <div><p className="text-[15px] text-charcoal">{d.name}</p><p className="text-[12px] prose-muted">{d.service || "—"}{d.delivered_on ? ` · ${d.delivered_on}` : ""}</p></div>
                <span className="flex flex-wrap items-center gap-3">
                  {d.file_url && <a href={d.file_url} className="link-underline text-[13px]" target="_blank" rel="noreferrer">Open</a>}
                  {(d.file_url || /deliver/i.test(d.status || "")) ? <DeliverableReview id={d.id} status={(d as any).approval_status ?? null} /> : <span className="text-[12px] text-forest">{d.status}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
