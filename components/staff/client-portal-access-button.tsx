"use client";
import { useState, useTransition } from "react";
import { sendPasswordReset } from "@/app/staff/actions";

/** Staff: (re)send a client their portal password link — works whether they
 *  never activated (invite) or forgot (recovery). Lands on the set-password screen. */
export function ClientPortalAccessButton({ email }: { email: string | null }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  if (!email) return null;
  return (
    <span className="flex items-center gap-2">
      <button type="button" disabled={pending}
        onClick={() => start(async () => {
          setMsg(""); setErr("");
          const r = await sendPasswordReset(email, "client");
          if (r?.error) setErr(r.error); else setMsg("Portal link emailed");
        })}
        className="min-h-touch border border-line-warm px-3 text-[12px] text-forest disabled:opacity-50">
        {pending ? "Sending…" : "Send portal password link"}
      </button>
      {msg && <span className="text-[12px] text-forest">{msg}</span>}
      {err && <span className="text-[12px] text-red-700">{err}</span>}
    </span>
  );
}
