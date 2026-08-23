"use client";
import { useState, useTransition } from "react";
import { attachClientDocLink } from "@/app/staff/actions";

/** Staff: attach a collaborative Google Doc (or any doc URL) to a client's Files.
 *  The client can open & edit it; they're emailed unless the box is unchecked. */
export function ClientDocLink({ clientId }: { clientId: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const formId = `doc-${clientId}`;
  const field = "min-h-touch border border-line-warm px-3 text-[13px] outline-none focus:border-forest";
  return (
    <form
      id={formId}
      className="mt-2 flex flex-wrap items-center gap-2 border-t border-line-soft pt-3"
      action={(fd) => start(async () => {
        setMsg(""); setErr("");
        fd.set("clientId", clientId);
        const r = await attachClientDocLink(fd);
        if (r?.error) setErr(r.error);
        else { setMsg("Doc shared"); (document.getElementById(formId) as HTMLFormElement)?.reset(); }
      })}
    >
      <span className="text-[12px] font-semibold text-forest">Share a Google Doc to edit:</span>
      <input name="label" required placeholder="Document name" className={`${field} min-w-[160px]`} />
      <input name="doc_url" required placeholder="https://docs.google.com/…" className={`${field} min-w-[220px]`} />
      <label className="flex items-center gap-1.5 text-[12px] prose-muted"><input type="checkbox" name="notify" defaultChecked /> Email the client</label>
      <button disabled={pending} className="min-h-touch border border-line-warm px-3 text-[13px] text-forest disabled:opacity-50">{pending ? "Sharing…" : "Share doc"}</button>
      {msg && <span className="text-[12px] text-forest">{msg}</span>}
      {err && <span className="text-[12px] text-red-700">{err}</span>}
    </form>
  );
}
