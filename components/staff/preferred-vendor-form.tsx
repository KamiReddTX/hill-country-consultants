"use client";
import { useState, useTransition } from "react";
import { savePreferredVendor } from "@/app/staff/actions";
import type { PreferredVendor } from "@/lib/database.types";

/** Admin/BM: add or edit a preferred vendor. Pass `vendor` to edit. */
export function PreferredVendorForm({ vendor }: { vendor?: PreferredVendor }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const field = "min-h-touch border border-line-warm px-3 text-[14px] outline-none focus:border-forest";
  const formId = `pv-${vendor?.id || "new"}`;
  return (
    <form
      id={formId}
      className="grid gap-2 sm:grid-cols-2"
      action={(fd) => start(async () => {
        setMsg(""); setErr("");
        if (vendor?.id) fd.set("id", vendor.id);
        const r = await savePreferredVendor(fd);
        if (r?.error) setErr(r.error);
        else { setMsg(vendor ? "Saved" : "Vendor added"); if (!vendor) (document.getElementById(formId) as HTMLFormElement)?.reset(); }
      })}
    >
      <input name="name" required defaultValue={vendor?.name || ""} placeholder="Vendor / business name" className={field} />
      <input name="category" defaultValue={vendor?.category || ""} placeholder="Category (e.g. Publishing, Events, Financial)" className={field} />
      <textarea name="blurb" defaultValue={vendor?.blurb || ""} placeholder="Short description clients will see" className={`${field} sm:col-span-2 min-h-[70px] py-2`} />
      <input name="website" defaultValue={vendor?.website || ""} placeholder="Website (https://…)" className={field} />
      <input name="phone" defaultValue={vendor?.phone || ""} placeholder="Phone" className={field} />
      <input name="contact_name" defaultValue={vendor?.contact_name || ""} placeholder="Contact name" className={field} />
      <input name="contact_email" defaultValue={vendor?.contact_email || ""} placeholder="Contact email (for assignments)" className={field} />
      <label className="flex items-center gap-2 text-[13px] text-charcoal"><input type="checkbox" name="is_public" defaultChecked={vendor ? vendor.is_public : true} /> Show on public website</label>
      <label className="flex items-center gap-2 text-[13px] text-charcoal"><input type="checkbox" name="active" defaultChecked={vendor ? vendor.active : true} /> Active</label>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button disabled={pending} className="btn-gold text-[13px] disabled:opacity-50">{pending ? "Saving…" : vendor ? "Save changes" : "Add vendor"}</button>
        {msg && <span className="text-[12px] text-forest">{msg}</span>}
        {err && <span className="text-[12px] text-red-700">{err}</span>}
      </div>
    </form>
  );
}
