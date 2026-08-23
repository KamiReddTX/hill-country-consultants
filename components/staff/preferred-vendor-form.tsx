"use client";
import { useState, useTransition } from "react";
import { savePreferredVendor } from "@/app/staff/actions";
import { VENDOR_SERVICES } from "@/content/pricing";
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
      <input name="website" defaultValue={vendor?.website || ""} placeholder="Website (https://…)" className={field} />
      <textarea name="blurb" defaultValue={vendor?.blurb || ""} placeholder="Brief description clients will see" className={`${field} sm:col-span-2 min-h-[70px] py-2`} />
      <div className="sm:col-span-2">
        <p className="mb-1 text-[12px] font-semibold text-forest">Services they provide</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {VENDOR_SERVICES.map((s) => (
            <label key={s} className="flex items-center gap-1.5 text-[13px] text-charcoal">
              <input type="checkbox" name="services" value={s} defaultChecked={vendor?.services?.includes(s)} /> {s}
            </label>
          ))}
        </div>
      </div>
      <label className="flex flex-col gap-1 text-[12px] text-ink-faint sm:col-span-2">Logo (image, optional)
        <input type="file" name="logo" accept="image/*" className="text-[13px]" />
        {vendor?.logo_url && <span className="text-[11px] prose-muted">Current logo saved — choose a file only to replace it.</span>}
      </label>
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
