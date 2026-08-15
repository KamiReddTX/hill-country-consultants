"use client";
import { useState, useTransition } from "react";
import { uploadMyAvatar } from "@/app/staff/actions";

/** Employee: upload their own profile photo. */
export function AvatarUpload({ url }: { url: string | null }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  return (
    <div className="flex items-center gap-4">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-line-warm bg-cream">
        {url ? <img src={url} alt="Profile" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-[12px] text-ink-faint">No photo</div>}
      </div>
      <form action={(fd) => start(async () => { setErr(""); const r = await uploadMyAvatar(fd); if (r?.error) setErr(r.error); })} className="flex flex-col gap-1">
        <input type="file" name="avatar" accept="image/*" required className="text-[13px]" />
        <div className="flex items-center gap-2">
          <button disabled={pending} className="btn-gold text-[13px] disabled:opacity-50">{pending ? "Uploading…" : "Upload photo"}</button>
          {err && <span className="text-[12px] text-red-700">{err}</span>}
        </div>
      </form>
    </div>
  );
}
