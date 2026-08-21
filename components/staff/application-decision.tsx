"use client";
import { useState, useTransition } from "react";
import { inviteToInterview, declineApplication } from "@/app/staff/actions";

/** Set up an interview (emails the applicant a booking link) or decline them
 *  (emails a polite note; résumé kept on file 6 months). Admin / Business Manager. */
export function ApplicationDecision({ applicationId }: { applicationId: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [armed, setArmed] = useState(false);

  return (
    <span className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={pending}
        onClick={() => start(async () => { setMsg(""); const r = await inviteToInterview(applicationId); setMsg(r?.error ? r.error : "Interview invite sent ✓"); })}
        className="border border-forest px-3 py-1 text-[13px] font-medium text-forest disabled:opacity-50">Set up interview</button>

      {!armed ? (
        <button type="button" disabled={pending} onClick={() => setArmed(true)} className="text-[12px] text-red-700 underline disabled:opacity-50">Decline</button>
      ) : (
        <>
          <span className="text-[12px] prose-muted">Email a decline?</span>
          <button type="button" disabled={pending}
            onClick={() => start(async () => { setMsg(""); const r = await declineApplication(applicationId); setMsg(r?.error ? r.error : "Decline sent"); if (!r?.error) setArmed(false); })}
            className="border border-red-700 px-2 py-1 text-[12px] font-semibold text-red-700 disabled:opacity-50">{pending ? "Sending…" : "Confirm decline"}</button>
          <button type="button" onClick={() => setArmed(false)} className="text-[12px] prose-muted underline">Cancel</button>
        </>
      )}
      {msg && <span className="text-[12px] text-forest">{msg}</span>}
    </span>
  );
}
