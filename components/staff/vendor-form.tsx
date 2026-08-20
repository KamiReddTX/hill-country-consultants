"use client";
import { useState, useTransition } from "react";
import { addVendor } from "@/app/staff/actions";

/** Add a vendor / contractor. Administrator only. */
export function VendorForm() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  return (
    <form
      id="vendor-form"
      action={(fd) => start(async () => { setMsg(""); const r = await addVendor(fd); setMsg(r?.error ? r.error : "Vendor added"); if (!r?.error) (document.getElementById("vendor-form") as HTMLFormElement)?.reset(); })}
      className="flex flex-wrap items-end gap-2"
    >
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">Name
        <input name="name" required placeholder="e.g. Jane Doe LLC" className="min-h-touch w-48 border border-line-warm bg-white px-2 text-[13px]" />
      </label>
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">Email
        <input name="email" type="email" placeholder="optional" className="min-h-touch w-44 border border-line-warm bg-white px-2 text-[13px]" />
      </label>
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">EIN/SSN last 4
        <input name="ein_last4" inputMode="numeric" maxLength={4} placeholder="1234" className="min-h-touch w-20 border border-line-warm bg-white px-2 text-[13px]" />
      </label>
      <label className="flex items-center gap-1.5 text-[12px] text-charcoal">
        <input name="is_1099" type="checkbox" className="h-4 w-4" /> 1099 contractor
      </label>
      <label className="flex flex-col gap-0.5 text-[11px] text-ink-faint">Notes
        <input name="notes" placeholder="optional" className="min-h-touch w-48 border border-line-warm bg-white px-2 text-[13px]" />
      </label>
      <button type="submit" disabled={pending} className="btn-gold text-[13px] disabled:opacity-50">{pending ? "Saving…" : "Add vendor"}</button>
      {msg && <span className="text-[12px] text-forest">{msg}</span>}
    </form>
  );
}
