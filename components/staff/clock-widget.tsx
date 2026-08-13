"use client";
import { useState, useTransition } from "react";
import { clockIn, clockOut } from "@/app/staff/actions";

export function ClockWidget({ openStartedAt }: { openStartedAt: string | null }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const on = !!openStartedAt;
  const elapsed = on ? (Date.now() - new Date(openStartedAt!).getTime()) / 3600000 : 0;
  const over4 = elapsed > 4;

  return (
    <div className="border border-line-warm bg-white p-6">
      {on ? (
        <div className="flex flex-col gap-4">
          <div>
            <p className="kicker">On the clock since</p>
            <p className="font-fraunces text-[24px] text-forest">{new Date(openStartedAt!).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
            <p className="text-[14px] prose-muted">Elapsed ~{elapsed.toFixed(1)}h</p>
            {over4 && <p className="mt-2 border-l-2 border-gold bg-cream px-3 py-2 text-[13px] text-charcoal">Over 4 hours — this shift is flagged to you and to admins.</p>}
          </div>
          <button disabled={pending} onClick={() => start(async () => { const r = await clockOut(); if (r?.error) setError(r.error); })} className="btn-gold self-start">
            {pending ? "Clocking out…" : "Clock out"}
          </button>
        </div>
      ) : (
        <form className="flex flex-col gap-3" action={(fd) => start(async () => { setError(""); const r = await clockIn(fd); if (r?.error) setError(r.error); })}>
          <label className="flex flex-col gap-1.5"><span className="text-[13px] font-medium text-ink-faint">What are you working on?</span>
            <input name="note" placeholder="e.g. Submittals for Acme" className="min-h-touch border border-line-warm px-3 text-[15px] outline-none focus:border-forest" /></label>
          <button disabled={pending} className="btn-gold self-start">{pending ? "Clocking in…" : "Clock in"}</button>
        </form>
      )}
      {error && <p className="mt-2 text-[13px] text-red-700">{error}</p>}
    </div>
  );
}
