"use client";
import { useState, useTransition } from "react";
import { addStaff } from "@/app/staff/actions";
import { ROLE_OPTIONS } from "@/content/roles";

export function AddStaffForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const field = "min-h-touch border border-line-warm px-3 text-[15px] outline-none focus:border-forest";
  return (
    <form id="staff-form" className="grid gap-3 border border-line-warm bg-white p-5 sm:grid-cols-2"
      action={(fd) => start(async () => { setError(""); setDone(false); const r = await addStaff(fd); if (r?.error) setError(r.error); else { setDone(true); (document.getElementById("staff-form") as HTMLFormElement)?.reset(); } })}>
      <input name="name" placeholder="Name" className={field} />
      <input name="email" type="email" required placeholder="Work email" className={field} />
      <select name="role" className={field} defaultValue="Engagement Specialist">{ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}</select>
      <input name="employee_code" placeholder="Employee code (e.g. HCC-VA-01)" className={field} />
      <input name="rate" type="number" step="0.01" placeholder="Hourly rate" className={field} />
      <label className="flex items-center gap-2 text-[14px] prose-soft"><input type="checkbox" name="hourly" defaultChecked className="h-5 w-5" /> Hourly (uses the time clock)</label>
      {error && <p className="text-[13px] text-red-700 sm:col-span-2">{error}</p>}
      {done && <p className="text-[13px] text-forest sm:col-span-2">Staff row created. Now invite them in Supabase → Authentication → Users so they can sign in.</p>}
      <button disabled={pending} className="btn-gold self-start px-5 sm:col-span-2">{pending ? "Saving…" : "Add staff"}</button>
    </form>
  );
}
