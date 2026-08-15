"use client";
import { useState, useTransition } from "react";
import { updateMyProfile } from "@/app/staff/actions";

const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Phoenix",
  "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu", "UTC",
  "Europe/London", "Asia/Manila", "Asia/Ho_Chi_Minh", "Asia/Kolkata",
];

type Vals = {
  name: string; phone: string; personal_email: string; address: string; timezone: string;
  emergency_contact_name: string; emergency_contact_phone: string;
  dd_bank_name: string; dd_routing: string; dd_account: string; dd_account_type: string;
};

export function ProfileEditForm({ initial }: { initial: Vals }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const field = "min-h-touch w-full border border-line-warm bg-white px-3 text-[15px] outline-none focus:border-forest";
  const L = ({ children }: { children: React.ReactNode }) => <span className="text-[13px] font-medium text-ink-faint">{children}</span>;
  return (
    <form
      className="flex flex-col gap-5 border border-line-warm bg-white p-5"
      action={(fd) => start(async () => { setErr(""); setMsg(""); const r = await updateMyProfile(fd); if (r?.error) setErr(r.error); else setMsg("Saved"); })}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5"><L>Your name</L><input name="name" defaultValue={initial.name} className={field} /></label>
        <label className="flex flex-col gap-1.5"><L>Phone</L><input name="phone" defaultValue={initial.phone} className={field} /></label>
        <label className="flex flex-col gap-1.5"><L>Personal email</L><input name="personal_email" type="email" defaultValue={initial.personal_email} className={field} /></label>
        <label className="flex flex-col gap-1.5"><L>Timezone</L>
          <select name="timezone" defaultValue={initial.timezone || ""} className={field}>
            <option value="">Select…</option>
            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz.replace("_", " ")}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2"><L>Mailing address</L><input name="address" defaultValue={initial.address} placeholder="Street, city, state, ZIP" className={field} /></label>
      </div>

      <div>
        <p className="mb-2 text-[13px] font-semibold text-forest">Emergency contact</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5"><L>Contact name</L><input name="emergency_contact_name" defaultValue={initial.emergency_contact_name} className={field} /></label>
          <label className="flex flex-col gap-1.5"><L>Contact phone</L><input name="emergency_contact_phone" defaultValue={initial.emergency_contact_phone} className={field} /></label>
        </div>
      </div>

      <div>
        <p className="mb-1 text-[13px] font-semibold text-forest">Direct deposit</p>
        <p className="mb-2 text-[12px] prose-muted">Used only to pay you. Visible to you and administrators.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5"><L>Bank name</L><input name="dd_bank_name" defaultValue={initial.dd_bank_name} className={field} /></label>
          <label className="flex flex-col gap-1.5"><L>Account type</L>
            <select name="dd_account_type" defaultValue={initial.dd_account_type || ""} className={field}>
              <option value="">Select…</option><option value="Checking">Checking</option><option value="Savings">Savings</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5"><L>Routing number</L><input name="dd_routing" defaultValue={initial.dd_routing} inputMode="numeric" className={field} /></label>
          <label className="flex flex-col gap-1.5"><L>Account number</L><input name="dd_account" defaultValue={initial.dd_account} inputMode="numeric" className={field} /></label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button disabled={pending} className="btn-gold self-start px-5 text-[14px] disabled:opacity-50">{pending ? "Saving…" : "Save profile"}</button>
        {msg && <span className="text-[13px] text-forest">{msg}</span>}
        {err && <span className="text-[13px] text-red-700">{err}</span>}
      </div>
    </form>
  );
}
