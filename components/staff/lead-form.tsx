"use client";
import { useState, useTransition } from "react";
import { createLead } from "@/app/staff/actions";

export function LeadForm({ repCode }: { repCode: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const field = "min-h-touch border border-line-warm px-3 text-[15px] outline-none focus:border-forest";
  return (
    <form id="lead-form" className="grid gap-3 border border-line-warm bg-white p-5 sm:grid-cols-2"
      action={(fd) => start(async () => { setError(""); setDone(false); const r = await createLead(fd); if (r?.error) setError(r.error); else { setDone(true); (document.getElementById("lead-form") as HTMLFormElement)?.reset(); } })}>
      <label className="flex flex-col gap-1 sm:col-span-2"><span className="text-[12px] font-medium text-ink-faint">Employee code (from your profile)</span>
        <input value={repCode || "—"} readOnly className={`${field} bg-cream/60`} /></label>
      <input name="business" required placeholder="Business" className={field} />
      <input name="contact" placeholder="Contact name" className={field} />
      <input name="email" type="email" placeholder="Email" className={field} />
      <input name="phone" placeholder="Phone" className={field} />
      <input name="industry" placeholder="Industry" className={field} />
      <input name="timeline" placeholder="Timeline" className={field} />
      <input name="tier" placeholder="Likely tier (Foundation / Momentum / Enterprise)" className={`${field} sm:col-span-2`} />
      <input name="lead_with" placeholder="Lead with (what to open on)" className={`${field} sm:col-span-2`} />
      <textarea name="pain" rows={2} placeholder="Pain / notes" className={`${field} sm:col-span-2`} />
      {error && <p className="text-[13px] text-red-700 sm:col-span-2">{error}</p>}
      {done && <p className="text-[13px] text-forest sm:col-span-2">Lead added to the pipeline.</p>}
      <button disabled={pending} className="btn-gold self-start px-5 sm:col-span-2">{pending ? "Saving…" : "Add lead"}</button>
    </form>
  );
}
