import { redirect } from "next/navigation";
import { getStaffMember, getClients, isPrivileged } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { ClientFileUpload } from "@/components/staff/client-file-upload";
import { ClientDocLink } from "@/components/staff/client-doc-link";
import { DeleteFileButton } from "@/components/staff/delete-file-button";

function kb(n: number | null) {
  if (!n) return "";
  return n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(1)} MB`;
}

export default async function StaffFilesPage() {
  const me = await getStaffMember();
  if (!me) redirect("/staff/login");
  const clients = await getClients();
  const admin = isPrivileged(me);
  const mine = clients;
  const ids = mine.map((c) => c.id);

  const db = createClient();
  const { data: files } = ids.length
    ? await db.from("client_files").select("*").in("client_id", ids).order("created_at", { ascending: false })
    : { data: [] as any[] };
  const byClient = new Map<string, any[]>();
  (files ?? []).forEach((f: any) => { const a = byClient.get(f.client_id) || []; a.push(f); byClient.set(f.client_id, a); });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-fraunces text-[32px] font-normal text-forest">Files</h1>
        <span className="rule-gold mb-4 mt-2" />
        <p className="max-w-[48em] prose-soft">Each client&apos;s private shared drive. Files you upload here appear in {admin ? "the client&apos;s" : "your client&apos;s"} portal Files tab for them to open and download. Only the client, their VA/AM, and admins can see them.</p>
      </div>

      {mine.length === 0 ? (
        <p className="border border-dashed border-line-warm bg-white p-6 text-[15px] prose-muted">No clients assigned to you yet.</p>
      ) : (
        <ul className="flex flex-col gap-5">
          {mine.map((c) => {
            const list = byClient.get(c.id) || [];
            return (
              <li key={c.id} className="border border-line-warm bg-white p-5">
                <p className="font-fraunces text-[18px] text-forest">{c.business || c.contact || c.email}</p>
                {list.length === 0 ? (
                  <p className="mt-2 text-[13px] prose-muted">No files yet.</p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-2">
                    {list.map((f: any) => (
                      <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-2">
                        <div><p className="text-[15px] text-charcoal">{f.name}{f.doc_url ? " · Google Doc" : ""}</p>
                          <p className="text-[12px] prose-muted">{f.doc_url ? "editable link" : kb(f.size)}{f.uploaded_by ? ` · ${f.uploaded_by}` : ""} · {new Date(f.created_at).toLocaleDateString()}</p></div>
                        <span className="flex items-center gap-3">
                          <a href={f.doc_url || `/api/client-file/${f.id}`} target="_blank" rel="noreferrer" className="link-underline text-[13px]">Open</a>
                          <DeleteFileButton fileId={f.id} />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <ClientFileUpload clientId={c.id} />
                <ClientDocLink clientId={c.id} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
