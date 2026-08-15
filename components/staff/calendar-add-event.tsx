"use client";
import { useState, useTransition } from "react";
import { addCalendarEvent } from "@/app/staff/actions";

type Mate = { id: string; name: string | null; email: string };

/** Employee: add an event to your own calendar, or share it onto a teammate's. */
export function CalendarAddEvent({ mates, defaultDate }: { mates: Mate[]; defaultDate: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const field = "min-h-touch border border-line-warm bg-white px-2 text-[14px]";
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="btn-gold text-[13px]">+ Add event</button>;
  return (
    <form className="flex w-full max-w-[560px] flex-col gap-2 border border-line-warm bg-white p-4"
      action={(fd) => start(async () => { setErr(""); const r = await addCalendarEvent(fd); if (r?.error) setErr(r.error); else setOpen(false); })}>
      <div className="flex flex-wrap gap-2">
        <input name="title" required placeholder="Event title" className={`${field} min-w-[180px] flex-1`} />
        <input type="date" name="event_date" defaultValue={defaultDate} required className={field} />
        <input type="time" name="event_time" className={field} />
      </div>
      <textarea name="note" placeholder="Note (optional)" rows={2} className="border border-line-warm bg-white px-2 py-1 text-[14px]" />
      <label className="flex flex-col gap-1 text-[12px] text-ink-faint">Whose calendar?
        <select name="staff_id" className={field}>
          <option value="">My calendar</option>
          {mates.map((m) => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
        </select>
      </label>
      <div className="flex items-center gap-2">
        <button disabled={pending} className="btn-gold text-[13px] disabled:opacity-50">{pending ? "Adding…" : "Add event"}</button>
        <button type="button" onClick={() => setOpen(false)} className="text-[13px] prose-muted underline">Cancel</button>
        {err && <span className="text-[12px] text-red-700">{err}</span>}
      </div>
    </form>
  );
}
