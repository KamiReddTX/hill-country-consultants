"use client";
import { useState, useTransition } from "react";
import { inviteToInterview, declineApplication, sendHiringLetterToApplicant } from "@/app/staff/actions";

/** Applicant emails for Admin / Business Manager / Accounts Manager: send an
 *  interview request, send a hiring/offer letter, or decline. The message box
 *  adds specifics that go into the interview/offer email (time, format, rate,
 *  start date). Actually creating the employee is the separate "Hire" control. */
export function ApplicationDecision({ applicationId }: { applicationId: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [note, setNote] = useState("");
  const [armed, setArmed] = useState<null | "decline" | "letter">(null);

  const run = (fn: () => Promise<{ error?: string } | void>, ok: string) =>
    start(async () => {
      setMsg("");
      const r = await fn();
      setMsg(r && (r as any).error ? (r as any).error : ok);
      if (!(r && (r as any).error)) setArmed(null);
    });

  return (
    <div className="flex flex-col gap-2">
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
        placeholder="Optional message to include — interview time/format, or offer details like rate & start date…"
        className="w-full border border-line-warm bg-white px-2 py-1 text-[13px] outline-none focus:border-forest" />

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={pending}
          onClick={() => run(() => inviteToInterview(applicationId, note), "Interview request sent ✓")}
          className="border border-forest px-3 py-1 text-[13px] font-medium text-forest disabled:opacity-50">Send interview request</button>

        {armed === "letter" ? (
          <span className="flex items-center gap-2">
            <span className="text-[12px] prose-muted">Send the hiring letter?</span>
            <button type="button" disabled={pending} onClick={() => run(() => sendHiringLetterToApplicant(applicationId, note), "Hiring letter sent ✓")}
              className="border border-gold bg-cream px-2 py-1 text-[12px] font-semibold text-forest disabled:opacity-50">{pending ? "Sending…" : "Confirm"}</button>
            <button type="button" onClick={() => setArmed(null)} className="text-[12px] prose-muted underline">Cancel</button>
          </span>
        ) : (
          <button type="button" disabled={pending} onClick={() => setArmed("letter")} className="btn-gold text-[12px] disabled:opacity-50">Send hiring letter</button>
        )}

        {armed === "decline" ? (
          <span className="flex items-center gap-2">
            <span className="text-[12px] prose-muted">Email a decline?</span>
            <button type="button" disabled={pending} onClick={() => run(() => declineApplication(applicationId), "Decline sent")}
              className="border border-red-700 px-2 py-1 text-[12px] font-semibold text-red-700 disabled:opacity-50">{pending ? "Sending…" : "Confirm"}</button>
            <button type="button" onClick={() => setArmed(null)} className="text-[12px] prose-muted underline">Cancel</button>
          </span>
        ) : (
          <button type="button" disabled={pending} onClick={() => setArmed("decline")} className="border border-red-700 px-3 py-1 text-[13px] font-medium text-red-700 disabled:opacity-50">Send decline letter</button>
        )}

        {msg && <span className="text-[12px] font-medium text-forest">{msg}</span>}
      </div>
    </div>
  );
}
