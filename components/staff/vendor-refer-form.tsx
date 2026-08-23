"use client";
import { useState, useTransition } from "react";
import { referVendor } from "@/app/staff/actions";

type Opt = { id: string; label: string };

/** Any employee: refer an existing vendor or suggest a brand-new one. */
export function VendorReferForm({ vendors, clients }: { vendors: Opt[]; clients: Opt[] }) {
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"existing" | "new">(vendors.length ? "existing" : "new");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const field = "min-h-touch border border-line-warm px-3 text-[14px] outline-none focus:border-forest";
  const formId = "vendor-refer";
  return (
    <form
      id={formId}
      className="grid gap-2 sm:grid-cols-2"
      action={(fd) => start(async () => {
        setMsg(""); setErr("");
        if (mode === "existing") fd.delete("proposed_name");
        else fd.delete("vendorId");
        const r = await referVendor(fd);
        if (r?.error) setErr(r.error);
        else { setMsg("Referral sent to managers"); (document.getElementById(formId) as HTMLFormElement)?.reset(); }
      })}
    >
      <div className="sm:col-span-2 flex gap-4 text-[13px]">
        <label className="flex items-center gap-1.5"><input type="radio" name="mode" checked={mode === "existing"} onChange={() => setMode("existing")} disabled={!vendors.length} /> Existing vendor</label>
        <label className="flex items-center gap-1.5"><input type="radio" name="mode" checked={mode === "new"} onChange={() => setMode("new")} /> New suggestion</label>
      </div>
      {mode === "existing" ? (
        <select name="vendorId" className={field} defaultValue="">
          <option value="" disabled>Choose a vendor…</option>
          {vendors.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>
      ) : (
        <input name="proposed_name" placeholder="Vendor / business name" className={field} />
      )}
      <select name="clientId" className={field} defaultValue="">
        <option value="">For a client (optional)…</option>
        {clients.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
      {mode === "new" && (
        <>
          <input name="proposed_website" placeholder="Website (optional)" className={field} />
          <input name="proposed_contact" placeholder="Contact email/phone (optional)" className={field} />
        </>
      )}
      <textarea name="note" placeholder="Why are you referring them? What could they help with?" className={`${field} sm:col-span-2 min-h-[64px] py-2`} />
      <div className="sm:col-span-2 flex items-center gap-3">
        <button disabled={pending} className="btn-gold text-[13px] disabled:opacity-50">{pending ? "Sending…" : "Refer vendor"}</button>
        {msg && <span className="text-[12px] text-forest">{msg}</span>}
        {err && <span className="text-[12px] text-red-700">{err}</span>}
      </div>
    </form>
  );
}
