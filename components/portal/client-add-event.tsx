"use client";
import { useState, useTransition } from "react";
import { addClientEvent, deleteClientEvent } from "@/app/portal/actions";

/** Client adds an event to their calendar. */
export function ClientAddEvent({ defaultDate }: { defaultDate: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const field = "min-h-touch border border-line-warm bg-white px-2 text-[14px]";
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="btn-gold text-[13px]">+ Add event</button>;
  return (
    <form className="flex w-full max-w-[520px] flex-col gap-2 border border-line-warm bg-white p-4"
      action={(fd) => start(async () => { setErr(""); const r = await addClientEvent(fd); if (r?.error) setErr(r.error); else setOpen(false); })}>
      <div className="flex flex-wrap gap-2">
        <input name="title" required placeholder="Event title" className={`${field} min-w-[180px] flex-1`} />
        <input type="date" name="event_date" defaultValue={defaultDate} required className={field} />
        <input type="time" name="event_time" className={field} />
      </div>
      <textarea name="note" placeholder="Note (optional)" rows={2} className="border border-line-warm bg-white px-2 py-1 text-[14px]" />
      <div className="flex items-center gap-2">
        <button disabled={pending} className="btn-gold text-[13px] disabled:opacity-50">{pending ? "Adding…" : "Add event"}</button>
        <button type="button" onClick={() => setOpen(false)} className="text-[13px] prose-muted underline">Cancel</button>
        {err && <span className="text-[12px] text-red-700">{err}</span>}
      </div>
    </form>
  );
}

/** Small × to remove a client event. */
export function ClientDeleteEvent({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} title="Remove"
      onClick={() => start(async () => { await deleteClientEvent(id); })}
      className="shrink-0 px-1 text-[12px] leading-none text-white/70 hover:text-white disabled:opacity-40">×</button>
  );
}
