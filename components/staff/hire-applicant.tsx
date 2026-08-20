"use client";
import { useState, useTransition } from "react";
import { hireFromApplication } from "@/app/staff/actions";

/** Convert a job application into an employee profile (pre-filled) + invite.
 *  Admin / Business Manager. */
export function HireApplicant({ applicationId, roleOptions, suggested }: {
  applicationId: string; roleOptions: readonly string[]; suggested?: string;
}) {
  const [role, setRole] = useState(suggested && roleOptions.includes(suggested as any) ? suggested : roleOptions[0]);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [armed, setArmed] = useState(false);

  return (
    <span className="flex flex-wrap items-center gap-2">
      <select value={role} onChange={(e) => setRole(e.target.value)} disabled={pending} className="min-h-touch border border-line-warm bg-white px-2 text-[13px]">
        {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      {!armed ? (
        <button type="button" onClick={() => setArmed(true)} className="btn-gold text-[13px]">Hire → create employee</button>
      ) : (
        <>
          <span className="text-[12px] prose-muted">Create employee &amp; send invite?</span>
          <button type="button" disabled={pending}
            onClick={() => start(async () => { setMsg(""); const r = await hireFromApplication(applicationId, role); setMsg(r?.error ? r.error : "Employee created & invited ✓"); if (!r?.error) setArmed(false); })}
            className="border border-forest px-2 py-1 text-[12px] font-semibold text-forest disabled:opacity-50">{pending ? "Creating…" : "Confirm"}</button>
          <button type="button" onClick={() => setArmed(false)} className="text-[12px] prose-muted underline">Cancel</button>
        </>
      )}
      {msg && <span className="text-[12px] text-forest">{msg}</span>}
    </span>
  );
}
