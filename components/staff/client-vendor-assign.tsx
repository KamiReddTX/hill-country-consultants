"use client";
import { useState, useTransition } from "react";
import { assignVendorToClient, removeVendorAssignment } from "@/app/staff/actions";

type Opt = { id: string; label: string };
type Assignment = { id: string; vendor: string; scope: string | null };

/** Admin/BM: assign a preferred vendor to part of this client's services. */
export function ClientVendorAssign({ clientId, vendors, assignments }: { clientId: string; vendors: Opt[]; assignments: Assignment[] }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const field = "min-h-touch border border-line-warm px-3 text-[13px] outline-none focus:border-forest";
  const formId = `cva-${clientId}`;
  return (
    <div className="mt-3 border-t border-line-soft pt-3">
      <p className="text-[12px] font-semibold text-forest">Preferred vendors on this account</p>
      {assignments.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {assignments.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
              <span className="text-charcoal">{a.vendor}{a.scope ? ` — ${a.scope}` : ""}</span>
              <button type="button" disabled={pending} className="text-[12px] text-red-700 disabled:opacity-50"
                onClick={() => start(() => removeVendorAssignment(a.id).then(() => {}))}>Remove</button>
            </li>
          ))}
        </ul>
      )}
      {vendors.length === 0 ? (
        <p className="mt-2 text-[12px] prose-muted">No preferred vendors yet — add them on the Preferred vendors tab.</p>
      ) : (
        <form id={formId} className="mt-2 grid gap-2 sm:grid-cols-2"
          action={(fd) => start(async () => {
            setMsg(""); setErr(""); fd.set("clientId", clientId);
            const r = await assignVendorToClient(fd);
            if (r?.error) setErr(r.error); else { setMsg("Assigned"); (document.getElementById(formId) as HTMLFormElement)?.reset(); }
          })}>
          <select name="vendorId" required defaultValue="" className={field}>
            <option value="" disabled>Choose a vendor…</option>
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
          <input name="scope" placeholder="What part of their services?" className={field} />
          <input name="note" placeholder="Note for the vendor (optional)" className={`${field} sm:col-span-2`} />
          <label className="flex items-center gap-1.5 text-[12px] prose-muted"><input type="checkbox" name="notify" defaultChecked /> Email the vendor a hand-off</label>
          <div className="flex items-center gap-3">
            <button disabled={pending} className="min-h-touch border border-line-warm px-3 text-[13px] text-forest disabled:opacity-50">{pending ? "Assigning…" : "Assign vendor"}</button>
            {msg && <span className="text-[12px] text-forest">{msg}</span>}
            {err && <span className="text-[12px] text-red-700">{err}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
