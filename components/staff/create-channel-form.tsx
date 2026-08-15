"use client";
import { useState, useTransition } from "react";
import { createChannel } from "@/app/staff/actions";

/** Create a shared topic channel. */
export function CreateChannelForm() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const field = "min-h-touch border border-line-warm bg-white px-2 text-[14px]";
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="text-[13px] link-underline">+ New channel</button>;
  return (
    <form className="flex flex-col gap-2 border border-line-warm bg-white p-3"
      action={(fd) => start(async () => { setErr(""); const r = await createChannel(fd); if (r?.error) setErr(r.error); else setOpen(false); })}>
      <input name="name" required placeholder="channel-name" className={field} />
      <input name="description" placeholder="What's it for? (optional)" className={field} />
      <div className="flex items-center gap-2">
        <button disabled={pending} className="btn-gold text-[13px] disabled:opacity-50">Create</button>
        <button type="button" onClick={() => setOpen(false)} className="text-[13px] prose-muted underline">Cancel</button>
        {err && <span className="text-[12px] text-red-700">{err}</span>}
      </div>
    </form>
  );
}
