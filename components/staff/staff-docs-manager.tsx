"use client";
import { useState, useTransition } from "react";
import { uploadStaffDocument, deleteStaffDocument, setEmploymentInfo } from "@/app/staff/actions";

type Doc = { id: string; name: string; kind: string; requires_signature: boolean; signed_at: string | null; signed_name: string | null };

/** Admin/BM: per-employee employment info + document upload/manage (paystubs, contracts…). */
export function StaffDocsManager({ staffId, employmentType, startDate, docs }: {
  staffId: string; employmentType: string; startDate: string; docs: Doc[];
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const field = "min-h-touch border border-line-warm bg-white px-2 text-[13px]";
  const uploadId = `updoc-${staffId}`;
  return (
    <div className="flex flex-col gap-4">
      {/* Employment info */}
      <form className="flex flex-wrap items-end gap-2"
        action={(fd) => start(async () => { setMsg(""); const r = await setEmploymentInfo(staffId, String(fd.get("employment_type") || ""), String(fd.get("start_date") || "")); setMsg(r?.error || "Saved"); })}>
        <label className="flex flex-col gap-1 text-[12px] text-ink-faint">Employment type
          <select name="employment_type" defaultValue={employmentType || ""} className={field}>
            <option value="">—</option><option value="W-2">W-2 employee</option><option value="1099">1099 contractor</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-ink-faint">Start date<input type="date" name="start_date" defaultValue={startDate || ""} className={field} /></label>
        <button disabled={pending} className="btn-gold text-[12px] disabled:opacity-50">Save</button>
        {msg && <span className="text-[12px] text-forest">{msg}</span>}
      </form>

      {/* Documents list */}
      {docs.length > 0 && (
        <ul className="flex flex-col gap-1">
          {docs.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-1 text-[13px]">
              <span><a href={`/api/staff-doc/${d.id}`} className="link-underline">{d.name}</a> <span className="text-[11px] text-ink-faint">· {d.kind}{d.requires_signature ? (d.signed_at ? ` · signed by ${d.signed_name} ${new Date(d.signed_at).toLocaleDateString()}` : " · awaiting signature") : ""}</span></span>
              <button type="button" disabled={pending} onClick={() => start(async () => { await deleteStaffDocument(d.id); })} className="text-[12px] text-red-700 underline">Delete</button>
            </li>
          ))}
        </ul>
      )}

      {/* Upload */}
      <form id={uploadId} className="flex flex-wrap items-center gap-2 border-t border-line-soft pt-2"
        action={(fd) => start(async () => { setMsg(""); fd.set("staffId", staffId); const r = await uploadStaffDocument(fd); if (r?.error) setMsg(r.error); else (document.getElementById(uploadId) as HTMLFormElement)?.reset(); })}>
        <select name="kind" defaultValue="paystub" className={field}>
          <option value="paystub">Paystub</option><option value="contract">Company contract</option>
          <option value="nda">NDA</option><option value="tax">Tax form</option><option value="document">Other document</option>
        </select>
        <label className="flex items-center gap-1 text-[12px] text-ink-faint"><input type="checkbox" name="requires_signature" /> requires signature</label>
        <input type="file" name="files" multiple required className="text-[12px]" />
        <button disabled={pending} className="btn-gold text-[12px] disabled:opacity-50">Upload</button>
      </form>
    </div>
  );
}
