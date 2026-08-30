"use client";
import { useState, useTransition } from "react";
import { staffRescheduleKickoff, staffCompleteKickoff } from "@/app/staff/actions";

/** Staff kickoff controls: mark completed or reschedule to a new date/time.
 *  Reschedule updates the shared calendar and emails the client + admin + team. */
export function StaffKickoffControls({ clientId }: { clientId: string }) {
  const [pending, start] = useTransition();
  const [show, setShow] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const run = (fn: () => Promise<{ error?: string } | void>, ok: string) =>
    start(async () => {
      setMsg(""); setErr("");
      const r = await fn();
      if (r && (r as any).error) setErr((r as any).error);
      else { setMsg(ok); setShow(false); }
    });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={pending} onClick={() => run(() => staffCompleteKickoff(clientId), "Marked completed ✓")}
          className="border border-forest px-2.5 py-1 text-[12px] font-medium text-forest disabled:opacity-50">Mark completed</button>
        <button type="button" onClick={() => setShow((v) => !v)} className="text-[12px] font-medium text-forest underline">Reschedule</button>
        {msg && <span className="text-[12px] font-medium text-forest">{msg}</span>}
        {err && <span className="text-[12px] text-red-700">{err}</span>}
      </div>
      {show && (
        <div className="flex flex-wrap items-end gap-2 border-l-2 border-gold bg-cream/40 p-2">
          <label className="flex flex-col text-[11px] prose-muted">Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-0.5 border border-line-warm bg-white px-2 py-1 text-[13px]" /></label>
          <label className="flex flex-col text-[11px] prose-muted">Time
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-0.5 border border-line-warm bg-white px-2 py-1 text-[13px]" /></label>
          <button type="button" disabled={pending || !date} onClick={() => run(() => staffRescheduleKickoff(clientId, date, time), "Rescheduled — everyone notified ✓")}
            className="btn-gold text-[12px] disabled:opacity-50">{pending ? "Saving…" : "Save"}</button>
          <button type="button" onClick={() => setShow(false)} className="text-[11px] prose-muted underline">Cancel</button>
        </div>
      )}
    </div>
  );
}
