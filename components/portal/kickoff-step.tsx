"use client";

import { useState, useTransition } from "react";
import { markKickoffScheduled, rescheduleKickoff, completeKickoff } from "@/app/portal/actions";

/** Kickoff controls for the client dashboard: book/mark scheduled, reschedule to
 *  a new date/time (in-app picker → shared calendar + email to team), and mark
 *  the call completed. */
export function KickoffStep({ url, done, completed, kickoffAt }: { url: string; done: boolean; completed?: boolean; kickoffAt?: string | null }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [showResched, setShowResched] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");

  const run = (fn: () => Promise<{ error?: string } | void>, ok: string) =>
    start(async () => {
      setError(""); setMsg("");
      const r = await fn();
      if (r && (r as any).error) setError((r as any).error);
      else { setMsg(ok); setShowResched(false); }
    });

  const reschedulePanel = showResched && (
    <div className="mt-2 flex flex-wrap items-end gap-2 border-l-2 border-gold bg-cream/40 p-3">
      <label className="flex flex-col text-[12px] prose-muted">New date
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-0.5 border border-line-warm bg-white px-2 py-1 text-[14px] text-charcoal" />
      </label>
      <label className="flex flex-col text-[12px] prose-muted">Time
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-0.5 border border-line-warm bg-white px-2 py-1 text-[14px] text-charcoal" />
      </label>
      <button type="button" disabled={pending || !date}
        onClick={() => run(() => rescheduleKickoff(date, time), "Rescheduled — your team has been notified.")}
        className="btn-gold text-[13px] disabled:opacity-50">{pending ? "Saving…" : "Save new time"}</button>
      <button type="button" onClick={() => setShowResched(false)} className="text-[12px] prose-muted underline">Cancel</button>
    </div>
  );

  if (completed) {
    return (
      <div className="mt-3 flex flex-col gap-1">
        <span className="text-[13px] font-semibold text-forest">✓ Kickoff call completed</span>
        <button type="button" onClick={() => setShowResched((v) => !v)} className="self-start text-[12px] text-forest underline underline-offset-2 hover:text-gold">Need another session? Reschedule</button>
        {reschedulePanel}
        {msg && <span className="text-[12px] font-medium text-forest">{msg}</span>}
        {error && <span className="text-[12px] text-red-700">{error}</span>}
      </div>
    );
  }

  if (done) {
    return (
      <div className="mt-3 flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-forest">✓ Kickoff call scheduled{kickoffAt ? ` — ${new Date(kickoffAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}` : ""}</span>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" disabled={pending} onClick={() => run(() => completeKickoff(), "Marked completed ✓")}
            className="border border-forest px-3 py-1 text-[13px] font-medium text-forest disabled:opacity-50">Mark completed</button>
          <button type="button" onClick={() => setShowResched((v) => !v)} className="text-[13px] font-medium text-forest underline underline-offset-2 hover:text-gold">Reschedule</button>
        </div>
        {reschedulePanel}
        {msg && <span className="text-[12px] font-medium text-forest">{msg}</span>}
        {error && <span className="text-[12px] text-red-700">{error}</span>}
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn-gold text-[14px]">Schedule your kickoff call</a>
        <button type="button" disabled={pending}
          onClick={() => run(() => markKickoffScheduled(), "Marked scheduled ✓")}
          className="text-[13px] font-medium text-forest underline underline-offset-2 hover:text-gold disabled:opacity-50">
          {pending ? "Saving…" : "I've booked it — mark scheduled"}
        </button>
        <button type="button" onClick={() => setShowResched((v) => !v)} className="text-[13px] font-medium text-forest underline underline-offset-2 hover:text-gold">Pick a time in-app</button>
      </div>
      {reschedulePanel}
      {msg && <span className="text-[13px] font-medium text-forest">{msg}</span>}
      {error && <span className="text-[13px] text-red-700">{error}</span>}
    </div>
  );
}
