"use client";
import { useState, useTransition } from "react";
import { updateMyProfile } from "@/app/staff/actions";

/** Employee self-service: set your display name and phone. */
export function ProfileEditForm({ name, phone }: { name: string; phone: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const field = "min-h-touch w-full border border-line-warm bg-white px-3 text-[15px] outline-none focus:border-forest";
  return (
    <form
      className="flex flex-col gap-3 border border-line-warm bg-white p-5"
      action={(fd) => start(async () => { setErr(""); setMsg(""); const r = await updateMyProfile(fd); if (r?.error) setErr(r.error); else setMsg("Saved"); })}
    >
      <p className="text-[13px] font-semibold text-forest">Set up your profile</p>
      <label className="flex flex-col gap-1.5"><span className="text-[13px] font-medium text-ink-faint">Your name</span>
        <input name="name" defaultValue={name} placeholder="First Last" className={field} /></label>
      <label className="flex flex-col gap-1.5"><span className="text-[13px] font-medium text-ink-faint">Phone</span>
        <input name="phone" defaultValue={phone} placeholder="Best number to reach you" className={field} /></label>
      <div className="flex items-center gap-3">
        <button disabled={pending} className="btn-gold self-start px-5 text-[14px] disabled:opacity-50">{pending ? "Saving…" : "Save profile"}</button>
        {msg && <span className="text-[13px] text-forest">{msg}</span>}
        {err && <span className="text-[13px] text-red-700">{err}</span>}
      </div>
    </form>
  );
}
